import { formatPastBids } from "./accuracy";
import { PROJECT_TYPES } from "./defaults";
import type { RetrievedChunk } from "./rag/types";
import type {
  BidComparable,
  CompanyProfile,
  ProjectType,
  SourceDocument,
} from "./types";
import { formatRetrieved } from "./rag/retrieve";

export function formatSources(sources: SourceDocument[]) {
  return sources
    .map(
      (source, index) =>
        `SOURCE ${index + 1} [${source.kind}] ${source.name}\n${source.text.trim()}`,
    )
    .join("\n\n---\n\n");
}

export function formatCompany(company: CompanyProfile) {
  const rates = company.rates
    .map((row) => `- ${row.role}: ${company.currency} ${row.hourlyRate}/hr`)
    .join("\n");

  return `Vendor: ${company.name}
Positioning: ${company.tagline}
Differentiators: ${company.differentiators}
Delivery stack: ${company.techStack}
Billable hours per day per person: ${company.hoursPerDay}
Default contingency: ${company.defaultContingencyPct}%
Rate card:
${rates}`;
}

export const EXTRACT_SYSTEM = `You are a senior business analyst at a software house. You read messy client inputs (RFPs, emails, meeting notes, requirements, old proposals) and produce a precise engagement brief.

Rules:
- Only use information present in the sources. Do not invent client facts.
- Separate must-haves from nice-to-haves and implied out-of-scope.
- List unknowns that would change estimate, timeline, or legal posture if unanswered.
- Keep items short and specific. No filler.`;

export function extractPrompt(sources: SourceDocument[]) {
  return `Analyze the following client materials and extract a structured engagement brief.

${formatSources(sources)}`;
}

export const DRAFT_SYSTEM = `You are a principal (sales + delivery) at a software house. You write proposals that a COO can approve and an engineering lead can execute.

Rules:
- Be specific to THIS client. No generic "we will use agile" padding.
- Scope must be explicit: included vs excluded.
- Estimates must use the vendor rate card. The estimate table is the LIKELY band: realistic hours for must-have scope only. Nice-to-haves go in excluded scope or a later phase unless the client said they are required.
- Honor the project-type mix. Do not staff a mobile/data/integration job as a generic web app.
- leanCuts: 3–6 concrete cuts that would land an ~18% smaller (lean) bid without pretending the same scope still fits.
- paddedAdds: 3–6 specific unknowns that justify ~22% more hours (not generic "complexity").
- weekOneNeeds: concrete artifacts, access, and decisions the client must provide in week 1. Not "align stakeholders".
- Honor stated budget and deadline when possible; if they conflict with quality, say so and propose a phased cut.
- Assumptions and risks should be the ones that actually move cost or date.
- Open questions should be the minimum set needed before kickoff.
- Write in confident, plain English. No buzzword stacks.
- Apply retrieved studio memory (past proposals and logged mistakes). If a lesson conflicts with this client's written requirements, follow the client and note it in openQuestions.
- executiveSummary: 2–3 paragraphs.
- understanding and approach: 2–4 short paragraphs each.`;

export function draftPrompt(
  sources: SourceDocument[],
  company: CompanyProfile,
  briefJson: string,
  memory: RetrievedChunk[],
  projectType: ProjectType,
  pastBids: BidComparable[],
) {
  const preset = PROJECT_TYPES.find((item) => item.id === projectType);
  return `Write a complete project proposal from the brief and original sources.

VENDOR PROFILE
${formatCompany(company)}

PROJECT TYPE PRESET: ${preset?.label ?? projectType}
${preset?.mix ?? ""}
Staff extra roles from the rate card when they apply to this type.

STRUCTURED BRIEF
${briefJson}

PAST BIDS (internal calibration — do not name win/loss in client-facing prose; use them to price discovery, integrations, and exclusions)
${formatPastBids(pastBids)}

RETRIEVED STUDIO MEMORY (RAG — past proposals and mistakes; apply where relevant)
${formatRetrieved(memory)}

ORIGINAL SOURCES (for color and quotes, not extra scope)
${formatSources(sources)}

Compute estimate line items from the rate card. cost = hours * rate. Use whole hours. Include PM, design, engineering, QA, and any specialist roles on the card. contingencyPct should default to the vendor value unless the risk profile warrants more. Also fill leanCuts, paddedAdds, and weekOneNeeds.`;
}

export const REVIEW_SYSTEM = `You are a skeptical delivery director reviewing a draft proposal before it goes to a client. Tighten numbers, catch missing exclusions, and make risks honest. You must check the draft against retrieved studio memory — if we have already lost money or trust on a similar mistake, the draft should not repeat it.

Return a full corrected proposal object, not a diff. Keep the same overall structure. Recalculate cost fields so they stay consistent (cost = hours * rate).`;

export function reviewPrompt(
  company: CompanyProfile,
  draftJson: string,
  unknowns: string[],
  memory: RetrievedChunk[],
) {
  return `Review and improve this draft. Known gaps from analysis:
${unknowns.map((item) => `- ${item}`).join("\n") || "- none listed"}

VENDOR PROFILE
${formatCompany(company)}

RETRIEVED STUDIO MEMORY (RAG)
${formatRetrieved(memory)}

DRAFT
${draftJson}

Fix: unrealistic hours, missing out-of-scope items, vague assumptions, risks that are slogans, next steps that are not actionable, missing week-1 artifacts, empty leanCuts/paddedAdds, and any repeat of a retrieved mistake. Keep leanCuts, paddedAdds, and weekOneNeeds filled.`;
}

export const REVISE_SYSTEM = `You are a principal at a software house revising a live proposal for sales and a delivery PM. You rewrite only the sections they marked. Everything else must be copied exactly.

Rules:
- Honor sales/PM comments on those sections. Unresolved comments are instructions, not suggestions.
- Keep numbers consistent: cost = hours * rate. Recalculate investment lines if you touch estimates.
- Do not invent new client facts. If a comment conflicts with the brief, follow the comment and note the tension in openQuestions only if that section is marked.
- Return a complete proposal object. Unmarked sections must match the current draft character-for-character.`;

export function revisePrompt(input: {
  company: CompanyProfile;
  proposalJson: string;
  sections: string;
  instruction: string;
  comments: string;
  languageNote: string;
}) {
  return `Revise this proposal.

SECTIONS TO REWRITE (only these may change)
${input.sections}

SALES / PM INSTRUCTION
${input.instruction || "None — apply unresolved comments and tighten the marked sections."}

UNRESOLVED COMMENTS
${input.comments}

LANGUAGE
${input.languageNote}

VENDOR PROFILE
${formatCompany(input.company)}

CURRENT DRAFT (JSON)
${input.proposalJson}

Return the full proposal object. Copy unmarked sections exactly.`;
}

export const TRANSLATE_SYSTEM = `You are a bilingual proposal writer for a software house. You translate a finished proposal for the client. You must not change scope, numbers, dates, role names, or commercial intent. Only the language of the prose changes.`;

export function translatePrompt(input: {
  proposalJson: string;
  languageNote: string;
}) {
  return `Translate this proposal.

${input.languageNote}

Keep JSON structure, booleans, hours, rates, costs, contingencyPct, durationWeeks, and included flags identical. Translate titles, descriptions, and prose.

CURRENT DRAFT (JSON)
${input.proposalJson}`;
}
