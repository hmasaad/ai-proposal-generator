import type { ValidationReport } from "@/lib/types";

export function ValidationReportCard({ report }: { report: ValidationReport }) {
  return (
    <section className="no-print mt-8 rounded-3xl border border-rule bg-white/50 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-moss">Validation / evals</p>
      <h2 className="mt-1 font-serif text-xl">Draft quality gate</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Deterministic checks against the rate card, brief, and scorecard. Not part of the client
        PDF. Errors block client-ready.
      </p>
      <p className="mt-4 font-serif text-3xl">
        {report.score}
        <span className="text-lg text-ink-soft">/100</span>
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {report.errorCount} {report.errorCount === 1 ? "error" : "errors"} · {report.warningCount}{" "}
        {report.warningCount === 1 ? "warning" : "warnings"}
        {report.passed ? " · ready for internal review" : ""}
      </p>
      <ul className="mt-4 space-y-2">
        {report.checks.map((item) => (
          <li
            key={item.id}
            className={`rounded-2xl border px-4 py-3 ${
              item.pass
                ? "border-rule bg-paper"
                : item.severity === "error"
                  ? "border-copper/40 bg-copper/10"
                  : "border-rule bg-white/70"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-moss">
              {item.pass ? "Pass" : item.severity} · {item.label}
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-soft">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
