import { rollupEstimates } from "./accuracy";
import { money } from "./format";
import type {
  ChangeOrder,
  DeliveryEpic,
  DeliveryPack,
  DeliveryStory,
  EstimateLine,
  KickoffPlan,
  Proposal,
  RaidItem,
} from "./types";

export function deliveryContext(proposal: Proposal) {
  return {
    clientName: proposal.clientName,
    projectTitle: proposal.projectTitle,
    brief: proposal.brief,
    weekOneNeeds: proposal.weekOneNeeds ?? [],
    scope: proposal.scope,
    phases: proposal.phases,
    deliverables: proposal.deliverables,
    timelineSummary: proposal.timelineSummary,
    assumptions: proposal.assumptions,
    risks: proposal.risks,
    openQuestions: proposal.openQuestions,
    nextSteps: proposal.nextSteps,
    estimates: proposal.estimates,
    totalHours: proposal.totalHours,
    totalCost: proposal.totalCost,
    contingencyPct: proposal.contingencyPct,
  };
}

export function epicPrefix(title: string) {
  const skip = new Set(["the", "and", "for", "a", "an", "of", "to"]);
  const letters = title
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !skip.has(word.toLowerCase()))
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "DEL";
}

function pmOwner(proposal: Proposal) {
  return proposal.brief.stakeholders[0] || "Engagement lead";
}

export function seedKickoff(proposal: Proposal): KickoffPlan {
  const people = proposal.brief.stakeholders;
  const it = people.find((name) => /it|tech|dana|eng/i.test(name)) || "Client IT";
  const ops = people.find((name) => /clinic|ops|manager|james/i.test(name)) || "Ops lead";
  const exec = people[0] || "Client sponsor";
  const needs = proposal.weekOneNeeds?.length
    ? proposal.weekOneNeeds
    : proposal.openQuestions.slice(0, 5);

  return {
    generatedAt: new Date().toISOString(),
    goal: `Bind ${proposal.projectTitle} to the signed SOW, collect week-1 artifacts, and start the riskiest unknown before polish.`,
    sessions: [
      {
        title: "Working agreement and decision rights",
        day: "Day 1 morning",
        durationMins: 45,
        attendees: [exec, "Engagement lead"],
        agenda: [
          "Confirm sponsor, day-to-day owner, and who can bind scope",
          "Walk the in/out list from the signed SOW",
          "Agree demo cadence and RAID review",
        ],
        outputs: ["Named decision-maker", "Written working agreement"],
      },
      {
        title: "Scope bind workshop",
        day: "Day 1 afternoon",
        durationMins: 90,
        attendees: [exec, ops, "Engagement lead", "Product designer"],
        agenda: needs.slice(0, 4),
        outputs: ["Scope addendum notes", "Open questions closed or parked on RAID"],
      },
      {
        title: "Access, environments, and source files",
        day: "Day 2",
        durationMins: 60,
        attendees: [it, "Senior engineer"],
        agenda: [
          "List accounts, SSO, and hosting constraints",
          "Collect sample exports named in week-1 needs",
          "Confirm who grants production-adjacent access",
        ],
        outputs: ["Access checklist with owners", "Sample files in the project drive"],
      },
      {
        title: "Riskiest technical unknown",
        day: "Day 3",
        durationMins: 75,
        attendees: [it, ops, "Senior engineer"],
        agenda: [
          proposal.risks[0]?.risk || "Walk the highest-impact risk in the SOW",
          proposal.risks[0]?.mitigation || "Agree the first mitigation step this week",
        ],
        outputs: ["Mitigation started", "RAID row updated"],
      },
    ],
    accessNeeded: needs.slice(0, 6),
    decisionsNeeded: proposal.openQuestions.slice(0, 6),
    communications: [
      "Weekly demo to the named decision-maker",
      "RAID reviewed every Friday; slips written the same day",
      "Change requests paused until a priced change order is signed",
    ],
  };
}

export function seedRaid(proposal: Proposal): RaidItem[] {
  const owner = pmOwner(proposal);
  const rows: RaidItem[] = [];

  proposal.risks.forEach((item, index) => {
    rows.push({
      id: `raid-risk-${index}`,
      kind: "risk",
      title: item.risk,
      owner,
      due: item.impact === "high" ? "Week 1" : "Week 3",
      status: item.likelihood === "high" ? "open" : "watch",
      notes: item.mitigation,
    });
  });

  proposal.assumptions.forEach((item, index) => {
    rows.push({
      id: `raid-assumption-${index}`,
      kind: "assumption",
      title: item,
      owner: /legal|baa|entra|csv|export|dana|client/i.test(item)
        ? proposal.brief.stakeholders.find((name) => /legal|it|dana/i.test(name)) || owner
        : owner,
      due: "Week 1",
      status: "open",
      notes: "If this fails, recut date or raise a change order before continuing.",
    });
  });

  proposal.openQuestions.forEach((item, index) => {
    rows.push({
      id: `raid-issue-${index}`,
      kind: "issue",
      title: item,
      owner: owner,
      due: "Day 2",
      status: "open",
      notes: "Blocks kickoff quality if unanswered.",
    });
  });

  (proposal.weekOneNeeds ?? []).forEach((item, index) => {
    rows.push({
      id: `raid-dep-${index}`,
      kind: "dependency",
      title: item,
      owner:
        proposal.brief.stakeholders.find((name) => /it|dana|legal/i.test(name)) ||
        "Client",
      due: "Week 1",
      status: "open",
      notes: "Client-supplied. Delivery date slides with this artifact.",
    });
  });

  return rows;
}

export function seedEpics(proposal: Proposal): DeliveryEpic[] {
  const prefix = epicPrefix(proposal.projectTitle);
  const included = proposal.scope.filter((item) => item.included);
  let storyN = 1;

  return proposal.phases.map((phase, index) => {
    const fromPhase: Omit<DeliveryStory, "key">[] = [
      ...phase.objectives.map((objective) => ({
        title: objective,
        description: `${objective} for ${proposal.clientName}, in phase “${phase.name}”.`,
        acceptance: phase.deliverables.slice(0, 3),
        estimatePoints: 5,
        labels: ["phase"],
      })),
      ...phase.deliverables.map((deliverable) => ({
        title: `Deliver: ${deliverable}`,
        description: `${deliverable} is a named deliverable of “${phase.name}”.`,
        acceptance: [`${deliverable} accepted by the named decision-maker`],
        estimatePoints: 3,
        labels: ["deliverable"],
      })),
    ];

    const fromScope =
      index === 0
        ? included.slice(0, Math.ceil(included.length / proposal.phases.length))
        : included.slice(
            Math.ceil((included.length / proposal.phases.length) * index),
            Math.ceil((included.length / proposal.phases.length) * (index + 1)),
          );

    const scopeStories: Omit<DeliveryStory, "key">[] = fromScope.map((item) => ({
      title: item.title,
      description: item.description,
      acceptance: [`${item.title} behaves as described in the signed SOW`],
      estimatePoints: 5,
      labels: ["scope"],
    }));

    const unique = [...fromPhase, ...scopeStories].slice(0, 6).map((story) => ({
      ...story,
      key: `${prefix}-${storyN++}`,
    }));

    return {
      key: `${prefix}-E${index + 1}`,
      title: phase.name,
      phase: phase.name,
      summary: `${phase.durationWeeks} weeks. ${phase.objectives[0] ?? phase.name}`,
      stories: unique,
    };
  });
}

export function seedDelivery(proposal: Proposal): DeliveryPack {
  return {
    generatedAt: new Date().toISOString(),
    kickoff: proposal.delivery?.kickoff ?? seedKickoff(proposal),
    raid: proposal.delivery?.raid?.length ? proposal.delivery.raid : seedRaid(proposal),
    epics: proposal.delivery?.epics?.length ? proposal.delivery.epics : seedEpics(proposal),
    changeOrders: proposal.delivery?.changeOrders ?? [],
  };
}

export function mergeEstimateLines(
  existing: EstimateLine[],
  added: EstimateLine[],
  contingencyPct: number,
) {
  const byRole = new Map<string, EstimateLine>();
  for (const line of existing) {
    byRole.set(line.role, { ...line });
  }
  for (const line of added) {
    const current = byRole.get(line.role);
    if (current) {
      const hours = current.hours + line.hours;
      byRole.set(line.role, { ...current, hours, cost: hours * current.rate });
    } else {
      byRole.set(line.role, { ...line });
    }
  }
  return rollupEstimates([...byRole.values()], contingencyPct);
}

function similarTitle(a: string, b: string) {
  const tokens = (text: string) =>
    text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3);
  const needle = new Set(tokens(b));
  return tokens(a).some((word) => needle.has(word));
}

export function applyChangeOrder(proposal: Proposal, order: ChangeOrder): Proposal {
  if (order.inBaseline || order.appliedAt) return proposal;
  const rolled = mergeEstimateLines(
    proposal.estimates,
    order.estimates,
    proposal.contingencyPct,
  );
  const extra = order.extraWeeks;
  const phases =
    extra > 0 && proposal.phases.length
      ? proposal.phases.map((phase, index) =>
          index === proposal.phases.length - 1
            ? { ...phase, durationWeeks: phase.durationWeeks + extra }
            : phase,
        )
      : proposal.phases;

  const haystack = [order.request, ...order.addedScope.map((item) => item.title)].join(" ");
  const scope = proposal.scope.map((item) => {
    if (item.included) return item;
    if (similarTitle(item.title, haystack)) {
      return { ...item, included: true };
    }
    return item;
  });
  for (const item of order.addedScope) {
    const exists = scope.some(
      (row) => row.included && similarTitle(row.title, item.title),
    );
    if (!exists) scope.push(item);
  }

  return {
    ...proposal,
    scope,
    estimates: rolled.lines,
    totalHours: rolled.totalHours,
    totalCost: rolled.totalCost,
    estimateBands: rolled.estimateBands,
    phases,
    delivery: {
      ...proposal.delivery,
      changeOrders: (proposal.delivery?.changeOrders ?? []).map((item) =>
        item.id === order.id
          ? { ...item, status: "approved" as const, appliedAt: new Date().toISOString() }
          : item,
      ),
    },
  };
}

function csvEscape(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function jiraCsv(epics: DeliveryEpic[]) {
  const header = [
    "Summary",
    "Issue Type",
    "Epic Name",
    "Description",
    "Story Points",
    "Labels",
  ];
  const rows = [header.join(",")];
  for (const epic of epics) {
    rows.push(
      [
        csvEscape(epic.title),
        "Epic",
        csvEscape(epic.title),
        csvEscape(`${epic.key}\n${epic.summary}`),
        "",
        "delivery",
      ].join(","),
    );
    for (const story of epic.stories) {
      const description = [
        story.description,
        "",
        "Acceptance",
        ...story.acceptance.map((item) => `- ${item}`),
      ].join("\n");
      rows.push(
        [
          csvEscape(story.title),
          "Story",
          csvEscape(epic.title),
          csvEscape(description),
          story.estimatePoints,
          csvEscape(story.labels.join(" ")),
        ].join(","),
      );
    }
  }
  return rows.join("\n");
}

export function linearCsv(epics: DeliveryEpic[]) {
  const rows = [["Title", "Description", "Priority", "Labels"].join(",")];
  for (const epic of epics) {
    rows.push(
      [
        csvEscape(`[Epic] ${epic.title}`),
        csvEscape(`${epic.key} · ${epic.phase}\n\n${epic.summary}`),
        "2",
        "epic",
      ].join(","),
    );
    for (const story of epic.stories) {
      const description = [
        `Epic: ${epic.title}`,
        story.description,
        "",
        "Acceptance",
        ...story.acceptance.map((item) => `- ${item}`),
      ].join("\n");
      rows.push(
        [
          csvEscape(story.title),
          csvEscape(description),
          "3",
          csvEscape(["story", ...story.labels].join(", ")),
        ].join(","),
      );
    }
  }
  return rows.join("\n");
}

export function linearMarkdown(epics: DeliveryEpic[]) {
  return epics
    .map((epic) => {
      const stories = epic.stories
        .map(
          (story) =>
            `- [ ] **${story.key} ${story.title}** (${story.estimatePoints}pt)\n  ${story.description}\n${story.acceptance.map((item) => `  - ${item}`).join("\n")}`,
        )
        .join("\n");
      return `## ${epic.key} ${epic.title}\n${epic.summary}\n\n${stories}`;
    })
    .join("\n\n");
}

export function raidCsv(rows: RaidItem[]) {
  const header = ["Kind", "Title", "Owner", "Due", "Status", "Notes"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.kind,
        csvEscape(row.title),
        csvEscape(row.owner),
        csvEscape(row.due),
        row.status,
        csvEscape(row.notes),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export function kickoffMarkdown(plan: KickoffPlan, proposal: Proposal) {
  return [
    `# Kickoff · ${proposal.projectTitle}`,
    proposal.clientName,
    "",
    plan.goal,
    "",
    "## Sessions",
    ...plan.sessions.flatMap((session) => [
      `### ${session.day} · ${session.title} (${session.durationMins} min)`,
      `Attendees: ${session.attendees.join(", ")}`,
      ...session.agenda.map((item) => `- ${item}`),
      `Outputs: ${session.outputs.join("; ")}`,
      "",
    ]),
    "## Access needed",
    ...plan.accessNeeded.map((item) => `- ${item}`),
    "",
    "## Decisions needed",
    ...plan.decisionsNeeded.map((item) => `- ${item}`),
    "",
    "## Communications",
    ...plan.communications.map((item) => `- ${item}`),
  ].join("\n");
}

export function changeOrderMarkdown(
  order: ChangeOrder,
  proposal: Proposal,
  currency: string,
) {
  return [
    `# Change order · ${order.title}`,
    `${proposal.clientName} · ${proposal.projectTitle}`,
    `Request: ${order.request}`,
    "",
    order.inBaseline
      ? "This request is already in the signed SOW. No additional fee or date change."
      : order.clientLetter,
    "",
    "## Why",
    order.rationale,
    "",
    ...(order.addedScope.length
      ? [
          "## Added scope",
          ...order.addedScope.map((item) => `- **${item.title}.** ${item.description}`),
          "",
        ]
      : []),
    ...(order.estimates.length
      ? [
          "## Investment",
          `| Role | Hours | Rate | Cost |`,
          `| --- | ---: | ---: | ---: |`,
          ...order.estimates.map(
            (row) =>
              `| ${row.role} | ${row.hours} | ${money(row.rate, currency)} | ${money(row.cost, currency)} |`,
          ),
          "",
          `**Total (incl. contingency): ${money(order.totalCost, currency)}** (${order.totalHours} hours)`,
          `Schedule impact: ${order.extraWeeks ? `+${order.extraWeeks} week${order.extraWeeks === 1 ? "" : "s"}` : "none"}`,
          "",
        ]
      : []),
    "## Assumptions",
    ...order.assumptions.map((item) => `- ${item}`),
  ].join("\n");
}
