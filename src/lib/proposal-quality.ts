import { ratesForType, rollupEstimates } from "./accuracy";
import { blob, covered } from "./eval/checks";
import type {
  CompanyProfile,
  Proposal,
  ProposalQuality,
  QualityGap,
  QualityGate,
  SourceDocument,
} from "./types";

type Topic = { id: string; label: string; test: RegExp | string };

const STANDARD_TOPICS: Topic[] = [
  { id: "booking", label: "Online booking", test: /book|booking|appointment/ },
  { id: "reschedule", label: "Reschedule and cancel", test: /reschedule|cancel/ },
  { id: "intake", label: "Digital intake", test: /intake/ },
  { id: "reminders", label: "Appointment reminders", test: /reminder/ },
  { id: "sms", label: "SMS constraints", test: /sms|twilio/ },
  { id: "proxy", label: "Proxy / family access", test: /proxy|guardian|pediatric/ },
  { id: "mfa", label: "Staff MFA", test: /\bmfa\b|multi-factor/ },
  { id: "audit", label: "Audit logging", test: /audit/ },
  { id: "hosting", label: "US hosting", test: /us host|us-hosted|aws us|us-based/ },
  { id: "a11y", label: "Accessibility", test: /wcag|accessibility/ },
  { id: "entra", label: "Staff identity (Entra / SSO)", test: /entra|sso|microsoft 365/ },
  { id: "payments", label: "Balances / payments", test: /stripe|payment|balance/ },
  { id: "calendar-import", label: "Calendar / schedule import", test: /ical|csv|calendar import|google calendar/ },
  { id: "dual-run", label: "Cutover / dual-run", test: /dual-run|cutover|system of record/ },
  { id: "baa", label: "BAA / HIPAA track", test: /\bbaa\b|hipaa/ },
  { id: "session", label: "Session timeout", test: /session timeout/ },
  { id: "rbac", label: "Role-based access", test: /role-based|front desk|clinic manager/ },
  { id: "visit-types", label: "Visit types and buffers", test: /visit.type|buffer/ },
  { id: "training", label: "Admin training", test: /train/ },
  { id: "runbook", label: "Runbook / handover", test: /runbook/ },
  { id: "iac", label: "Infrastructure as code", test: /terraform|infrastructure as code/ },
  { id: "week-one", label: "Week-1 client needs", test: /week 1/ },
  { id: "privacy", label: "Privacy policy / legal", test: /privacy.policy|legal/ },
  { id: "analytics", label: "Operations analytics", test: /analytics|no-show/ },
  { id: "phi", label: "PHI-safe messaging", test: /\bphi\b/ },
  { id: "responsive", label: "Responsive web (no native apps)", test: /responsive|native/ },
  { id: "auth", label: "Patient accounts", test: /registration|password reset|email verification|patient account/ },
  { id: "pdf", label: "Intake PDF export", test: /pdf/ },
  { id: "cadence", label: "Reminder cadence", test: /72h|24h|2h|cadence/ },
  { id: "architecture", label: "Named architecture", test: /next\.js|postgresql|postgres/ },
  { id: "demos", label: "Delivery cadence", test: /weekly demo|demo every week/ },
  { id: "source-code", label: "Source code delivery", test: /source code/ },
  { id: "exclusions", label: "Named exclusions", test: /epic|fhir|telehealth|spanish/ },
  { id: "migration", label: "Data migration requirements", test: /data migration|legacy data|historical records|etl\b|migrat(e|ion) of (patient|ehr|chart)/ },
  { id: "sla", label: "SLA requirements", test: /\bsla\b|service level|uptime|99\.\d|response time|support hours|severity[- ]?[123]/ },
  { id: "dr", label: "Disaster recovery requirements", test: /disaster recovery|\bdr\b|rto\b|rpo\b|failover|backup and restore|warm standby/ },
];

function haystack(proposal: Proposal) {
  return [
    blob(proposal),
    proposal.timelineSummary,
    ...(proposal.weekOneNeeds ?? []),
    ...(proposal.brief.unknownOrMissing ?? []),
  ]
    .join("\n")
    .toLowerCase();
}

function topicHits(topic: Topic, hay: string) {
  if (typeof topic.test === "string") return covered(topic.test, hay);
  return topic.test.test(hay);
}

function gate(ok: boolean, warn: boolean): QualityGate {
  if (!ok) return "fail";
  if (warn) return "warning";
  return "pass";
}

function statedWeeks(proposal: Proposal) {
  const fromPhases = proposal.phases.reduce((sum, phase) => sum + phase.durationWeeks, 0);
  const match = proposal.brief.constraints.join(" ").match(/(\d+)\s*weeks?/i);
  return { constraint: match ? Number(match[1]) : 0, phases: fromPhases };
}

export function estimateProposalQuality(
  proposal: Proposal,
  company: CompanyProfile,
): ProposalQuality {
  const hay = haystack(proposal);
  const briefItems: Topic[] = [
    ...(proposal.brief.mustHave ?? []).map((label, index) => ({
      id: `must-${index}`,
      label,
      test: label,
    })),
    ...(proposal.brief.goals ?? []).map((label, index) => ({
      id: `goal-${index}`,
      label,
      test: label,
    })),
    ...(proposal.brief.successCriteria ?? []).map((label, index) => ({
      id: `success-${index}`,
      label,
      test: label,
    })),
  ];

  const topics = [...briefItems, ...STANDARD_TOPICS];
  const missing: QualityGap[] = [];
  let coveredCount = 0;
  for (const topic of topics) {
    if (topicHits(topic, hay)) {
      coveredCount += 1;
    } else {
      missing.push({
        id: topic.id,
        label: topic.label,
        detail: "Not found in the draft. Add a scope line, assumption, or risk before you send.",
      });
    }
  }

  const included = proposal.scope.filter((item) => item.included);
  const outCriteria = (proposal.rfpScore?.criteria ?? []).filter(
    (item) => item.ourPosition === "out",
  );
  const overclaimed = outCriteria.filter((item) =>
    included.some((scope) => covered(item.criterion, `${scope.title} ${scope.description}`)),
  );
  const exclusionHits = [
    { test: /epic|fhir/, label: "Epic/FHIR" },
    { test: /native app|native mobile/, label: "native apps" },
    { test: /telehealth|in-portal video|in-app video/, label: "telehealth video" },
  ].filter((flag) =>
    included.some((item) => flag.test.test(`${item.title} ${item.description}`.toLowerCase())),
  );
  const unsupportedClaims = overclaimed.length + exclusionHits.length;
  const unsupportedDetail = unsupportedClaims
    ? [...overclaimed.map((item) => item.criterion), ...exclusionHits.map((item) => item.label)].join(
        "; ",
      )
    : "No scored-out or excluded work is marked included.";

  const rates = ratesForType(company, proposal.projectType ?? "web");
  const rolled = rollupEstimates(proposal.estimates, proposal.contingencyPct);
  const rateMismatches = proposal.estimates.filter((row) => {
    const card = rates.rates.find((item) => item.role.toLowerCase() === row.role.toLowerCase());
    return !card || card.hourlyRate !== row.rate || row.cost !== row.hours * row.rate;
  });
  const totalsOk =
    proposal.totalHours === rolled.totalHours && proposal.totalCost === rolled.totalCost;
  const contingencyOk = proposal.contingencyPct >= 0 && proposal.contingencyPct <= 25;
  const pricingOk = rateMismatches.length === 0 && totalsOk && contingencyOk;
  const pricing: QualityGate = pricingOk ? "pass" : "fail";
  const pricingDetail = pricingOk
    ? `${rolled.totalHours}h / ${rolled.totalCost.toLocaleString("en-US")} on the locked rate card`
    : [
        rateMismatches.length ? `${rateMismatches.length} rate-card mismatch(es)` : null,
        totalsOk ? null : "Hours/cost do not roll up",
        contingencyOk ? null : "Contingency outside 0–25%",
      ]
        .filter(Boolean)
        .join("; ");

  const weeks = statedWeeks(proposal);
  const pace = weeks.constraint || weeks.phases ? proposal.totalHours / (weeks.constraint || weeks.phases) : 0;
  const timelineFail = proposal.phases.length < 2 || proposal.phases.some((phase) => phase.durationWeeks < 1);
  const timelineWarn = !timelineFail && (pace >= 80 || (weeks.constraint > 0 && weeks.phases > weeks.constraint));
  const timeline = gate(!timelineFail, timelineWarn);
  const timelineDetail = timelineFail
    ? "Need at least two phases with durations."
    : timelineWarn
      ? `${proposal.totalHours} hours across ${weeks.constraint || weeks.phases} weeks is a hard pace.`
      : `${weeks.phases || weeks.constraint} weeks across ${proposal.phases.length} phases.`;

  const totalCount = topics.length;
  return {
    coveragePct: totalCount ? Math.round((coveredCount / totalCount) * 100) : 100,
    coveredCount,
    totalCount,
    missing,
    unsupportedClaims,
    unsupportedDetail,
    pricing,
    pricingDetail,
    timeline,
    timelineDetail,
  };
}

export function attachProposalQuality(
  proposal: Proposal,
  company: CompanyProfile,
  _sources?: SourceDocument[],
): Proposal {
  return {
    ...proposal,
    proposalQuality: estimateProposalQuality(proposal, company),
  };
}
