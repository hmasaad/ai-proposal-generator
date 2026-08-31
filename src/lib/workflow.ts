import { rollupEstimates } from "./accuracy";
import type {
  OutputLanguage,
  Proposal,
  ProposalSectionId,
  ProposalVersion,
  ReviewStatus,
  SectionComment,
} from "./types";

export const REVIEW_STATUSES: { id: ReviewStatus; label: string; hint: string }[] =
  [
    { id: "draft", label: "Draft", hint: "Sales/PM can edit and regenerate." },
    {
      id: "internal_review",
      label: "Internal review",
      hint: "Peer comments on scope, price, and risks.",
    },
    {
      id: "client_ready",
      label: "Client-ready",
      hint: "Locked for sending. Print or export.",
    },
  ];

export const OUTPUT_LANGUAGES: {
  id: OutputLanguage;
  label: string;
  dir: "ltr" | "rtl";
  instruction: string;
}[] = [
  {
    id: "en",
    label: "English",
    dir: "ltr",
    instruction: "Write in clear professional English.",
  },
  {
    id: "ur",
    label: "Urdu",
    dir: "rtl",
    instruction:
      "Write the entire client-facing proposal in fluent Urdu ( Nastaliq-friendly). Keep role names, product names, and numbers; translate surrounding prose. Do not mix English paragraphs.",
  },
  {
    id: "bilingual",
    label: "English + Urdu",
    dir: "ltr",
    instruction:
      "For every prose block and list item, write the English first, then a blank line, then the Urdu translation. Keep structure, numbers, and role names. Urdu must be complete, not a gloss.",
  },
  {
    id: "ar",
    label: "Arabic",
    dir: "rtl",
    instruction: "Write the entire client-facing proposal in professional Arabic. Keep product names and numbers.",
  },
  {
    id: "es",
    label: "Spanish",
    dir: "ltr",
    instruction: "Write the entire client-facing proposal in professional Latin American Spanish. Keep product names and numbers.",
  },
];

export const PROPOSAL_SECTIONS: {
  id: ProposalSectionId;
  label: string;
  anchor: string;
  commentable: boolean;
}[] = [
  { id: "summary", label: "Summary", anchor: "summary", commentable: false },
  { id: "understanding", label: "Problem", anchor: "understanding", commentable: false },
  { id: "approach", label: "Approach", anchor: "approach", commentable: false },
  { id: "scope", label: "Scope", anchor: "scope", commentable: true },
  { id: "deliverables", label: "Deliverables", anchor: "deliverables", commentable: false },
  { id: "timeline", label: "Timeline", anchor: "timeline", commentable: false },
  { id: "investment", label: "Price", anchor: "investment", commentable: true },
  { id: "assumptions", label: "Assumptions", anchor: "assumptions", commentable: false },
  { id: "risks", label: "Risks", anchor: "risks", commentable: true },
  { id: "questions", label: "Questions", anchor: "questions", commentable: false },
  { id: "weekOne", label: "Week 1", anchor: "week-one", commentable: false },
  { id: "next", label: "Next steps", anchor: "next", commentable: false },
];

export function languageMeta(id?: OutputLanguage) {
  return OUTPUT_LANGUAGES.find((item) => item.id === id) ?? OUTPUT_LANGUAGES[0];
}

export function unresolvedComments(proposal: Proposal) {
  return (proposal.comments ?? []).filter((item) => !item.resolved);
}

export function commentsForSection(proposal: Proposal, sectionId: ProposalSectionId) {
  return (proposal.comments ?? []).filter((item) => item.sectionId === sectionId);
}

export function applyInvestment(proposal: Proposal): Proposal {
  const rolled = rollupEstimates(proposal.estimates, proposal.contingencyPct);
  return {
    ...proposal,
    estimates: rolled.lines,
    totalHours: rolled.totalHours,
    totalCost: rolled.totalCost,
    estimateBands: rolled.estimateBands,
  };
}

const SECTION_KEYS: Record<ProposalSectionId, (keyof Proposal)[]> = {
  summary: ["executiveSummary"],
  understanding: ["understanding"],
  approach: ["approach"],
  scope: ["scope"],
  deliverables: ["deliverables"],
  timeline: ["timelineSummary", "phases"],
  investment: ["estimates", "contingencyPct", "leanCuts", "paddedAdds"],
  assumptions: ["assumptions"],
  risks: ["risks"],
  questions: ["openQuestions"],
  weekOne: ["weekOneNeeds"],
  next: ["nextSteps"],
};

export function mergeGeneratedSections(
  current: Proposal,
  generated: Proposal,
  sections: ProposalSectionId[],
): Proposal {
  let next: Proposal = { ...current };
  for (const section of sections) {
    for (const key of SECTION_KEYS[section]) {
      const value = generated[key];
      if (value !== undefined) {
        (next as unknown as Record<string, unknown>)[key] = value;
      }
    }
  }
  if (generated.clientName) next.clientName = generated.clientName;
  if (generated.projectTitle) next.projectTitle = generated.projectTitle;
  if (sections.includes("investment")) {
    next = applyInvestment(next);
  }
  next.updatedAt = new Date().toISOString();
  if (next.reviewStatus === "client_ready") {
    next.reviewStatus = "internal_review";
  }
  return next;
}

export function slimProposal(proposal: Proposal): Proposal {
  const { retrievedMemory: _memory, ...rest } = proposal;
  return rest;
}

export function makeVersion(proposal: Proposal, label: string): ProposalVersion {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    label,
    language: proposal.language ?? "en",
    status: proposal.reviewStatus ?? "draft",
    snapshot: slimProposal(proposal),
  };
}

export function formatCommentsForPrompt(comments: SectionComment[]) {
  const open = comments.filter((item) => !item.resolved);
  if (!open.length) return "None.";
  return open
    .map((item) => `- [${item.sectionId}] ${item.author}: ${item.body}`)
    .join("\n");
}

export function sectionLabels(ids: ProposalSectionId[]) {
  return ids
    .map((id) => PROPOSAL_SECTIONS.find((item) => item.id === id)?.label ?? id)
    .join(", ");
}
