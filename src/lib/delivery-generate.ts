import { generateStructured } from "./model";
import {
  CHANGE_ORDER_SYSTEM,
  EPICS_SYSTEM,
  KICKOFF_RAID_SYSTEM,
  changeOrderPrompt,
  epicsPrompt,
  formatCompany,
  kickoffRaidPrompt,
} from "./prompts";
import {
  changeOrderDraftJsonSchema,
  changeOrderDraftSchema,
  deliveryEpicsJsonSchema,
  deliveryEpicsSchema,
  kickoffAndRaidJsonSchema,
  kickoffAndRaidSchema,
} from "./schemas";
import { deliveryContext, epicPrefix } from "./delivery";
import { rollupEstimates } from "./accuracy";
import type {
  ChangeOrder,
  CompanyProfile,
  DeliveryEpic,
  DeliveryStory,
  EstimateLine,
  KickoffPlan,
  Proposal,
  RaidItem,
} from "./types";

function withIds(rows: Omit<RaidItem, "id">[]): RaidItem[] {
  return rows.map((row, index) => ({
    ...row,
    id: `raid-${row.kind}-${index}-${row.title.slice(0, 12).replace(/\s+/g, "-").toLowerCase()}`,
  }));
}

function withEpicKeys(
  prefix: string,
  epics: {
    title: string;
    phase: string;
    summary: string;
    stories: Omit<DeliveryStory, "key">[];
  }[],
): DeliveryEpic[] {
  let storyN = 1;
  return epics.map((epic, index) => ({
    ...epic,
    key: `${prefix}-E${index + 1}`,
    stories: epic.stories.map((story) => ({
      ...story,
      key: `${prefix}-${storyN++}`,
      estimatePoints: [1, 2, 3, 5, 8, 13].includes(story.estimatePoints)
        ? story.estimatePoints
        : 5,
    })),
  }));
}

function rateFor(company: CompanyProfile, role: string) {
  const exact = company.rates.find(
    (row) => row.role.toLowerCase() === role.toLowerCase(),
  );
  if (exact) return exact;
  const fuzzy = company.rates.find(
    (row) =>
      row.role.toLowerCase().includes(role.toLowerCase()) ||
      role.toLowerCase().includes(row.role.toLowerCase().split(" ")[0] ?? ""),
  );
  return fuzzy ?? company.rates[0];
}

export async function generateKickoffAndRaid(proposal: Proposal, company: CompanyProfile) {
  const drafted = await generateStructured({
    schema: kickoffAndRaidSchema,
    jsonSchema: kickoffAndRaidJsonSchema,
    system: KICKOFF_RAID_SYSTEM,
    prompt: kickoffRaidPrompt(
      JSON.stringify(deliveryContext(proposal), null, 2),
      company.name,
    ),
  });

  return {
    kickoff: {
      ...drafted.object.kickoff,
      generatedAt: new Date().toISOString(),
    } satisfies KickoffPlan,
    raid: withIds(drafted.object.raid),
  };
}

export async function generateEpics(proposal: Proposal) {
  const drafted = await generateStructured({
    schema: deliveryEpicsSchema,
    jsonSchema: deliveryEpicsJsonSchema,
    system: EPICS_SYSTEM,
    prompt: epicsPrompt(JSON.stringify(deliveryContext(proposal), null, 2)),
  });
  return withEpicKeys(epicPrefix(proposal.projectTitle), drafted.object.epics);
}

export async function generateChangeOrder(input: {
  proposal: Proposal;
  company: CompanyProfile;
  request: string;
}): Promise<ChangeOrder> {
  const request = input.request.trim();
  if (!request) {
    throw new Error("Describe what the client added.");
  }

  const drafted = await generateStructured({
    schema: changeOrderDraftSchema,
    jsonSchema: changeOrderDraftJsonSchema,
    system: CHANGE_ORDER_SYSTEM,
    prompt: changeOrderPrompt(
      JSON.stringify(deliveryContext(input.proposal), null, 2),
      formatCompany(input.company),
      request,
    ),
  });

  const draft = drafted.object;
  const lines: EstimateLine[] = draft.inBaseline
    ? []
    : draft.estimates
        .filter((row) => row.hours > 0)
        .map((row) => {
          const rate = rateFor(input.company, row.role)?.hourlyRate ?? 0;
          const hours = Math.max(0, Math.round(row.hours));
          return {
            role: rateFor(input.company, row.role)?.role ?? row.role,
            hours,
            rate,
            cost: hours * rate,
          };
        });

  const rolled = rollupEstimates(lines, input.proposal.contingencyPct);

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    request,
    title: draft.title,
    inBaseline: draft.inBaseline,
    rationale: draft.rationale,
    addedScope: draft.inBaseline
      ? []
      : draft.addedScope.map((item) => ({ ...item, included: true })),
    estimates: rolled.lines,
    totalHours: draft.inBaseline ? 0 : rolled.totalHours,
    totalCost: draft.inBaseline ? 0 : rolled.totalCost,
    extraWeeks: draft.inBaseline ? 0 : Math.max(0, draft.extraWeeks),
    assumptions: draft.assumptions,
    clientLetter: draft.clientLetter,
    status: "draft",
  };
}
