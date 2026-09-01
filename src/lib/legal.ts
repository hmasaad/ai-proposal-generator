import type { CompanyProfile, Proposal } from "./types";
import { money } from "./format";

export const DEFAULT_PAYMENT_TERMS = `40% on kickoff, 40% at UAT sign-off, 20% on production go-live. Invoices are due net 15. Change orders are written and priced before work starts. Travel, third-party licenses, and client-owned SaaS seats are pass-through.`;

export const DEFAULT_MSA = `MASTER SERVICES / LEGAL TERMS (TEMPLATE)
Prepared for {{clientName}} · {{projectTitle}}
{{vendorLegal}} · {{date}}

This appendix is a working template, not executed legal advice. Have counsel review before signature.

1. Parties
This statement of work is issued under an engagement between {{vendorLegal}} (“Vendor”) and {{clientName}} (“Client”). Notices: {{address}}.

2. Scope of the SOW
The signed SOW (scope, deliverables, phases, assumptions, and exclusions) is the statement of work. Work not listed as included is out of scope until a written change order is agreed.

3. Fees
Likely investment for this SOW is {{total}} ({{hours}} hours), plus the contingency named in the commercial appendix. Payment terms: {{paymentTerms}}

4. Intellectual property
Upon full payment, Client owns custom work product created uniquely for this engagement. Vendor retains pre-existing tools, libraries, templates, and know-how, and grants Client a perpetual license to use them as embedded in the deliverables.

5. Confidentiality and data
Each party will keep the other’s non-public information confidential. If the work involves personal or health data, a BAA or DPA (as applicable) will be executed before production data is processed. Vendor will not put PHI or secrets in SMS, logs, or unsecured tickets.

6. Client responsibilities
Client will name a decision-maker, provide week-1 artifacts listed in the SOW, and review demos within five business days. Delays in access, content, or decisions slide the same number of days.

7. Change control
New systems, extra source calendars, native apps, or integrations not named in the SOW are change orders. Vendor will quote hours and effect on date before starting that work.

8. Warranty and liability
Vendor warrants professional workmanship for 30 days after go-live for defects in in-scope deliverables. Vendor’s aggregate liability under this SOW is capped at fees actually paid for the SOW, excluding fraud or willful misconduct. Neither party is liable for indirect or consequential damages.

9. Term
Either party may terminate for convenience with ten business days’ written notice. Client pays for work performed and committed third-party costs through the effective date. Vendor will hand over work product paid for.

10. Governing law
Governing law and venue to be confirmed in the executed MSA. Until then, this template does not create a binding MSA on its own.

Accepted conceptually as the terms that will sit behind the SOW, subject to counsel.`;

export function legalName(company: CompanyProfile) {
  return company.legalName?.trim() || company.name;
}

export function paymentTerms(company: CompanyProfile) {
  return company.paymentTerms?.trim() || DEFAULT_PAYMENT_TERMS;
}

export function msaTemplate(company: CompanyProfile) {
  return company.msaTemplate?.trim() || DEFAULT_MSA;
}

export function legalContext(proposal: Proposal, company: CompanyProfile) {
  return {
    vendor: company.name,
    vendorLegal: legalName(company),
    clientName: proposal.clientName,
    projectTitle: proposal.projectTitle,
    date: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(proposal.createdAt)),
    total: money(proposal.totalCost, company.currency),
    hours: String(proposal.totalHours),
    currency: company.currency,
    address: company.address?.trim() || "Address on file",
    paymentTerms: paymentTerms(company),
  };
}

export function fillLegalTemplate(template: string, proposal: Proposal, company: CompanyProfile) {
  const ctx = legalContext(proposal, company);
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return (ctx as Record<string, string>)[key] ?? "";
  });
}

export function filledMsa(proposal: Proposal, company: CompanyProfile) {
  return fillLegalTemplate(msaTemplate(company), proposal, company);
}

export function totalWeeks(proposal: Proposal) {
  return proposal.phases.reduce((sum, phase) => sum + phase.durationWeeks, 0);
}

export function investmentRollup(proposal: Proposal) {
  const subtotal = proposal.estimates.reduce((sum, row) => sum + row.cost, 0);
  const contingency = Math.round(subtotal * (proposal.contingencyPct / 100));
  return { subtotal, contingency };
}
