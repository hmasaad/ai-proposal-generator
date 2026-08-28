import type { CompanyProfile, SourceDocument } from "./types";

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
- Estimates must use the vendor rate card. Hours should be realistic for the must-have scope only. Nice-to-haves go in excluded scope or a later phase unless the client said they are required.
- Honor stated budget and deadline when possible; if they conflict with quality, say so and propose a phased cut.
- Assumptions and risks should be the ones that actually move cost or date.
- Open questions should be the minimum set needed before kickoff.
- Write in confident, plain English. No buzzword stacks.
- executiveSummary: 2–3 paragraphs.
- understanding and approach: 2–4 short paragraphs each.`;

export function draftPrompt(
  sources: SourceDocument[],
  company: CompanyProfile,
  briefJson: string,
) {
  return `Write a complete project proposal from the brief and original sources.

VENDOR PROFILE
${formatCompany(company)}

STRUCTURED BRIEF
${briefJson}

ORIGINAL SOURCES (for color and quotes, not extra scope)
${formatSources(sources)}

Compute estimate line items from the rate card. cost = hours * rate. Use whole hours. Include PM, design, engineering, and QA as appropriate. contingencyPct should default to the vendor value unless the risk profile warrants more.`;
}

export const REVIEW_SYSTEM = `You are a skeptical delivery director reviewing a draft proposal before it goes to a client. Tighten numbers, catch missing exclusions, and make risks honest.

Return a full corrected proposal object, not a diff. Keep the same overall structure. Recalculate cost fields so they stay consistent (cost = hours * rate).`;

export function reviewPrompt(
  company: CompanyProfile,
  draftJson: string,
  unknowns: string[],
) {
  return `Review and improve this draft. Known gaps from analysis:
${unknowns.map((item) => `- ${item}`).join("\n") || "- none listed"}

VENDOR PROFILE
${formatCompany(company)}

DRAFT
${draftJson}

Fix: unrealistic hours, missing out-of-scope items, vague assumptions, risks that are slogans, and next steps that are not actionable.`;
}
