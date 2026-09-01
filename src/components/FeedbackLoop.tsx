import Link from "next/link";
import { money } from "@/lib/format";
import { LOOP_STEPS, loopStepIndex, OUTCOME_REASONS, reasonLabel } from "@/lib/feedback";
import type { BidComparable, BidOutcome, OutcomeReason, Proposal } from "@/lib/types";

const OUTCOMES: { id: BidOutcome; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "no_bid", label: "No bid" },
];

export function FeedbackStepper({
  proposal,
  historyCount,
}: {
  proposal: Proposal | null;
  historyCount: number;
}) {
  const active = loopStepIndex(proposal, historyCount);
  return (
    <ol className="flex flex-wrap gap-1.5">
      {LOOP_STEPS.map((step, index) => {
        const done = index < active;
        const current = index === active;
        return (
          <li key={step.id} className="flex shrink-0 items-center gap-1.5">
            <span
              className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] leading-4 ${
                current
                  ? "bg-forest text-paper"
                  : done
                    ? "bg-moss/15 text-forest"
                    : "bg-paper-2 text-ink-soft"
              }`}
            >
              {step.label}
            </span>
            {index < LOOP_STEPS.length - 1 && (
              <span className="text-[11px] text-ink-soft" aria-hidden>
                →
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function OutcomePanel({
  proposal,
  currency,
  historyCount,
  onChange,
}: {
  proposal: Proposal;
  currency: string;
  historyCount: number;
  onChange: (next: Proposal, store: boolean) => void;
}) {
  const outcome = proposal.outcome ?? "draft";
  const closed = outcome === "won" || outcome === "lost";

  function setOutcome(next: BidOutcome) {
    const stored = next === "won" || next === "lost" ? Boolean(proposal.outcomeReason) : next === "no_bid";
    onChange(
      {
        ...proposal,
        outcome: next,
        outcomeRecordedAt: stored ? new Date().toISOString() : proposal.outcomeRecordedAt,
      },
      stored,
    );
  }

  function setReason(reason: OutcomeReason) {
    onChange(
      {
        ...proposal,
        outcomeReason: reason,
        outcomeRecordedAt: closed ? new Date().toISOString() : proposal.outcomeRecordedAt,
      },
      closed,
    );
  }

  return (
    <section className="no-print mt-8 rounded-3xl border border-rule bg-white/50 p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-moss">Feedback loop</p>
      <h2 className="mt-1 font-serif text-xl">After every proposal</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Tag won or lost, capture why, and store it. Analytics and the next generate (RAG, pricing,
        win probability) use the outcome. Not part of the client PDF.
      </p>
      <div className="mt-4">
        <FeedbackStepper proposal={proposal} historyCount={historyCount} />
      </div>

      <p className="mt-5 text-xs uppercase tracking-[0.16em] text-moss">Won / Lost</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {OUTCOMES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOutcome(item.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              outcome === item.id ? "bg-forest text-paper" : "border border-rule"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {closed && (
        <>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-moss">Reason</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {OUTCOME_REASONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setReason(item.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  proposal.outcomeReason === item.id
                    ? "bg-forest text-paper"
                    : "border border-rule"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {!proposal.outcomeReason && (
            <p className="mt-2 text-sm text-copper">Pick a reason so the loop can store this bid.</p>
          )}
        </>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink-soft">Actual hours (optional)</span>
          <input
            type="number"
            min={0}
            value={proposal.actualHours ?? ""}
            onChange={(event) =>
              onChange(
                {
                  ...proposal,
                  actualHours: event.target.value ? Number(event.target.value) : undefined,
                },
                false,
              )
            }
            className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">Actual cost ({currency}, optional)</span>
          <input
            type="number"
            min={0}
            value={proposal.actualCost ?? ""}
            onChange={(event) =>
              onChange(
                {
                  ...proposal,
                  actualCost: event.target.value ? Number(event.target.value) : undefined,
                },
                false,
              )
            }
            className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2"
          />
        </label>
      </div>
      <label className="mt-3 block text-sm">
        <span className="text-ink-soft">What to remember next time</span>
        <textarea
          rows={3}
          value={proposal.outcomeNote ?? ""}
          onChange={(event) =>
            onChange({ ...proposal, outcomeNote: event.target.value }, false)
          }
          placeholder="e.g. Calendar import was quoted as 2 days; dual-run ate a week."
          className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2 leading-relaxed"
        />
      </label>
      {closed && proposal.outcomeReason && (
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Stored as {outcome}
          {proposal.outcomeReason ? ` · ${reasonLabel(proposal.outcomeReason)}` : ""}.{" "}
          <Link href="/loop" className="text-forest underline">
            Open analytics
          </Link>{" "}
          — the next bid retrieves this from studio memory.
        </p>
      )}
      {outcome === "won" && (
        <p className="mt-2 text-sm leading-6">
          They said yes.{" "}
          <Link href="/delivery" className="text-forest underline">
            Open delivery
          </Link>{" "}
          for kickoff, RAID, epics, and change orders.
        </p>
      )}
    </section>
  );
}

export function ClosedBidRow({
  item,
  currency,
}: {
  item: BidComparable;
  currency: string;
}) {
  return (
    <li className="rounded-2xl border border-rule bg-paper px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-moss">
        {item.outcome}
        {item.reason ? ` · ${reasonLabel(item.reason)}` : ""} · {item.quotedHours}h
        {item.actualHours ? ` quoted / ${item.actualHours}h actual` : ""}
      </p>
      <p className="mt-1 font-medium">
        {item.projectTitle}{" "}
        <span className="font-normal text-ink-soft">({item.clientName})</span>
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Quoted {money(item.quotedCost, currency)}
      </p>
      {item.note && <p className="mt-2 text-sm leading-6">{item.note}</p>}
    </li>
  );
}
