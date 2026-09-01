import { formatPastBids } from "./accuracy";
import { PROJECT_TYPES } from "./defaults";
import type { RetrievedChunk } from "./rag/types";
import type {
  BidComparable,
  CompanyProfile,
  ProjectType,
  RfpScore,
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

export const EXTRACT_SYSTEM = `You are a senior business analyst at a software house. You read messy client inputs (RFPs, emails, meeting notes, transcripts, requirements, old proposals) and produce a precise engagement brief.

Rules:
- Only use information present in the sources. Do not invent client facts.
- Separate must-haves from nice-to-haves and implied out-of-scope.
- List unknowns that would change estimate, timeline, or legal posture if unanswered.
- Email threads are evidence of what the client already decided or clarified. Treat later messages as overriding earlier ones when they conflict.
- Meeting transcripts are what people said on a call — quotes and intent, not extra scope. Do not turn a passing remark into a must-have unless they committed to it.
- Keep items short and specific. No filler.`;

export function extractPrompt(sources: SourceDocument[]) {
  return `Analyze the following client materials and extract a structured engagement brief.

${formatSources(sources)}`;
}

export const SCORE_SYSTEM = `You are a bid director scoring an RFP for a software house. You are honest about where we win and where we lose. This scorecard is INTERNAL — it is not shown to the client as-is.

Rules:
- Score only criteria that appear in the sources or the brief. Do not invent evaluation axes.
- ourPosition: strong (we can prove it), adequate (we can do it), weak (we are behind or under-evidenced), out (we should not claim it).
- competitorsNamed: only names the client mentioned. Empty array if none.
- strengths / weaknesses: 3–6 each, concrete. Weaknesses are things we must not overclaim.
- winThemes: 2–4 themes the draft should lean into.
- watchouts: 2–4 things that lose the bid or blow the estimate if ignored.
- bidMove on each criterion: how the proposal should treat it (lead with proof, phase, exclude, partner, ask a question).`;

export function scorePrompt(
  sources: SourceDocument[],
  company: CompanyProfile,
  briefJson: string,
) {
  return `Score this opportunity against our studio.

VENDOR PROFILE
${formatCompany(company)}

STRUCTURED BRIEF
${briefJson}

ORIGINAL SOURCES
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
- Apply retrieved studio memory (past proposals, logged mistakes, SOWs, case studies, stack standards). If a lesson conflicts with this client's written requirements, follow the client and note it in openQuestions.
- Honor the RFP scorecard: lean into strengths and win themes. Do not overclaim weaknesses. Weak or out must-haves should be excluded, phased, or proposed as a partner — never dressed up as in-scope.
- executiveSummary: 2–3 paragraphs.
- understanding and approach: 2–4 short paragraphs each.`;

export function draftPrompt(
  sources: SourceDocument[],
  company: CompanyProfile,
  briefJson: string,
  memory: RetrievedChunk[],
  projectType: ProjectType,
  pastBids: BidComparable[],
  score: RfpScore,
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

RFP / COMPETITOR SCORE (internal — lean into strengths; do not overclaim weaknesses)
${JSON.stringify(score, null, 2)}

PAST BIDS (internal calibration — do not name win/loss in client-facing prose; use them to price discovery, integrations, and exclusions)
${formatPastBids(pastBids)}

RETRIEVED STUDIO MEMORY (RAG — past proposals, mistakes, SOWs, case studies, stack standards; apply where relevant)
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
  score: RfpScore,
) {
  return `Review and improve this draft. Known gaps from analysis:
${unknowns.map((item) => `- ${item}`).join("\n") || "- none listed"}

VENDOR PROFILE
${formatCompany(company)}

RFP / COMPETITOR SCORE (internal)
${JSON.stringify(score, null, 2)}

RETRIEVED STUDIO MEMORY (RAG)
${formatRetrieved(memory)}

DRAFT
${draftJson}

Fix: unrealistic hours, missing out-of-scope items, vague assumptions, risks that are slogans, next steps that are not actionable, missing week-1 artifacts, empty leanCuts/paddedAdds, any repeat of a retrieved mistake, and any overclaim of a scored weakness. Keep leanCuts, paddedAdds, and weekOneNeeds filled.`;
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

export const KICKOFF_RAID_SYSTEM = `You are a delivery PM turning a signed software proposal into a week-1 kickoff plan and a RAID log.

Rules:
- Use only facts in the brief, scope, phases, assumptions, risks, week-1 needs, and open questions. Do not invent client systems, names, or legal facts.
- Kickoff is a working week, not a slide week. Sessions must produce artifacts (files, decisions, access), not "alignment".
- Name real attendees from stakeholders when present. If a role is missing, use the function (COO, clinic manager, IT, legal) not a fake person.
- day: relative labels like "Day 1 morning", "Day 2", "Week 1 Friday". durationMins: 30–90.
- 4–6 sessions covering: working agreement, scope bind, access/environments, the riskiest technical unknown, and legal/compliance if the brief requires it.
- RAID:
  - risk: from proposal risks (keep mitigation in notes).
  - assumption: client-provided facts that would slip date or cost if false.
  - issue: unanswered questions that block kickoff work.
  - dependency: week-1 artifacts, access, and third parties the client must supply.
- status: open for unresolved, watch for named mitigations already in the SOW.
- due: relative ("Week 1", "Before dual-run", "Day 2").
- 10–16 RAID rows. No duplicates. Titles are one sentence, specific.`;

export function kickoffRaidPrompt(briefJson: string, vendor: string) {
  return `Build the kickoff plan and RAID log from this signed brief.

VENDOR
${vendor}

SIGNED PROPOSAL / BRIEF (JSON)
${briefJson}`;
}

export const EPICS_SYSTEM = `You are a delivery lead breaking a signed SOW into Jira/Linear epics and stories.

Rules:
- One epic per proposal phase. Epic title can be the phase name. phase must match the phase name from the proposal.
- Stories are implementable slices from that phase's objectives, deliverables, and in-scope items that belong there. Do not create stories for excluded scope.
- 3–6 stories per epic. Titles are verb + object ("Import CSV/iCal provider schedules"), not epic restatements.
- description: 2–4 sentences a developer can pick up. Include the client constraint that matters (HIPAA, Entra, no PHI in SMS, etc.) when it applies.
- acceptance: 3–5 testable bullets. No "as discussed".
- estimatePoints: Fibonacci 1, 2, 3, 5, 8, 13. Discovery/workshops are 2–5, dual-run/import work is not a 2.
- labels: short kebab-case, 1–3 (booking, hipaa, identity, kickoff).
- Do not invent integrations that are out of scope.`;

export function epicsPrompt(briefJson: string) {
  return `Break this signed SOW into epics and stories for Jira and Linear.

SIGNED PROPOSAL (JSON)
${briefJson}`;
}

export const CHANGE_ORDER_SYSTEM = `You are a delivery PM writing a change order against a signed SOW. The client has asked for more (or different) work.

Rules:
- Compare the request to included and excluded scope. If it is already in the signed SOW, set inBaseline true, extraWeeks 0, empty estimates, empty addedScope, and explain in rationale and clientLetter that no CO is needed.
- If it is new or was explicitly excluded, inBaseline false. Price only the delta — do not re-quote the whole project.
- addedScope: 1–4 items, included true, written as SOW lines.
- estimates: hours by role from the vendor rate card. Whole hours. Include PM + QA on any build work. Do not invent roles that are not on the card unless the work truly needs a specialist already listed.
- extraWeeks: calendar slip if we start after the signed plan, 0 if it fits a later phase without moving go-live.
- assumptions: what must be true for this price to hold.
- clientLetter: 2–4 short paragraphs the client can sign. Name the original exclusion if any. State hours, cost (we will fill currency), and date impact. Not legal advice.
- Do not apologize. Be clear and commercial.`;

export function changeOrderPrompt(
  briefJson: string,
  companyJson: string,
  request: string,
) {
  return `Draft a change order for this request.

CLIENT REQUEST
${request}

VENDOR RATE CARD AND PROFILE
${companyJson}

SIGNED SOW / BRIEF (JSON)
${briefJson}`;
}
