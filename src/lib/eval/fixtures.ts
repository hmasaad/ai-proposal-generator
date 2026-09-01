import { DEFAULT_COMPANY } from "../defaults";
import { SAMPLE_PROPOSAL } from "../sample-proposal";
import { SAMPLE_SOURCES } from "../sample-rfp";
import type { CompanyProfile, Proposal, SourceDocument } from "../types";
import { evaluateProposal } from "./run";

export interface EvalFixture {
  id: string;
  label: string;
  expect: "pass" | "fail";
  mustFail?: string[];
  proposal: Proposal;
  sources: SourceDocument[];
  company: CompanyProfile;
}

function brokenMeridian(): Proposal {
  return {
    ...SAMPLE_PROPOSAL,
    id: "eval-broken",
    projectTitle: "Broken fixture — should fail evals",
    estimates: SAMPLE_PROPOSAL.estimates.map((row) =>
      row.role === "Senior engineer"
        ? { ...row, rate: 999, cost: 999 }
        : row,
    ),
    totalHours: 12,
    totalCost: 50,
    contingencyPct: 80,
    scope: SAMPLE_PROPOSAL.scope.map((item) =>
      /epic|fhir/i.test(item.title)
        ? {
            ...item,
            included: true,
            description: "Full Epic FHIR charting in v1.",
          }
        : { ...item, included: true },
    ),
    weekOneNeeds: [],
    leanCuts: [],
    paddedAdds: [],
    risks: [],
    executiveSummary: "Too short.",
    rfpScore: SAMPLE_PROPOSAL.rfpScore,
  };
}

export const EVAL_FIXTURES: EvalFixture[] = [
  {
    id: "meridian-sample",
    label: "Meridian sample proposal",
    expect: "pass",
    proposal: SAMPLE_PROPOSAL,
    sources: SAMPLE_SOURCES,
    company: DEFAULT_COMPANY,
  },
  {
    id: "broken-rates-epic",
    label: "Broken rates, included Epic, empty week 1",
    expect: "fail",
    mustFail: [
      "rate_card",
      "totals",
      "contingency",
      "exclusions_honored",
      "scorecard_overclaim",
      "week_one",
      "prose",
      "risks",
    ],
    proposal: brokenMeridian(),
    sources: SAMPLE_SOURCES,
    company: DEFAULT_COMPANY,
  },
];

export function runEvalSuite() {
  const results = EVAL_FIXTURES.map((fixture) => {
    const report = evaluateProposal(fixture.proposal, {
      company: fixture.company,
      sources: fixture.sources,
    });
    const failedIds = report.checks.filter((item) => !item.pass).map((item) => item.id);
    const missingFails = (fixture.mustFail ?? []).filter((id) => !failedIds.includes(id));
    const unexpectedPass =
      fixture.expect === "fail" ? missingFails.length > 0 : report.errorCount > 0;
    const ok =
      fixture.expect === "pass"
        ? report.errorCount === 0
        : report.errorCount > 0 && missingFails.length === 0;

    return {
      id: fixture.id,
      label: fixture.label,
      expect: fixture.expect,
      ok,
      unexpectedPass,
      missingFails,
      report,
    };
  });

  return {
    passed: results.every((item) => item.ok),
    results,
  };
}
