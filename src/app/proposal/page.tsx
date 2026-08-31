"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { LessonForm } from "@/components/LessonForm";
import { ProposalDocument } from "@/components/ProposalDocument";
import { loadCompany, loadProposal, saveProposal, addLesson } from "@/lib/storage";
import { proposalToMarkdown } from "@/lib/proposal-markdown";
import { formatDate, money } from "@/lib/format";
import { outcomeLesson, projectTypeLabel } from "@/lib/accuracy";
import type { BidOutcome, CompanyProfile, Proposal } from "@/lib/types";

const NAV = [
  { href: "#summary", label: "Summary" },
  { href: "#understanding", label: "Problem" },
  { href: "#approach", label: "Approach" },
  { href: "#scope", label: "Scope" },
  { href: "#timeline", label: "Timeline" },
  { href: "#investment", label: "Investment" },
  { href: "#assumptions", label: "Assumptions" },
  { href: "#risks", label: "Risks" },
  { href: "#questions", label: "Questions" },
  { href: "#week-one", label: "Week 1" },
];

export default function ProposalPage() {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProposal(loadProposal());
    setCompany(loadCompany());
    setReady(true);
  }, []);

  function downloadMarkdown() {
    if (!proposal || !company) return;
    const blob = new Blob([proposalToMarkdown(proposal, company.currency)], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${proposal.projectTitle.replace(/\s+/g, "-").toLowerCase()}-proposal.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyMarkdown() {
    if (!proposal || !company) return;
    await navigator.clipboard.writeText(proposalToMarkdown(proposal, company.currency));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (!ready) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-xl px-6 py-24 text-center text-ink-soft">
          Loading draft…
        </main>
      </div>
    );
  }

  if (!proposal || !company) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-serif text-3xl">No draft yet</h1>
          <p className="mt-3 text-ink-soft">
            Generate a proposal from client sources and it will appear here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-forest px-5 py-2.5 text-sm text-paper"
          >
            Start a proposal
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="no-print hidden lg:block">
          <div className="sticky top-6">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">
              {formatDate(proposal.createdAt)}
            </p>
            <nav className="mt-4 flex flex-col gap-1 text-sm">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-paper-2 hover:text-ink"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full bg-forest px-3 py-2 text-sm text-paper"
              >
                Print / PDF
              </button>
              <button
                type="button"
                onClick={downloadMarkdown}
                className="rounded-full border border-rule px-3 py-2 text-sm"
              >
                Download Markdown
              </button>
              <button
                type="button"
                onClick={() => void copyMarkdown()}
                className="rounded-full border border-rule px-3 py-2 text-sm"
              >
                {copied ? "Copied" : "Copy Markdown"}
              </button>
            </div>
            {proposal.openQuestions.length > 0 && (
              <p className="mt-6 text-xs leading-5 text-copper">
                {proposal.openQuestions.length === 1
                  ? "1 open question still sits in this draft. Confirm it before you send."
                  : `${proposal.openQuestions.length} open questions still sit in this draft. Confirm them before you send.`}
              </p>
            )}
            <p className="mt-4 text-xs text-ink-soft">Saved locally in this browser.</p>
          </div>
        </aside>

        <div>
          <div className="no-print mb-4 flex flex-wrap gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full bg-forest px-3 py-2 text-sm text-paper"
            >
              Print / PDF
            </button>
            <button
              type="button"
              onClick={downloadMarkdown}
              className="rounded-full border border-rule px-3 py-2 text-sm"
            >
              Markdown
            </button>
          </div>
          <ProposalDocument proposal={proposal} currency={company.currency} />
          <OutcomePanel
            proposal={proposal}
            currency={company.currency}
            onChange={(next, writeLesson) => {
              setProposal(next);
              saveProposal(next);
              if (!writeLesson) return;
              const lesson = outcomeLesson(next);
              if (lesson) addLesson(lesson);
            }}
          />
          {proposal.comparables && proposal.comparables.length > 0 && (
            <section className="no-print mt-8 rounded-3xl border border-rule bg-white/50 p-5">
              <h2 className="font-serif text-xl">Similar past bids</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Internal calibration — not part of the client PDF. Closest bids by type and size.
              </p>
              <ul className="mt-4 space-y-3">
                {proposal.comparables.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-rule bg-paper px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-moss">
                      {item.outcome} · {projectTypeLabel(item.projectType)} · {item.quotedHours}h
                      {item.actualHours ? ` quoted / ${item.actualHours}h actual` : ""}
                    </p>
                    <p className="mt-1 font-medium">
                      {item.projectTitle}{" "}
                      <span className="font-normal text-ink-soft">({item.clientName})</span>
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Quoted {money(item.quotedCost, company.currency)}
                    </p>
                    <p className="mt-2 text-sm leading-6">{item.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {proposal.retrievedMemory && proposal.retrievedMemory.length > 0 && (
            <section className="no-print mt-8 rounded-3xl border border-rule bg-white/50 p-5">
              <h2 className="font-serif text-xl">Retrieved studio memory</h2>
              <p className="mt-1 text-sm text-ink-soft">
                These chunks were nearest to this brief in the vector index.
              </p>
              <ul className="mt-4 space-y-3">
                {proposal.retrievedMemory.map((hit) => (
                  <li key={hit.id} className="rounded-2xl border border-rule bg-paper px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-moss">
                      {hit.sourceType} · {hit.title} · {hit.score.toFixed(3)}
                    </p>
                    <p className="mt-2 text-sm leading-6">{hit.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="mt-8">
            <LessonForm
              proposalId={proposal.id}
              projectTitle={proposal.projectTitle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const OUTCOMES: { id: BidOutcome; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "no_bid", label: "No bid" },
];

function OutcomePanel({
  proposal,
  currency,
  onChange,
}: {
  proposal: Proposal;
  currency: string;
  onChange: (next: Proposal, writeLesson: boolean) => void;
}) {
  const outcome = proposal.outcome ?? "draft";

  return (
    <section className="no-print mt-8 rounded-3xl border border-rule bg-white/50 p-5">
      <h2 className="font-serif text-xl">Win / loss</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Tag the outcome so the next similar bid retrieves it. Won or lost writes a lesson into studio memory.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {OUTCOMES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              onChange(
                { ...proposal, outcome: item.id },
                item.id === "won" || item.id === "lost",
              )
            }
            className={`rounded-full px-3 py-1.5 text-sm ${
              outcome === item.id ? "bg-forest text-paper" : "border border-rule"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
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
      {(outcome === "won" || outcome === "lost") && (
        <button
          type="button"
          onClick={() => onChange(proposal, true)}
          className="mt-3 rounded-full border border-rule px-3 py-1.5 text-sm"
        >
          Update studio memory
        </button>
      )}
    </section>
  );
}
