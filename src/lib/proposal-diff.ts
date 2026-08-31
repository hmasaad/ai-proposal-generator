import { money } from "./format";
import type { Proposal, ProposalSectionId } from "./types";
import { PROPOSAL_SECTIONS } from "./workflow";

export interface SectionDiff {
  sectionId: ProposalSectionId;
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

function lines(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "—";
}

export function sectionPlain(proposal: Proposal, id: ProposalSectionId): string {
  switch (id) {
    case "summary":
      return proposal.executiveSummary;
    case "understanding":
      return proposal.understanding;
    case "approach":
      return proposal.approach;
    case "scope":
      return proposal.scope
        .map(
          (item) =>
            `${item.included ? "IN" : "OUT"} ${item.title}: ${item.description}`,
        )
        .join("\n");
    case "deliverables":
      return lines(proposal.deliverables);
    case "timeline":
      return [
        proposal.timelineSummary,
        ...proposal.phases.map(
          (phase) =>
            `${phase.name} (${phase.durationWeeks}w)\n${lines(phase.objectives)}\nDeliverables: ${phase.deliverables.join("; ")}`,
        ),
      ].join("\n\n");
    case "investment":
      return [
        ...proposal.estimates.map(
          (row) =>
            `${row.role}: ${row.hours}h @ ${money(row.rate)} = ${money(row.cost)}`,
        ),
        `Contingency ${proposal.contingencyPct}%`,
        `Total ${money(proposal.totalCost)} · ${proposal.totalHours}h`,
        proposal.leanCuts?.length ? `Lean cuts:\n${lines(proposal.leanCuts)}` : "",
        proposal.paddedAdds?.length
          ? `Padded covers:\n${lines(proposal.paddedAdds)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    case "assumptions":
      return lines(proposal.assumptions);
    case "risks":
      return proposal.risks
        .map(
          (item) =>
            `${item.risk} (${item.impact}/${item.likelihood}). ${item.mitigation}`,
        )
        .join("\n");
    case "questions":
      return lines(proposal.openQuestions);
    case "weekOne":
      return lines(proposal.weekOneNeeds ?? []);
    case "next":
      return lines(proposal.nextSteps);
  }
}

export function diffProposals(before: Proposal, after: Proposal): SectionDiff[] {
  return PROPOSAL_SECTIONS.map((section) => {
    const left = sectionPlain(before, section.id).trim();
    const right = sectionPlain(after, section.id).trim();
    return {
      sectionId: section.id,
      label: section.label,
      before: left,
      after: right,
      changed: left !== right,
    };
  });
}
