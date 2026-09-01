import { LEAN_RATIO, PADDED_RATIO, ratesForType, rollupEstimates } from "../accuracy";
import { PROJECT_TYPES } from "../defaults";
import type {
  CompanyProfile,
  EvalCheck,
  Proposal,
  SourceDocument,
} from "../types";

export interface EvalContext {
  company: CompanyProfile;
  sources?: SourceDocument[];
}

function check(
  id: string,
  label: string,
  severity: EvalCheck["severity"],
  pass: boolean,
  detail: string,
): EvalCheck {
  return { id, label, severity, pass, detail };
}

export function blob(proposal: Proposal) {
  return [
    proposal.executiveSummary,
    proposal.understanding,
    proposal.approach,
    proposal.timelineSummary,
    ...proposal.deliverables,
    ...proposal.assumptions,
    ...proposal.openQuestions,
    ...proposal.scope.map((item) => `${item.title} ${item.description}`),
  ]
    .join("\n")
    .toLowerCase();
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/hosted|hosting/g, "host")
    .replace(/calendars/g, "calendar")
    .replace(/bookings|booked|booking/g, "book")
    .replace(/reminders/g, "reminder")
    .replace(/payments/g, "payment");
}

function significantWords(text: string) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 3);
}

export function covered(needle: string, hay: string) {
  const normalizedHay = normalize(hay);
  if (normalizedHay.includes(normalize(needle))) return true;
  const words = significantWords(needle);
  if (!words.length) return true;
  const hits = words.filter((word) => normalizedHay.includes(word));
  return hits.length >= Math.min(2, words.length);
}

function sourceText(ctx: EvalContext, proposal: Proposal) {
  const fromSources = (ctx.sources ?? []).map((item) => item.text).join("\n");
  const fromBrief = [
    ...(proposal.brief?.constraints ?? []),
    ...(proposal.brief?.niceToHave ?? []),
    ...(proposal.brief?.mustHave ?? []),
  ].join("\n");
  return `${fromSources}\n${fromBrief}`.toLowerCase();
}

function parseBudget(text: string) {
  const rangeK = text.match(
    /\$\s*([\d,.]+)\s*k\s*[–\-to]+\s*\$?\s*([\d,.]+)\s*k/i,
  );
  if (rangeK) {
    return {
      min: Number(rangeK[1].replace(/,/g, "")) * 1000,
      max: Number(rangeK[2].replace(/,/g, "")) * 1000,
    };
  }
  return null;
}

export function runProposalChecks(proposal: Proposal, ctx: EvalContext): EvalCheck[] {
  const company = ratesForType(ctx.company, proposal.projectType ?? "web");
  const rolled = rollupEstimates(proposal.estimates, proposal.contingencyPct);
  const hay = blob(proposal);
  const sources = sourceText(ctx, proposal);
  const included = proposal.scope.filter((item) => item.included);
  const excluded = proposal.scope.filter((item) => !item.included);

  const rateMismatches = proposal.estimates.flatMap((row) => {
    const card = company.rates.find(
      (item) => item.role.toLowerCase() === row.role.toLowerCase(),
    );
    if (!card) {
      return [`${row.role} is not on the rate card`];
    }
    if (card.hourlyRate !== row.rate) {
      return [`${row.role} billed at ${row.rate}/hr, card is ${card.hourlyRate}/hr`];
    }
    if (row.cost !== row.hours * row.rate) {
      return [`${row.role} cost ${row.cost} ≠ ${row.hours} × ${row.rate}`];
    }
    return [];
  });

  const unknownMust = (proposal.brief?.mustHave ?? []).filter(
    (item) => !covered(item, hay),
  );

  const outCriteria = (proposal.rfpScore?.criteria ?? []).filter(
    (item) => item.ourPosition === "out",
  );
  const overclaimed = outCriteria.filter((item) =>
    included.some((scope) => covered(item.criterion, `${scope.title} ${scope.description}`)),
  );

  const exclusionFlags: { test: RegExp; label: string }[] = [
    { test: /epic|fhir/, label: "Epic/FHIR" },
    { test: /native app|native mobile/, label: "native apps" },
    { test: /telehealth|in-portal video|in-app video/, label: "telehealth video" },
  ];
  const missedExclusions = exclusionFlags.filter((flag) => {
    const mentionedOut =
      flag.test.test(sources) &&
      /out of scope|not required|later|exclu|deferred|not in v1/i.test(sources);
    if (!mentionedOut && !outCriteria.some((item) => flag.test.test(item.criterion))) {
      return false;
    }
    return included.some((item) => flag.test.test(`${item.title} ${item.description}`));
  });

  const extraRoles =
    PROJECT_TYPES.find((item) => item.id === (proposal.projectType ?? "web"))?.extraRoles ??
    [];
  const missingRoles = extraRoles.filter(
    (extra) =>
      !proposal.estimates.some(
        (row) => row.role.toLowerCase() === extra.role.toLowerCase(),
      ),
  );

  const budget = parseBudget(sources);
  const bands = proposal.estimateBands;
  const expectedLeanHours = Math.round(rolled.totalHours * LEAN_RATIO);
  const expectedPaddedHours = Math.round(rolled.totalHours * PADDED_RATIO);
  const expectedLeanCost = Math.round(rolled.totalCost * LEAN_RATIO);
  const expectedPaddedCost = Math.round(rolled.totalCost * PADDED_RATIO);

  const weekOne = proposal.weekOneNeeds ?? [];
  const leanCuts = proposal.leanCuts ?? [];
  const paddedAdds = proposal.paddedAdds ?? [];

  return [
    check(
      "rate_card",
      "Rate card",
      "error",
      rateMismatches.length === 0,
      rateMismatches.length
        ? rateMismatches.join("; ")
        : `${proposal.estimates.length} roles match the locked card`,
    ),
    check(
      "totals",
      "Hours and cost rollup",
      "error",
      proposal.totalHours === rolled.totalHours && proposal.totalCost === rolled.totalCost,
      proposal.totalHours === rolled.totalHours && proposal.totalCost === rolled.totalCost
        ? `${rolled.totalHours}h / ${rolled.totalCost} with ${proposal.contingencyPct}% contingency`
        : `Draft has ${proposal.totalHours}h / ${proposal.totalCost}; rollup is ${rolled.totalHours}h / ${rolled.totalCost}`,
    ),
    check(
      "contingency",
      "Contingency bounds",
      "error",
      proposal.contingencyPct >= 0 && proposal.contingencyPct <= 25,
      `${proposal.contingencyPct}% (0–25 allowed)`,
    ),
    check(
      "hours_sane",
      "Hours in a bid-able range",
      "warning",
      proposal.totalHours >= 80 && proposal.totalHours <= 8000,
      `${proposal.totalHours} hours`,
    ),
    check(
      "bands",
      "Lean / padded bands",
      "warning",
      !bands ||
        (bands.likelyHours === rolled.totalHours &&
          bands.likelyCost === rolled.totalCost &&
          bands.leanHours === expectedLeanHours &&
          bands.paddedHours === expectedPaddedHours &&
          bands.leanCost === expectedLeanCost &&
          bands.paddedCost === expectedPaddedCost),
      bands
        ? `Lean ${bands.leanHours}h / padded ${bands.paddedHours}h`
        : "Bands missing",
    ),
    check(
      "scope_balance",
      "Included and excluded scope",
      "error",
      included.length >= 3 && excluded.length >= 1,
      `${included.length} included / ${excluded.length} excluded`,
    ),
    check(
      "exclusions_honored",
      "Stated exclusions stay out",
      "error",
      missedExclusions.length === 0,
      missedExclusions.length
        ? `Included despite out-of-scope: ${missedExclusions.map((item) => item.label).join(", ")}`
        : "Epic, native apps, and video stay excluded when the brief says so",
    ),
    check(
      "must_haves",
      "Must-haves appear in the draft",
      "error",
      unknownMust.length === 0,
      unknownMust.length
        ? `Not found in draft: ${unknownMust.join("; ")}`
        : `${proposal.brief?.mustHave?.length ?? 0} must-haves covered`,
    ),
    check(
      "scorecard_overclaim",
      "Do not include scored-out work",
      "error",
      overclaimed.length === 0,
      overclaimed.length
        ? `Included though scored out: ${overclaimed.map((item) => item.criterion).join("; ")}`
        : "Out criteria stay excluded",
    ),
    check(
      "prose",
      "Client-facing sections are written",
      "error",
      proposal.executiveSummary.trim().length >= 240 &&
        proposal.understanding.trim().length >= 120 &&
        proposal.approach.trim().length >= 120 &&
        proposal.timelineSummary.trim().length >= 40,
      "Summary, problem, approach, and timeline have substance",
    ),
    check(
      "risks",
      "Risks have mitigations",
      "error",
      proposal.risks.length >= 3 &&
        proposal.risks.every((item) => item.mitigation.trim().length > 20),
      `${proposal.risks.length} risks`,
    ),
    check(
      "week_one",
      "Week-1 client checklist",
      "error",
      weekOne.length >= 3,
      weekOne.length ? `${weekOne.length} artifacts / access / decisions` : "Empty",
    ),
    check(
      "lean_padded",
      "Lean cuts and padded unknowns",
      "warning",
      leanCuts.length >= 2 && paddedAdds.length >= 2,
      `${leanCuts.length} cuts / ${paddedAdds.length} padded adds`,
    ),
    check(
      "staffing_mix",
      "Project-type specialist roles",
      "warning",
      missingRoles.length === 0,
      missingRoles.length
        ? `Missing ${missingRoles.map((item) => item.role).join(", ")} for ${proposal.projectType}`
        : extraRoles.length
          ? "Specialist roles from the type mix are staffed"
          : "No extra roles for this type",
    ),
    check(
      "budget_band",
      "Likely cost vs stated budget",
      "warning",
      !budget ||
        (rolled.totalCost >= budget.min * 0.85 && rolled.totalCost <= budget.max * 1.1),
      budget
        ? `Likely ${rolled.totalCost} against $${Math.round(budget.min / 1000)}–${Math.round(budget.max / 1000)}k`
        : "No budget range in the sources",
    ),
    check(
      "phases",
      "Phased timeline",
      "warning",
      proposal.phases.length >= 3 &&
        proposal.phases.every((phase) => phase.durationWeeks >= 1),
      `${proposal.phases.length} phases`,
    ),
  ];
}
