import type { CompanyProfile, EvalCheck, Proposal, ValidationReport } from "../types";
import { runProposalChecks, type EvalContext } from "./checks";

export function summarizeChecks(checks: EvalCheck[]): ValidationReport {
  const errorCount = checks.filter((item) => item.severity === "error" && !item.pass).length;
  const warningCount = checks.filter((item) => item.severity === "warning" && !item.pass).length;
  const scored = checks.filter((item) => item.severity === "error");
  const passedErrors = scored.filter((item) => item.pass).length;
  const score = scored.length ? Math.round((passedErrors / scored.length) * 100) : 100;
  return {
    at: new Date().toISOString(),
    passed: errorCount === 0,
    score,
    errorCount,
    warningCount,
    checks,
  };
}

export function evaluateProposal(
  proposal: Proposal,
  ctx: EvalContext,
): ValidationReport {
  return summarizeChecks(runProposalChecks(proposal, ctx));
}

export function attachValidation(
  proposal: Proposal,
  company: CompanyProfile,
  sources?: EvalContext["sources"],
): Proposal {
  return {
    ...proposal,
    validation: evaluateProposal(proposal, { company, sources }),
  };
}
