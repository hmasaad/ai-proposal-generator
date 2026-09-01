import {
  computeBands,
  ratesForType,
  rollupEstimates,
  similarBids,
  weekOneNeeds,
} from "./accuracy";
import { addUsage, emptyUsage } from "./pricing";
import { generateStructured } from "./model";
import { isFreeTierQuota } from "./model-errors";
import {
  proposalDraftJsonSchema,
  proposalDraftSchema,
  requirementBriefJsonSchema,
  requirementBriefSchema,
  rfpScoreJsonSchema,
  rfpScoreSchema,
} from "./schemas";
import {
  EXTRACT_SYSTEM,
  REVIEW_SYSTEM,
  REVISE_SYSTEM,
  SCORE_SYSTEM,
  TRANSLATE_SYSTEM,
  extractPrompt,
  reviewPrompt,
  revisePrompt,
  scorePrompt,
  translatePrompt,
} from "./prompts";
import { withStudioChecks } from "./win-probability";
import { indexProposal, retrieveContext } from "./rag/retrieve";
import { runProposalWriter } from "./writer-agent";
import type {
  AgentStepEvent,
  BidComparable,
  CompanyProfile,
  KnowledgeDoc,
  Lesson,
  ModelUsage,
  OutputLanguage,
  ProjectType,
  Proposal,
  ProposalSectionId,
  SourceDocument,
} from "./types";
import {
  formatCommentsForPrompt,
  languageMeta,
  mergeGeneratedSections,
  sectionLabels,
} from "./workflow";

export type AgentEvent =
  | { type: "step"; step: AgentStepEvent }
  | { type: "proposal"; proposal: Proposal }
  | { type: "usage"; usage: ModelUsage }
  | { type: "error"; message: string };

function totals(
  estimates: { role: string; hours: number; rate: number; cost: number }[],
  contingencyPct: number,
) {
  const rolled = rollupEstimates(estimates, contingencyPct);
  return {
    lines: rolled.lines,
    totalHours: rolled.totalHours,
    totalCost: rolled.totalCost,
  };
}

export async function runProposalAgent(input: {
  sources: SourceDocument[];
  company: CompanyProfile;
  lessons?: Lesson[];
  knowledge?: KnowledgeDoc[];
  projectType?: ProjectType;
  pastBids?: BidComparable[];
  onEvent: (event: AgentEvent) => void;
}) {
  const {
    sources,
    lessons = [],
    knowledge = [],
    projectType = "web",
    pastBids = [],
    onEvent,
  } = input;
  const company = ratesForType(input.company, projectType);
  let usage = emptyUsage();

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
  usage = addUsage(usage, extracted.usage);

  onEvent({
    type: "step",
    step: { id: "score", label: "Scoring fit, competitors, and bid posture" },
  });

  const scored = await generateStructured({
    schema: rfpScoreSchema,
    jsonSchema: rfpScoreJsonSchema,
    system: SCORE_SYSTEM,
    prompt: scorePrompt(sources, company, JSON.stringify(extracted.object, null, 2)),
  });
  usage = addUsage(usage, scored.usage);

  onEvent({
    type: "step",
    step: {
      id: "score",
      label: "Scoring fit, competitors, and bid posture",
      detail:
        scored.object.weaknesses[0]
          ? `Weak on ${scored.object.weaknesses[0].slice(0, 72)}`
          : `${scored.object.criteria.length} criteria`,
    },
  });

  onEvent({
    type: "step",
    step: {
      id: "learn",
      label: "Retrieving past proposals, knowledge, and mistakes",
    },
  });

  const memory = await retrieveContext(sources, lessons, knowledge);

  onEvent({
    type: "step",
    step: {
      id: "learn",
      label: "Retrieving past proposals, knowledge, and mistakes",
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
      label: "Writer outlining scope and phases",
      detail: extracted.object.projectTitle,
    },
  });

  const written = await runProposalWriter({
    sources,
    company,
    briefJson: JSON.stringify(extracted.object, null, 2),
    score: scored.object,
    memory,
    projectType,
    pastBids,
    onStep: (id, label, detail) => {
      onEvent({ type: "step", step: { id, label, detail } });
    },
  });
  usage = addUsage(usage, written.usage);

  onEvent({
    type: "step",
    step: {
      id: "review",
      label: "Reviewing against retrieved mistakes",
    },
  });

  let draft = written.draft;
  try {
    const reviewed = await generateStructured({
      schema: proposalDraftSchema,
      jsonSchema: proposalDraftJsonSchema,
      system: REVIEW_SYSTEM,
      prompt: reviewPrompt(
        company,
        JSON.stringify(written.draft, null, 2),
        extracted.object.unknownOrMissing,
        memory,
        scored.object,
      ),
    });
    usage = addUsage(usage, reviewed.usage);
    draft = reviewed.object;
  } catch (error) {
    if (!isFreeTierQuota(error)) throw error;
    onEvent({
      type: "step",
      step: {
        id: "review",
        label: "Review skipped — Gemini free-tier quota hit",
        detail: "Keeping the writer draft. Quality gate still runs.",
      },
    });
  }
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
    reviewStatus: "draft",
    language: "en",
    comments: [],
    rfpScore: scored.object,
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

  onEvent({
    type: "step",
    step: { id: "validate", label: "Running validation evals" },
  });
  const checked = withStudioChecks(proposal, company, { sources, history: pastBids });
  const report = checked.validation;
  const win = checked.winProbability;
  onEvent({
    type: "step",
    step: {
      id: "validate",
      label: "Running validation evals",
      detail: [
        report
          ? `${report.score}/100 · ${report.errorCount} error${report.errorCount === 1 ? "" : "s"}`
          : null,
        win ? `${win.percent}% win` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    },
  });

  void indexProposal(checked).catch(() => undefined);

  onEvent({ type: "usage", usage });
  onEvent({ type: "proposal", proposal: checked });
  return checked;
}

function generatedAsProposal(
  draft: Proposal,
  current: Proposal,
): Proposal {
  const rolled = rollupEstimates(draft.estimates, draft.contingencyPct);
  return {
    ...current,
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
    estimateBands: rolled.estimateBands,
    leanCuts: draft.leanCuts ?? current.leanCuts,
    paddedAdds: draft.paddedAdds ?? current.paddedAdds,
    weekOneNeeds: draft.weekOneNeeds ?? current.weekOneNeeds,
  };
}

export async function reviseProposalSections(input: {
  proposal: Proposal;
  company: CompanyProfile;
  sections: ProposalSectionId[];
  instruction?: string;
  language?: OutputLanguage;
}) {
  if (!input.sections.length) {
    throw new Error("Mark at least one section to regenerate.");
  }

  const language = languageMeta(input.language ?? input.proposal.language);
  const drafted = await generateStructured({
    schema: proposalDraftSchema,
    jsonSchema: proposalDraftJsonSchema,
    system: REVISE_SYSTEM,
    prompt: revisePrompt({
      company: input.company,
      proposalJson: JSON.stringify(input.proposal, null, 2),
      sections: sectionLabels(input.sections),
      instruction: input.instruction?.trim() ?? "",
      comments: formatCommentsForPrompt(input.proposal.comments ?? []),
      languageNote: language.instruction,
    }),
  });

  const generated = generatedAsProposal(drafted.object as Proposal, input.proposal);
  return {
    proposal: mergeGeneratedSections(input.proposal, generated, input.sections),
    usage: drafted.usage,
  };
}

export async function translateProposal(input: {
  proposal: Proposal;
  language: OutputLanguage;
}) {
  const language = languageMeta(input.language);
  const drafted = await generateStructured({
    schema: proposalDraftSchema,
    jsonSchema: proposalDraftJsonSchema,
    system: TRANSLATE_SYSTEM,
    prompt: translatePrompt({
      proposalJson: JSON.stringify(input.proposal, null, 2),
      languageNote: language.instruction,
    }),
  });

  const generated = generatedAsProposal(drafted.object as Proposal, input.proposal);
  const next = mergeGeneratedSections(
    input.proposal,
    generated,
    [
      "summary",
      "understanding",
      "approach",
      "scope",
      "deliverables",
      "timeline",
      "investment",
      "assumptions",
      "risks",
      "questions",
      "weekOne",
      "next",
    ],
  );
  next.language = input.language;
  next.reviewStatus =
    next.reviewStatus === "client_ready" ? "internal_review" : next.reviewStatus;
  return { proposal: next, usage: drafted.usage };
}
