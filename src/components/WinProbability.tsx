import type { WinProbability } from "@/lib/types";

export function WinProbabilityCard({ report }: { report: WinProbability }) {
  return (
    <section className="no-print mt-8 rounded-3xl border border-rule bg-white/50 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-moss">Win Probability Agent</p>
      <h2 className="mt-1 font-serif text-xl">Estimated win probability</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {report.summary}. Internal only — not part of the client PDF. Uses the RFP scorecard,
        studio stack, and closed bids. No extra model call.
      </p>

      <p className="mt-4 font-serif text-4xl tracking-tight">
        {report.percent}
        <span className="text-lg text-ink-soft">%</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-2">
        <div
          className="h-2 rounded-full bg-forest"
          style={{ width: `${report.percent}%` }}
        />
      </div>
      {report.similarCount > 0 && (
        <p className="mt-2 text-xs text-ink-soft">
          {report.similarCount} similar-type bid{report.similarCount === 1 ? "" : "s"} in the
          average.
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {report.positives.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-[0.16em] text-moss">Positive</h3>
            <ul className="mt-2 space-y-2">
              {report.positives.map((item) => (
                <li key={item.id} className="rounded-2xl border border-rule bg-paper px-4 py-3">
                  <p className="text-sm font-medium">+ {item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.negatives.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-[0.16em] text-copper">Negative</h3>
            <ul className="mt-2 space-y-2">
              {report.negatives.map((item) => (
                <li key={item.id} className="rounded-2xl border border-rule bg-paper px-4 py-3">
                  <p className="text-sm font-medium">− {item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
