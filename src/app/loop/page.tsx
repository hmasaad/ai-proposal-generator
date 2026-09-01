"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ClosedBidRow, FeedbackStepper } from "@/components/FeedbackLoop";
import { analyzeOutcomes, LOOP_STEPS } from "@/lib/feedback";
import { hydrateStudio, loadCompany, loadHistory, loadProposal } from "@/lib/storage";
import type { BidComparable, CompanyProfile, Proposal } from "@/lib/types";

export default function FeedbackPage() {
  const [history, setHistory] = useState<BidComparable[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    void (async () => {
      await hydrateStudio();
      setHistory(loadHistory());
      setProposal(loadProposal());
      const company: CompanyProfile | null = loadCompany();
      if (company) setCurrency(company.currency);
    })();
  }, []);

  const stats = analyzeOutcomes(history);
  const closed = history.filter(
    (item) => item.outcome === "won" || item.outcome === "lost" || item.outcome === "no_bid",
  );

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-moss">Feedback loop</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">Outcomes that teach the next bid</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">
          After every proposal: tag won or lost, capture the reason, store it in studio history.
          Analytics and generate (RAG, pricing, win probability) read that store. This is the
          difference between an AI that writes documents and a system that compounds.
        </p>

        <section className="mt-8 rounded-3xl border border-rule bg-white/50 p-5">
          <ol className="space-y-3">
            {LOOP_STEPS.map((step, index) => (
              <li key={step.id} className="flex gap-3">
                <div className="flex w-6 flex-col items-center">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-[11px] text-paper">
                    {index + 1}
                  </span>
                  {index < LOOP_STEPS.length - 1 && (
                    <span className="mt-1 text-ink-soft" aria-hidden>
                      ↓
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    {step.id === "proposal" && "Finish the draft and send it."}
                    {step.id === "outcome" && "Mark won, lost, or no-bid on the latest draft."}
                    {step.id === "reason" && "Price, timeline, compliance, incumbent, or other."}
                    {step.id === "store" && "Written to studio history, a lesson, and the RAG index."}
                    {step.id === "analytics" && "Win rate, overrun, and loss reasons on this page."}
                    {step.id === "improve" &&
                      "The next generate retrieves similar outcomes before it prices and writes."}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <FeedbackStepper proposal={proposal} historyCount={closed.length} />
          </div>
          <p className="mt-4 text-sm">
            <Link href="/proposal" className="text-forest underline">
              Tag the latest draft
            </Link>
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat
            label="Win rate"
            value={`${stats.winRate}%`}
            hint={`${stats.won} won · ${stats.lost} lost · ${stats.closed} closed`}
          />
          <Stat
            label="Avg quoted hours"
            value={stats.avgQuotedHours.toLocaleString()}
            hint="Closed bids in studio history"
          />
          <Stat
            label="Hours overrun"
            value={stats.overrunPct == null ? "—" : `${stats.overrunPct > 0 ? "+" : ""}${stats.overrunPct}%`}
            hint={
              stats.avgActualHours == null
                ? "Record actual hours on wins"
                : `Actual avg ${stats.avgActualHours}h vs quoted`
            }
          />
        </section>

        {stats.byReason.length > 0 && (
          <section className="mt-8 rounded-3xl border border-rule bg-white/50 p-5">
            <h2 className="font-serif text-xl">Reasons</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Why deals closed. The pricing pass sees this as past-bid calibration.
            </p>
            <ul className="mt-4 space-y-2">
              {stats.byReason.map((row) => {
                const total = row.won + row.lost;
                return (
                  <li key={row.id}>
                    <div className="flex justify-between text-sm">
                      <span>{row.label}</span>
                      <span className="text-ink-soft">
                        {row.won} won · {row.lost} lost
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-2">
                      <div
                        className="h-2 rounded-full bg-forest"
                        style={{ width: `${Math.round((row.won / Math.max(total, 1)) * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {stats.byType.length > 0 && (
          <section className="mt-8 rounded-3xl border border-rule bg-white/50 p-5">
            <h2 className="font-serif text-xl">By project type</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {stats.byType.map((row) => (
                <li key={row.type} className="rounded-2xl border border-rule bg-paper px-4 py-3">
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {row.winRate}% win rate · {row.won} won · {row.lost} lost
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="font-serif text-xl">Stored outcomes</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Shared studio history. Amounts in {currency}.
          </p>
          <ul className="mt-4 space-y-3">
            {closed.map((item) => (
              <ClosedBidRow key={item.id} item={item} currency={currency} />
            ))}
            {closed.length === 0 && (
              <li className="text-sm text-ink-soft">
                No closed bids yet. Send a proposal, then tag won or lost on the draft.
              </li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-rule bg-white/50 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-moss">{label}</p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{hint}</p>
    </div>
  );
}
