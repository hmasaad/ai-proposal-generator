import { PROJECT_TYPES } from "./defaults";
import type {
  BidComparable,
  BidOutcome,
  CompanyProfile,
  EstimateBands,
  Lesson,
  ProjectType,
  Proposal,
} from "./types";

export const LEAN_RATIO = 0.82;
export const PADDED_RATIO = 1.22;

export function projectTypeLabel(type: ProjectType) {
  return PROJECT_TYPES.find((item) => item.id === type)?.label ?? type;
}

export function ratesForType(
  company: CompanyProfile,
  type: ProjectType,
): CompanyProfile {
  const preset = PROJECT_TYPES.find((item) => item.id === type);
  if (!preset) return company;

  const senior =
    company.rates.find((row) => row.role.toLowerCase().includes("senior"))
      ?.hourlyRate ??
    company.rates[0]?.hourlyRate ??
    150;

  const extras = preset.extraRoles
    .filter(
      (extra) =>
        !company.rates.some(
          (row) => row.role.toLowerCase() === extra.role.toLowerCase(),
        ),
    )
    .map((extra) => ({
      role: extra.role,
      hourlyRate: Math.round(senior * extra.seniorMultiple),
    }));

  return { ...company, rates: [...company.rates, ...extras] };
}

export function computeBands(
  likelyHours: number,
  likelyCost: number,
): EstimateBands {
  const hours = Math.max(0, likelyHours);
  const cost = Math.max(0, likelyCost);
  return {
    leanHours: Math.round(hours * LEAN_RATIO),
    leanCost: Math.round(cost * LEAN_RATIO),
    likelyHours: hours,
    likelyCost: cost,
    paddedHours: Math.round(hours * PADDED_RATIO),
    paddedCost: Math.round(cost * PADDED_RATIO),
  };
}

export function similarBids(
  history: BidComparable[],
  current: {
    id?: string;
    projectType: ProjectType;
    hours: number;
    cost: number;
  },
  limit = 3,
): BidComparable[] {
  const scored = history
    .filter((item) => item.id !== current.id)
    .map((item) => {
      let score = 0;
      if (item.projectType === current.projectType) score += 4;
      const hoursBase = Math.max(current.hours, 1);
      const hourGap = Math.abs(item.quotedHours - current.hours) / hoursBase;
      score += Math.max(0, 3 - hourGap * 3);
      const costBase = Math.max(current.cost, 1);
      const costGap = Math.abs(item.quotedCost - current.cost) / costBase;
      score += Math.max(0, 2 - costGap * 2);
      if (item.outcome === "won" || item.outcome === "lost") score += 1;
      if (item.actualHours) score += 0.5;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.item);
}

export function weekOneNeeds(
  fromModel: string[] | undefined,
  openQuestions: string[],
  unknowns: string[],
) {
  const cleaned = (fromModel ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  if (cleaned.length) return Array.from(new Set(cleaned)).slice(0, 8);

  const fallback = [...unknowns, ...openQuestions]
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((item) => `Confirm in week 1: ${item.replace(/^confirm in week 1:\s*/i, "")}`);

  return fallback;
}

export function proposalToComparable(proposal: Proposal): BidComparable {
  return {
    id: proposal.id,
    projectTitle: proposal.projectTitle,
    clientName: proposal.clientName,
    projectType: proposal.projectType ?? "web",
    quotedHours: proposal.totalHours,
    quotedCost: proposal.totalCost,
    actualHours: proposal.actualHours,
    outcome: proposal.outcome ?? "draft",
    note:
      proposal.outcomeNote?.trim() ||
      (proposal.comparables?.[0]?.note ?? ""),
  };
}

export function outcomeLesson(proposal: Proposal): Lesson | null {
  const outcome: BidOutcome = proposal.outcome ?? "draft";
  if (outcome !== "won" && outcome !== "lost") return null;

  const quoted = `${proposal.totalHours} hours / ${proposal.totalCost.toLocaleString("en-US")}`;
  const actual = proposal.actualHours
    ? `${proposal.actualHours} hours`
    : "actuals not recorded";
  const note = proposal.outcomeNote?.trim();

  if (outcome === "won") {
    return {
      id: `outcome-${proposal.id}`,
      createdAt: new Date().toISOString(),
      proposalId: proposal.id,
      projectTitle: proposal.projectTitle,
      category: "estimate",
      mistake: note
        ? `Won ${proposal.projectTitle}. Quoted ${quoted}; delivery note: ${note}`
        : `Won ${proposal.projectTitle} at ${quoted} (${actual}).`,
      correction: proposal.actualHours
        ? `Next similar ${proposal.projectType ?? "web"} bid: quoted ${proposal.totalHours}h, actual ${proposal.actualHours}h. Scale hours toward actuals and keep the week-1 artifacts that this job needed.`
        : `Keep the week-1 checklist and exclusions that let this bid close. Record actual hours when the job ends.`,
    };
  }

  return {
    id: `outcome-${proposal.id}`,
    createdAt: new Date().toISOString(),
    proposalId: proposal.id,
    projectTitle: proposal.projectTitle,
    category: "estimate",
    mistake: note
      ? `Lost ${proposal.projectTitle} (${quoted}). ${note}`
      : `Lost ${proposal.projectTitle} at ${quoted}.`,
    correction:
      note ||
      "For similar briefs, check price vs. the client's band, drop nice-to-haves into a later phase, and keep compliance exclusions explicit.",
  };
}

export function formatPastBids(history: BidComparable[]) {
  if (!history.length) return "None on file.";
  return history
    .map(
      (item) =>
        `- [${item.outcome}] ${item.projectTitle} (${item.clientName}, ${item.projectType}): quoted ${item.quotedHours}h / ${item.quotedCost}${item.actualHours ? `, actual ${item.actualHours}h` : ""}. ${item.note}`,
    )
    .join("\n");
}
