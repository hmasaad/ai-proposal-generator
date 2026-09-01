import type { ProposalQuality, QualityGate } from "@/lib/types";

const GATE: Record<QualityGate, { label: string; className: string }> = {
  pass: { label: "PASS", className: "bg-moss/15 text-forest" },
  warning: { label: "WARNING", className: "bg-copper/15 text-copper" },
  fail: { label: "FAIL", className: "bg-copper/20 text-copper" },
};

export function ProposalQualityCard({ report }: { report: ProposalQuality }) {
  return (
    <section className="no-print mt-8 rounded-3xl border border-rule bg-white/50 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-moss">Proposal Quality Agent</p>
      <h2 className="mt-1 font-serif text-xl">Before finalizing</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Coverage of the brief plus delivery-complete topics. Internal only — not part of the client
        PDF. No extra model call.
      </p>

      <p className="mt-4 text-sm text-ink-soft">Requirements coverage</p>
      <p className="font-serif text-4xl tracking-tight">
        {report.coveragePct}
        <span className="text-lg text-ink-soft">%</span>
      </p>
      <p className="mt-1 text-xs text-ink-soft">
        {report.coveredCount} of {report.totalCount} topics found in the draft.
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-2">
        <div className="h-2 rounded-full bg-forest" style={{ width: `${report.coveragePct}%` }} />
      </div>

      {report.missing.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs uppercase tracking-[0.16em] text-copper">Missing</h3>
          <ul className="mt-2 space-y-2">
            {report.missing.map((item) => (
              <li key={item.id} className="rounded-2xl border border-copper/30 bg-copper/10 px-4 py-3">
                <p className="text-sm font-medium">! {item.label}</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-rule bg-paper px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.14em] text-ink-soft">Unsupported claims</dt>
          <dd className="mt-1 font-serif text-2xl">{report.unsupportedClaims}</dd>
          <p className="mt-1 text-xs leading-5 text-ink-soft">{report.unsupportedDetail}</p>
        </div>
        <div className="rounded-2xl border border-rule bg-paper px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.14em] text-ink-soft">Pricing validation</dt>
          <dd className="mt-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs ${GATE[report.pricing].className}`}>
              {GATE[report.pricing].label}
            </span>
          </dd>
          <p className="mt-2 text-xs leading-5 text-ink-soft">{report.pricingDetail}</p>
        </div>
        <div className="rounded-2xl border border-rule bg-paper px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.14em] text-ink-soft">Timeline validation</dt>
          <dd className="mt-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs ${GATE[report.timeline].className}`}>
              {GATE[report.timeline].label}
            </span>
          </dd>
          <p className="mt-2 text-xs leading-5 text-ink-soft">{report.timelineDetail}</p>
        </div>
      </dl>
    </section>
  );
}
