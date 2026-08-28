import type { Proposal } from "./types";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function proposalToMarkdown(
  proposal: Proposal,
  currency = "USD",
): string {
  const included = proposal.scope.filter((item) => item.included);
  const excluded = proposal.scope.filter((item) => !item.included);
  const subtotal = proposal.estimates.reduce((sum, row) => sum + row.cost, 0);
  const contingency = Math.round(subtotal * (proposal.contingencyPct / 100));

  const lines = [
    `# ${proposal.projectTitle}`,
    `Prepared for ${proposal.clientName}`,
    "",
    "## Executive summary",
    proposal.executiveSummary,
    "",
    "## Understanding of the problem",
    proposal.understanding,
    "",
    "## Proposed approach",
    proposal.approach,
    "",
    "## Scope",
    "### In scope",
    ...included.map((item) => `- **${item.title}.** ${item.description}`),
    "",
    "### Out of scope",
    ...excluded.map((item) => `- **${item.title}.** ${item.description}`),
    "",
    "## Deliverables",
    ...proposal.deliverables.map((item) => `- ${item}`),
    "",
    "## Timeline",
    proposal.timelineSummary,
    "",
    ...proposal.phases.flatMap((phase) => [
      `### ${phase.name} (${phase.durationWeeks} weeks)`,
      ...phase.objectives.map((item) => `- ${item}`),
      `Deliverables: ${phase.deliverables.join("; ")}`,
      "",
    ]),
    "## Investment",
    `| Role | Hours | Rate | Cost |`,
    `| --- | ---: | ---: | ---: |`,
    ...proposal.estimates.map(
      (row) =>
        `| ${row.role} | ${row.hours} | ${money(row.rate, currency)} | ${money(row.cost, currency)} |`,
    ),
    "",
    `Subtotal: ${money(subtotal, currency)}`,
    `Contingency (${proposal.contingencyPct}%): ${money(contingency, currency)}`,
    `**Total: ${money(proposal.totalCost, currency)}** (${proposal.totalHours} hours)`,
    "",
    "## Assumptions",
    ...proposal.assumptions.map((item) => `- ${item}`),
    "",
    "## Risks",
    ...proposal.risks.map(
      (item) =>
        `- **${item.risk}** (impact ${item.impact}, likelihood ${item.likelihood}). Mitigation: ${item.mitigation}`,
    ),
    "",
    "## Open questions",
    ...proposal.openQuestions.map((item) => `- ${item}`),
    "",
    "## Next steps",
    ...proposal.nextSteps.map((item) => `- ${item}`),
  ];

  return lines.join("\n");
}
