import type { FitLevel, RfpScore } from "@/lib/types";

const FIT: Record<FitLevel, { label: string; className: string }> = {
  strong: { label: "Strong", className: "bg-moss/15 text-forest" },
  adequate: { label: "Adequate", className: "bg-paper-2 text-ink" },
  weak: { label: "Weak", className: "bg-copper/15 text-copper" },
  out: { label: "Out", className: "bg-paper-2 text-ink-soft" },
};

export function RfpScorecard({ score }: { score: RfpScore }) {
  return (
    <section className="no-print mt-8 rounded-3xl border border-rule bg-white/50 p-5">
      <h2 className="font-serif text-xl">RFP / competitor score</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Internal bid posture — not part of the client PDF. Lean into strengths; do not overclaim
        weaknesses. Weak must-haves should be excluded, phased, or partnered.
      </p>

      {score.competitorsNamed.length > 0 && (
        <p className="mt-3 text-sm">
          <span className="text-ink-soft">Named competitors. </span>
          {score.competitorsNamed.join(", ")}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs uppercase tracking-[0.16em] text-moss">We are strong on</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {score.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.16em] text-copper">We are weak on</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {score.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {score.criteria.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-rule text-xs uppercase tracking-[0.12em] text-ink-soft">
                <th className="py-2 pr-3 font-normal">Criterion</th>
                <th className="py-2 pr-3 font-normal">Need</th>
                <th className="py-2 pr-3 font-normal">Us</th>
                <th className="py-2 font-normal">Bid move</th>
              </tr>
            </thead>
            <tbody>
              {score.criteria.map((row) => (
                <tr key={row.criterion} className="border-b border-rule/70 align-top">
                  <td className="py-2 pr-3">
                    <p className="font-medium">{row.criterion}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-soft">{row.why}</p>
                  </td>
                  <td className="py-2 pr-3 capitalize text-ink-soft">{row.importance}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${FIT[row.ourPosition].className}`}
                    >
                      {FIT[row.ourPosition].label}
                    </span>
                  </td>
                  <td className="py-2 leading-6">{row.bidMove}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs uppercase tracking-[0.16em] text-moss">Win themes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {score.winThemes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.16em] text-copper">Watchouts</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {score.watchouts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
