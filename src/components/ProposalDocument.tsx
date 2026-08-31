"use client";

import { projectTypeLabel } from "@/lib/accuracy";
import { money } from "@/lib/format";
import type { Proposal } from "@/lib/types";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-rule py-8">
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-[15px] leading-7 text-ink">{children}</div>
    </section>
  );
}

export function ProposalDocument({
  proposal,
  currency,
}: {
  proposal: Proposal;
  currency: string;
}) {
  const included = proposal.scope.filter((item) => item.included);
  const excluded = proposal.scope.filter((item) => !item.included);
  const subtotal = proposal.estimates.reduce((sum, row) => sum + row.cost, 0);
  const contingency = Math.round(subtotal * (proposal.contingencyPct / 100));

  return (
    <article className="print-sheet mx-auto max-w-3xl rounded-3xl border border-rule bg-[#fcfaf6] px-8 py-10 shadow-[0_20px_50px_rgba(28,25,21,0.06)] sm:px-12">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">
        Project proposal
        {proposal.projectType ? ` · ${projectTypeLabel(proposal.projectType)}` : ""}
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight">
        {proposal.projectTitle}
      </h1>
      <p className="mt-3 text-ink-soft">
        Prepared for {proposal.clientName}
      </p>

      <Section id="summary" title="Executive summary">
        {proposal.executiveSummary.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </Section>

      <Section id="understanding" title="Understanding of the problem">
        {proposal.understanding.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </Section>

      <Section id="approach" title="Proposed approach">
        {proposal.approach.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </Section>

      <Section id="scope" title="Scope of work">
        <h3 className="font-medium">Included</h3>
        <ul className="list-disc space-y-2 pl-5">
          {included.map((item) => (
            <li key={item.title}>
              <span className="font-medium">{item.title}.</span> {item.description}
            </li>
          ))}
        </ul>
        <h3 className="pt-2 font-medium">Out of scope</h3>
        <ul className="list-disc space-y-2 pl-5">
          {excluded.map((item) => (
            <li key={item.title}>
              <span className="font-medium">{item.title}.</span> {item.description}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="deliverables" title="Deliverables">
        <ul className="list-disc space-y-2 pl-5">
          {proposal.deliverables.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section id="timeline" title="Timeline">
        <p>{proposal.timelineSummary}</p>
        <ol className="mt-4 space-y-4">
          {proposal.phases.map((phase) => (
            <li key={phase.name} className="rounded-2xl border border-rule bg-paper px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium">{phase.name}</h3>
                <span className="text-sm text-ink-soft">{phase.durationWeeks} weeks</span>
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
                {phase.objectives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm">
                <span className="text-ink-soft">Deliverables: </span>
                {phase.deliverables.join("; ")}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="investment" title="Investment">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-rule text-ink-soft">
                <th className="py-2 font-medium">Role</th>
                <th className="py-2 text-right font-medium">Hours</th>
                <th className="py-2 text-right font-medium">Rate</th>
                <th className="py-2 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {proposal.estimates.map((row) => (
                <tr key={row.role} className="border-b border-rule/70">
                  <td className="py-2">{row.role}</td>
                  <td className="py-2 text-right">{row.hours}</td>
                  <td className="py-2 text-right">{money(row.rate, currency)}</td>
                  <td className="py-2 text-right">{money(row.cost, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd>{money(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Contingency ({proposal.contingencyPct}%)</dt>
            <dd>{money(contingency, currency)}</dd>
          </div>
        </dl>
        {proposal.estimateBands ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  id: "lean",
                  label: "Lean",
                  hours: proposal.estimateBands.leanHours,
                  cost: proposal.estimateBands.leanCost,
                  note: "Must-haves only, after the cuts below",
                },
                {
                  id: "likely",
                  label: "Likely",
                  hours: proposal.estimateBands.likelyHours,
                  cost: proposal.estimateBands.likelyCost,
                  note: "Recommended send number",
                },
                {
                  id: "padded",
                  label: "Padded",
                  hours: proposal.estimateBands.paddedHours,
                  cost: proposal.estimateBands.paddedCost,
                  note: "If the unknowns below stay open",
                },
              ] as const
            ).map((band) => (
              <div
                key={band.id}
                className={`rounded-2xl border px-3 py-3 ${
                  band.id === "likely" ? "border-forest bg-paper" : "border-rule bg-white/50"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-moss">{band.label}</p>
                <p className="mt-1 font-medium">
                  {money(band.cost, currency)}
                </p>
                <p className="text-sm text-ink-soft">{band.hours} hours</p>
                <p className="mt-1 text-xs leading-5 text-ink-soft">{band.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 font-medium">
            Total {money(proposal.totalCost, currency)} · {proposal.totalHours} hours
          </p>
        )}
        {proposal.leanCuts && proposal.leanCuts.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium">To hit lean</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {proposal.leanCuts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {proposal.paddedAdds && proposal.paddedAdds.length > 0 && (
          <div className="mt-3">
            <h3 className="text-sm font-medium">What padded covers</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {proposal.paddedAdds.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section id="assumptions" title="Assumptions">
        <ul className="list-disc space-y-2 pl-5">
          {proposal.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section id="risks" title="Risks">
        <ul className="space-y-3">
          {proposal.risks.map((item) => (
            <li key={item.risk} className="rounded-2xl border border-rule bg-paper px-4 py-3">
              <p className="font-medium">{item.risk}</p>
              <p className="mt-1 text-sm text-ink-soft">
                Impact {item.impact} · Likelihood {item.likelihood}
              </p>
              <p className="mt-2 text-sm">{item.mitigation}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="questions" title="Open questions">
        <ul className="list-disc space-y-2 pl-5">
          {proposal.openQuestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      {proposal.weekOneNeeds && proposal.weekOneNeeds.length > 0 && (
        <Section id="week-one" title="Week-1 client checklist">
          <p className="text-sm text-ink-soft">
            Send this list with the proposal. Unanswered items are why the padded band exists.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            {proposal.weekOneNeeds.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="next" title="Next steps">
        <ol className="list-decimal space-y-2 pl-5">
          {proposal.nextSteps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </Section>
    </article>
  );
}
