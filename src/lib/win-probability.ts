import { attachValidation } from "./eval";
import { SAMPLE_PAST_BIDS } from "./defaults";
import { attachProposalQuality } from "./proposal-quality";
import type {
  BidComparable,
  CompanyProfile,
  Proposal,
  SourceDocument,
  WinFactor,
  WinProbability,
} from "./types";

const BASE = 60;
const MIN = 18;
const MAX = 88;

function clamp(n: number) {
  return Math.max(MIN, Math.min(MAX, Math.round(n)));
}

function tokens(text: string) {
  return text
    .toLowerCase()
    .split(/[,/]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2);
}

function haystack(proposal: Proposal) {
  return [
    proposal.approach,
    proposal.executiveSummary,
    proposal.understanding,
    ...(proposal.brief.mustHave ?? []),
    ...(proposal.brief.goals ?? []),
    ...(proposal.rfpScore?.strengths ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function statedWeeks(proposal: Proposal) {
  const fromPhases = proposal.phases.reduce((sum, phase) => sum + phase.durationWeeks, 0);
  const match = proposal.brief.constraints
    .join(" ")
    .match(/(\d+)\s*weeks?/i);
  const fromConstraint = match ? Number(match[1]) : 0;
  return fromConstraint || fromPhases || 0;
}

function closedBids(history: BidComparable[], currentId?: string) {
  return history.filter(
    (item) =>
      item.id !== currentId &&
      item.quotedCost > 0 &&
      (item.outcome === "won" || item.outcome === "lost" || item.outcome === "sent"),
  );
}

function aggressiveDeadline(proposal: Proposal) {
  const weeks = statedWeeks(proposal);
  if (!weeks) return false;
  const pace = proposal.totalHours / weeks;
  if (pace >= 80) return true;
  if (weeks <= 8 && proposal.totalHours >= 400) return true;
  const text = `${proposal.brief.constraints.join(" ")} ${proposal.timelineSummary}`;
  return /aggressive|tight timeline|rush|compressed/i.test(text);
}

function technicalFit(proposal: Proposal): "strong" | "weak" | null {
  const criteria = (proposal.rfpScore?.criteria ?? []).filter(
    (row) => row.importance !== "nice",
  );
  if (!criteria.length) return null;
  const good = criteria.filter(
    (row) => row.ourPosition === "strong" || row.ourPosition === "adequate",
  );
  const share = good.length / criteria.length;
  if (share >= 0.55) return "strong";
  if (share < 0.4) return "weak";
  return null;
}

function stackAvailable(proposal: Proposal, company: CompanyProfile) {
  const corpus = haystack(proposal);
  const hits = tokens(company.techStack).filter((token) => corpus.includes(token));
  return hits.length >= 2;
}

export function estimateWinProbability(
  proposal: Proposal,
  company: CompanyProfile,
  history: BidComparable[] = [],
): WinProbability {
  const pool = closedBids(
    history.length ? history : (proposal.comparables ?? SAMPLE_PAST_BIDS),
    proposal.id,
  );
  const type = proposal.projectType ?? "web";
  const similar = pool.filter((item) => item.projectType === type);
  const similarWins = similar.filter((item) => item.outcome === "won");
  const pricePool = similar.length >= 1 ? similar : pool;
  const avgCost =
    pricePool.length > 0
      ? pricePool.reduce((sum, item) => sum + item.quotedCost, 0) / pricePool.length
      : 0;

  const positives: WinFactor[] = [];
  const negatives: WinFactor[] = [];
  let score = BASE;

  const fit = technicalFit(proposal);
  if (fit === "strong") {
    score += 10;
    positives.push({
      id: "technical-fit",
      polarity: "positive",
      label: "Strong technical fit",
      detail: "Must/should criteria on the scorecard are mostly strong or adequate.",
    });
  } else if (fit === "weak") {
    score -= 12;
    negatives.push({
      id: "technical-fit",
      polarity: "negative",
      label: "Weak technical fit",
      detail: "Too many must/should criteria sit at weak or out.",
    });
  }

  if (similarWins.length > 0) {
    score += 8;
    positives.push({
      id: "similar-projects",
      polarity: "positive",
      label: "Similar previous projects",
      detail: `${similarWins.length} won ${type} bid${similarWins.length === 1 ? "" : "s"} on file, including ${similarWins[0].projectTitle}.`,
    });
  } else if (similar.some((item) => item.outcome === "lost")) {
    score -= 8;
    negatives.push({
      id: "similar-projects",
      polarity: "negative",
      label: "Similar past bids were lost",
      detail: "Studio history for this project type is mostly losses.",
    });
  }

  if (stackAvailable(proposal, company)) {
    score += 6;
    positives.push({
      id: "tech-available",
      polarity: "positive",
      label: "Required technology available",
      detail: `Studio stack (${company.techStack.split(",")[0].trim()}…) shows up in the approach and brief.`,
    });
  }

  if (aggressiveDeadline(proposal)) {
    score -= 8;
    negatives.push({
      id: "deadline",
      polarity: "negative",
      label: "Aggressive deadline",
      detail: `${proposal.totalHours} hours across ${statedWeeks(proposal) || "few"} weeks is a hard delivery pace.`,
    });
  }

  if (avgCost > 0 && proposal.totalCost > avgCost * 1.12) {
    score -= 8;
    negatives.push({
      id: "price",
      polarity: "negative",
      label: "Pricing above historical average",
      detail: `Likely ${proposal.totalCost.toLocaleString("en-US")} vs similar-bid average ${Math.round(avgCost).toLocaleString("en-US")}.`,
    });
  } else if (avgCost > 0 && proposal.totalCost < avgCost * 0.88) {
    score += 4;
    positives.push({
      id: "price",
      polarity: "positive",
      label: "Priced below similar historical bids",
      detail: `Likely ${proposal.totalCost.toLocaleString("en-US")} vs similar-bid average ${Math.round(avgCost).toLocaleString("en-US")}.`,
    });
  }

  const percent = clamp(score);
  return {
    percent,
    summary: `Based on ${pool.length || history.length} historical proposal${
      pool.length === 1 ? "" : "s"
    }`,
    historyCount: pool.length || history.length,
    similarCount: similar.length,
    positives,
    negatives,
  };
}

export function attachWinProbability(
  proposal: Proposal,
  company: CompanyProfile,
  history: BidComparable[] = [],
): Proposal {
  return {
    ...proposal,
    winProbability: estimateWinProbability(proposal, company, history),
  };
}

export function withStudioChecks(
  proposal: Proposal,
  company: CompanyProfile,
  extra?: { sources?: SourceDocument[]; history?: BidComparable[] },
): Proposal {
  return attachValidation(
    attachProposalQuality(
      attachWinProbability(proposal, company, extra?.history),
      company,
      extra?.sources,
    ),
    company,
    extra?.sources,
  );
}
