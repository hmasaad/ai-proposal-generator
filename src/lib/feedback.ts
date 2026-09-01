import { PROJECT_TYPES } from "./defaults";
import type {
  BidComparable,
  BidOutcome,
  OutcomeReason,
  ProjectType,
  Proposal,
} from "./types";

export const OUTCOME_REASONS: { id: OutcomeReason; label: string }[] = [
  { id: "price", label: "Price / commercial" },
  { id: "timeline", label: "Timeline / deadline" },
  { id: "scope", label: "Scope / extras" },
  { id: "technical_fit", label: "Technical fit" },
  { id: "incumbent", label: "Incumbent / competitor" },
  { id: "relationship", label: "Relationship" },
  { id: "compliance", label: "Compliance / legal" },
  { id: "delivery_risk", label: "Delivery risk" },
  { id: "no_budget", label: "No budget / deferred" },
  { id: "other", label: "Other" },
];

export const LOOP_STEPS = [
  { id: "proposal", label: "Proposal" },
  { id: "outcome", label: "Won / Lost" },
  { id: "reason", label: "Reason" },
  { id: "store", label: "Store outcome" },
  { id: "analytics", label: "Analytics" },
  { id: "improve", label: "Improve future proposals" },
] as const;

export function reasonLabel(id?: OutcomeReason) {
  return OUTCOME_REASONS.find((item) => item.id === id)?.label ?? "Unspecified";
}

export function isClosedOutcome(outcome?: BidOutcome) {
  return outcome === "won" || outcome === "lost" || outcome === "no_bid";
}

export function loopStepIndex(proposal: Proposal | null, historyCount: number) {
  if (!proposal) return 0;
  const outcome = proposal.outcome ?? "draft";
  if (!isClosedOutcome(outcome) && outcome !== "sent") return 1;
  if (!proposal.outcomeReason && (outcome === "won" || outcome === "lost")) return 2;
  if (!proposal.outcomeRecordedAt && isClosedOutcome(outcome)) return 3;
  if (historyCount < 1) return 4;
  return 5;
}

export interface FeedbackAnalytics {
  closed: number;
  won: number;
  lost: number;
  noBid: number;
  winRate: number;
  avgQuotedHours: number;
  avgActualHours: number | null;
  overrunPct: number | null;
  byReason: { id: OutcomeReason | "unspecified"; label: string; won: number; lost: number }[];
  byType: { type: ProjectType; label: string; won: number; lost: number; winRate: number }[];
}

export function analyzeOutcomes(history: BidComparable[]): FeedbackAnalytics {
  const closed = history.filter((item) => isClosedOutcome(item.outcome));
  const won = closed.filter((item) => item.outcome === "won");
  const lost = closed.filter((item) => item.outcome === "lost");
  const noBid = closed.filter((item) => item.outcome === "no_bid");
  const withActual = won.filter((item) => item.actualHours && item.actualHours > 0);
  const avgQuotedHours = closed.length
    ? Math.round(closed.reduce((sum, item) => sum + item.quotedHours, 0) / closed.length)
    : 0;
  const avgActualHours = withActual.length
    ? Math.round(withActual.reduce((sum, item) => sum + (item.actualHours ?? 0), 0) / withActual.length)
    : null;
  const avgWonQuoted = withActual.length
    ? withActual.reduce((sum, item) => sum + item.quotedHours, 0) / withActual.length
    : 0;
  const overrunPct =
    avgActualHours != null && avgWonQuoted > 0
      ? Math.round(((avgActualHours - avgWonQuoted) / avgWonQuoted) * 100)
      : null;

  const reasonIds = [...OUTCOME_REASONS.map((item) => item.id), "unspecified"] as const;
  const byReason = reasonIds
    .map((id) => {
      const rows = closed.filter((item) => (item.reason ?? "unspecified") === id);
      return {
        id,
        label: id === "unspecified" ? "Unspecified" : reasonLabel(id),
        won: rows.filter((item) => item.outcome === "won").length,
        lost: rows.filter((item) => item.outcome === "lost").length,
      };
    })
    .filter((row) => row.won + row.lost > 0);

  const byType = PROJECT_TYPES.map((item) => {
    const rows = closed.filter((row) => row.projectType === item.id);
    const typeWon = rows.filter((row) => row.outcome === "won").length;
    const typeLost = rows.filter((row) => row.outcome === "lost").length;
    const decided = typeWon + typeLost;
    return {
      type: item.id,
      label: item.label,
      won: typeWon,
      lost: typeLost,
      winRate: decided ? Math.round((typeWon / decided) * 100) : 0,
    };
  }).filter((row) => row.won + row.lost > 0);

  const decided = won.length + lost.length;
  return {
    closed: closed.length,
    won: won.length,
    lost: lost.length,
    noBid: noBid.length,
    winRate: decided ? Math.round((won.length / decided) * 100) : 0,
    avgQuotedHours,
    avgActualHours,
    overrunPct,
    byReason,
    byType,
  };
}
