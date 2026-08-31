import {
  computeBands,
  ratesForType,
  similarBids,
  weekOneNeeds,
} from "./accuracy";
import { generateStructured } from "./model";
import {
  proposalDraftJsonSchema,
  proposalDraftSchema,
  requirementBriefJsonSchema,
  requirementBriefSchema,
} from "./schemas";
import {
  DRAFT_SYSTEM,
  EXTRACT_SYSTEM,
  REVIEW_SYSTEM,
  draftPrompt,
  extractPrompt,
  reviewPrompt,
} from "./prompts";
import { indexProposal, retrieveContext } from "./rag/retrieve";
import type {
  AgentStepEvent,
  BidComparable,
  CompanyProfile,
  Lesson,
  ProjectType,
  Proposal,
  SourceDocument,
} from "./types";

export type AgentEvent =
  | { type: "step"; step: AgentStepEvent }
  | { type: "proposal"; proposal: Proposal }
  | { type: "error"; message: string };

function totals(
  estimates: { role: string; hours: number; rate: number; cost: number }[],
  contingencyPct: number,
) {
  const lines = estimates.map((row) => ({
    role: row.role,
    hours: Math.max(0, Math.round(row.hours)),
    rate: Math.max(0, row.rate),
    cost: Math.max(0, Math.round(row.hours) * row.rate),
  }));
  const subtotal = lines.reduce((sum, row) => sum + row.cost, 0);
  const totalHours = lines.reduce((sum, row) => sum + row.hours, 0);
  const totalCost = Math.round(subtotal * (1 + contingencyPct / 100));
  return { lines, totalHours, totalCost };
}

export async function runProposalAgent(input: {
  sources: SourceDocument[];
  company: CompanyProfile;
  lessons?: Lesson[];
  projectType?: ProjectType;
  pastBids?: BidComparable[];
  onEvent: (event: AgentEvent) => void;
}) {
  const {
    sources,
    lessons = [],
    projectType = "web",
    pastBids = [],
    onEvent,
  } = input;
  const company = ratesForType(input.company, projectType);

  if (!sources.length || sources.every((source) => !source.text.trim())) {
    throw new Error("Add at least one source with content before generating.");
  }

  onEvent({
    type: "step",
    step: {
      id: "ingest",
      label: "Reading sources",
      detail: `${sources.length} document${sources.length === 1 ? "" : "s"} loaded`,
    },
  });

  onEvent({
    type: "step",
    step: { id: "extract", label: "Extracting requirements and constraints" },
  });

  const extracted = await generateStructured({
    schema: requirementBriefSchema,
    jsonSchema: requirementBriefJsonSchema,
    system: EXTRACT_SYSTEM,
    prompt: extractPrompt(sources),
  });

  onEvent({
    type: "step",
    step: {
      id: "learn",
      label: "Retrieving past proposals and mistakes",
    },
  });

  const memory = await retrieveContext(sources, lessons);

  onEvent({
    type: "step",
    step: {
      id: "learn",
      label: "Retrieving past proposals and mistakes",
      detail:
        memory.length === 0
          ? "No studio memory yet"
          : `${memory.length} chunk${memory.length === 1 ? "" : "s"} from RAG`,
    },
  });

  onEvent({
    type: "step",
    step: {
      id: "scope",
      label: "Defining scope, phases, and exclusions",
      detail: extracted.object.projectTitle,
    },
  });

  onEvent({
    type: "step",
    step: {
      id: "estimate",
      label: "Building effort and cost model",
      detail: `${projectType} rate mix · likely / lean / padded bands`,
    },
  });

  onEvent({
    type: "step",
    step: { id: "draft", label: "Drafting the proposal with retrieved memory" },
  });

  const drafted = await generateStructured({
    schema: proposalDraftSchema,
    jsonSchema: proposalDraftJsonSchema,
    system: DRAFT_SYSTEM,
    prompt: draftPrompt(
      sources,
      company,
      JSON.stringify(extracted.object, null, 2),
      memory,
      projectType,
      pastBids,
    ),
  });

  onEvent({
    type: "step",
    step: {
      id: "review",
      label: "Reviewing against retrieved mistakes",
    },
  });

  const reviewed = await generateStructured({
    schema: proposalDraftSchema,
    jsonSchema: proposalDraftJsonSchema,
    system: REVIEW_SYSTEM,
    prompt: reviewPrompt(
      company,
      JSON.stringify(drafted.object, null, 2),
      extracted.object.unknownOrMissing,
      memory,
    ),
  });

  const draft = reviewed.object;
  const rolled = totals(draft.estimates, draft.contingencyPct);
  const bands = computeBands(rolled.totalHours, rolled.totalCost);
  const comparables = similarBids(pastBids, {
    projectType,
    hours: rolled.totalHours,
    cost: rolled.totalCost,
  });

  const proposal: Proposal = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    clientName: draft.clientName,
    projectTitle: draft.projectTitle,
    executiveSummary: draft.executiveSummary,
    understanding: draft.understanding,
    approach: draft.approach,
    scope: draft.scope,
    deliverables: draft.deliverables,
    phases: draft.phases,
    estimates: rolled.lines,
    totalHours: rolled.totalHours,
    totalCost: rolled.totalCost,
    contingencyPct: draft.contingencyPct,
    timelineSummary: draft.timelineSummary,
    assumptions: draft.assumptions,
    risks: draft.risks,
    openQuestions: draft.openQuestions,
    nextSteps: draft.nextSteps,
    brief: extracted.object,
    projectType,
    estimateBands: bands,
    leanCuts: draft.leanCuts ?? [],
    paddedAdds: draft.paddedAdds ?? [],
    weekOneNeeds: weekOneNeeds(
      draft.weekOneNeeds,
      draft.openQuestions,
      extracted.object.unknownOrMissing,
    ),
    comparables,
    outcome: "draft",
    appliedLessonIds: memory
      .filter((hit) => hit.sourceType === "lesson")
      .map((hit) => hit.sourceId),
    retrievedMemory: memory.map((hit) => ({
      id: hit.id,
      title: hit.title,
      sourceType: hit.sourceType,
      text: hit.text,
      score: hit.score,
    })),
  };

  void indexProposal(proposal).catch(() => undefined);

  onEvent({ type: "proposal", proposal });
  return proposal;
}
