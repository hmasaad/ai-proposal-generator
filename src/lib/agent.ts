import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { proposalDraftSchema, requirementBriefSchema } from "./schemas";
import {
  DRAFT_SYSTEM,
  EXTRACT_SYSTEM,
  REVIEW_SYSTEM,
  draftPrompt,
  extractPrompt,
  reviewPrompt,
} from "./prompts";
import type {
  AgentStepEvent,
  CompanyProfile,
  Proposal,
  SourceDocument,
} from "./types";

export type AgentEvent =
  | { type: "step"; step: AgentStepEvent }
  | { type: "proposal"; proposal: Proposal }
  | { type: "error"; message: string };

function model() {
  return openai(process.env.OPENAI_MODEL || "gpt-4o");
}

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
  onEvent: (event: AgentEvent) => void;
}) {
  const { sources, company, onEvent } = input;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Missing OPENAI_API_KEY. Copy .env.example to .env.local and add your key.",
    );
  }

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

  const extracted = await generateObject({
    model: model(),
    schema: requirementBriefSchema,
    system: EXTRACT_SYSTEM,
    prompt: extractPrompt(sources),
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
    step: { id: "estimate", label: "Building effort and cost model" },
  });

  onEvent({
    type: "step",
    step: { id: "draft", label: "Drafting the proposal" },
  });

  const drafted = await generateObject({
    model: model(),
    schema: proposalDraftSchema,
    system: DRAFT_SYSTEM,
    prompt: draftPrompt(
      sources,
      company,
      JSON.stringify(extracted.object, null, 2),
    ),
  });

  onEvent({
    type: "step",
    step: { id: "review", label: "Reviewing risks, assumptions, and numbers" },
  });

  const reviewed = await generateObject({
    model: model(),
    schema: proposalDraftSchema,
    system: REVIEW_SYSTEM,
    prompt: reviewPrompt(
      company,
      JSON.stringify(drafted.object, null, 2),
      extracted.object.unknownOrMissing,
    ),
  });

  const draft = reviewed.object;
  const rolled = totals(draft.estimates, draft.contingencyPct);

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
  };

  onEvent({ type: "proposal", proposal });
  return proposal;
}
