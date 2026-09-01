"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { LessonForm } from "@/components/LessonForm";
import { ProposalDocument } from "@/components/ProposalDocument";
import { RfpScorecard } from "@/components/RfpScorecard";
import { ExportActions } from "@/components/ExportActions";
import {
  BoardOnePager,
  CommercialAppendix,
  MsaAppendix,
  ProposalCover,
  SowCover,
} from "@/components/ClientPack";
import {
  addLesson,
  loadAuthor,
  loadCompany,
  loadProposal,
  loadVersions,
  pushVersion,
  saveAuthor,
  saveProposal,
  fetchMe,
  hydrateStudio,
} from "@/lib/storage";
import { formatDate, formatDateTime, money, newId } from "@/lib/format";
import { outcomeLesson, projectTypeLabel } from "@/lib/accuracy";
import { diffProposals } from "@/lib/proposal-diff";
import { printClientPack } from "@/lib/export-pack";
import {
  OUTPUT_LANGUAGES,
  PROPOSAL_SECTIONS,
  REVIEW_STATUSES,
  applyInvestment,
  languageMeta,
  sectionLabels,
  unresolvedComments,
} from "@/lib/workflow";
import type {
  BidOutcome,
  CompanyProfile,
  OutputLanguage,
  Proposal,
  ProposalSectionId,
  ProposalVersion,
  ReviewStatus,
} from "@/lib/types";

export default function ProposalPage() {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(true);
  const [marked, setMarked] = useState<ProposalSectionId[]>([]);
  const [instruction, setInstruction] = useState("");
  const [author, setAuthor] = useState("You");
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [diffId, setDiffId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<OutputLanguage>("en");

  useEffect(() => {
    void (async () => {
      const user = await fetchMe();
      await hydrateStudio();
      const loaded = loadProposal();
      setProposal(loaded);
      setCompany(loadCompany());
      const name = user?.name || loadAuthor();
      setAuthor(name);
      saveAuthor(name);
      if (loaded) {
        setLanguage(loaded.language ?? "en");
        let existing = loadVersions(loaded.id);
        if (existing.length === 0) {
          existing = pushVersion(loaded, "Original");
        }
        setVersions(existing);
      }
      setReady(true);
    })();
  }, []);

  function persist(next: Proposal, checkpoint?: string) {
    const rolled = applyInvestment({
      ...next,
      updatedAt: new Date().toISOString(),
    });
    if (checkpoint && proposal) {
      setVersions(pushVersion(proposal, checkpoint));
    }
    setProposal(rolled);
    saveProposal(rolled, {
      index: Boolean(checkpoint),
      share: Boolean(checkpoint) || rolled.outcome === "sent" || rolled.outcome === "won",
      sent: rolled.outcome === "sent" && proposal?.outcome !== "sent",
    });
  }

  async function revise(mode: "revise" | "translate") {
    if (!proposal || !company) return;
    setError(null);
    if (mode === "revise" && marked.length === 0) {
      setError("Mark the sections you want rewritten.");
      return;
    }
    setBusy(mode === "translate" ? "Translating…" : "Rewriting marked sections…");
    try {
      const response = await fetch("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          proposal,
          company,
          sections: marked,
          instruction,
          language,
        }),
      });
      const payload = (await response.json()) as { proposal?: Proposal; error?: string };
      if (!response.ok || !payload.proposal) {
        throw new Error(payload.error || "Could not update the draft.");
      }
      persist(
        payload.proposal,
        mode === "translate"
          ? `Before ${languageMeta(language).label}`
          : `Before regen: ${sectionLabels(marked)}`,
      );
      if (mode === "revise") {
        setMarked([]);
        setInstruction("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the draft.");
    } finally {
      setBusy(null);
    }
  }

  function restore(version: ProposalVersion) {
    if (!proposal) return;
    persist(
      {
        ...version.snapshot,
        id: proposal.id,
        comments: proposal.comments,
        outcome: proposal.outcome,
        outcomeNote: proposal.outcomeNote,
        actualHours: proposal.actualHours,
        actualCost: proposal.actualCost,
        delivery: proposal.delivery,
        reviewStatus: "draft",
      },
      `Before restore: ${version.label}`,
    );
    setLanguage(version.snapshot.language ?? "en");
    setDiffId(null);
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

  const locked = proposal.reviewStatus === "client_ready";
  const openComments = unresolvedComments(proposal);
  const diffVersion = versions.find((item) => item.id === diffId);
  const diffs = diffVersion ? diffProposals(diffVersion.snapshot, proposal) : [];

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="no-print hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-1">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">
              {formatDate(proposal.createdAt)}
            </p>
            <nav className="mt-4 flex flex-col gap-1 text-sm">
              {PROPOSAL_SECTIONS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.anchor}`}
                  className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-paper-2 hover:text-ink"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.16em] text-moss">Approval</p>
              <div className="mt-2 flex flex-col gap-1">
                {REVIEW_STATUSES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => persist({ ...proposal, reviewStatus: item.id as ReviewStatus })}
                    className={`rounded-2xl px-3 py-2 text-left text-sm ${
                      (proposal.reviewStatus ?? "draft") === item.id
                        ? "bg-forest text-paper"
                        : "border border-rule"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {openComments.length > 0 && (
                <p className="mt-2 text-xs leading-5 text-copper">
                  {openComments.length === 1
                    ? "1 open comment on scope / price / risks."
                    : `${openComments.length} open comments on scope / price / risks.`}
                </p>
              )}
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.16em] text-moss">Language</p>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as OutputLanguage)}
                className="mt-2 w-full rounded-xl border border-rule bg-white/60 px-3 py-2 text-sm"
              >
                {OUTPUT_LANGUAGES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={Boolean(busy) || locked}
                onClick={() => void revise("translate")}
                className="mt-2 w-full rounded-full border border-rule px-3 py-2 text-sm disabled:opacity-40"
              >
                Rewrite in {languageMeta(language).label}
              </button>
            </div>

            <div className="mt-6">
              <ExportActions proposal={proposal} company={company} />
            </div>
            <div className="mt-6">
              <Link
                href="/delivery"
                className="block rounded-2xl border border-rule px-3 py-2 text-sm"
              >
                <span className="block font-medium">Delivery workspace</span>
                <span className="text-ink-soft">Kickoff, RAID, epics, change orders</span>
              </Link>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setEditing((value) => !value)}
                className="rounded-full border border-rule px-3 py-2 text-sm"
              >
                {editing ? "Preview" : "Edit draft"}
              </button>
              <button
                type="button"
                onClick={() => setVersions(pushVersion(proposal, "Checkpoint"))}
                className="rounded-full border border-rule px-3 py-2 text-sm"
              >
                Save version
              </button>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.16em] text-moss">Versions</p>
              <ul className="mt-2 space-y-1">
                {versions.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setDiffId(item.id === diffId ? null : item.id)}
                      className="w-full rounded-xl px-2 py-1.5 text-left text-xs leading-5 hover:bg-paper-2"
                    >
                      <span className="block font-medium">{item.label}</span>
                      <span className="text-ink-soft">{formatDateTime(item.createdAt)}</span>
                    </button>
                    {diffId === item.id && (
                      <button
                        type="button"
                        onClick={() => restore(item)}
                        className="mt-1 w-full rounded-full border border-rule px-2 py-1 text-xs"
                      >
                        Restore this version
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <label className="mt-6 block text-xs text-ink-soft">
              Your name on comments
              <input
                value={author}
                onChange={(event) => {
                  setAuthor(event.target.value);
                  saveAuthor(event.target.value);
                }}
                className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2 text-sm"
              />
            </label>
            <p className="mt-4 text-xs text-ink-soft">Saved locally in this browser.</p>
          </div>
        </aside>

        <div>
          <div className="no-print mb-4 rounded-3xl border border-rule bg-white/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-moss">
                  {(proposal.reviewStatus &&
                    REVIEW_STATUSES.find((item) => item.id === proposal.reviewStatus)?.label) ||
                    "Draft"}
                  {locked ? " · locked" : editing ? " · editing" : " · preview"}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Mark sections, add comments, then regenerate only those. Unmarked text stays as you
                  edited it.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => setEditing((value) => !value)}
                  className="rounded-full border border-rule px-3 py-2 text-sm"
                >
                  {editing ? "Preview" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={() => printClientPack("full")}
                  className="rounded-full bg-forest px-3 py-2 text-sm text-paper"
                >
                  Branded PDF
                </button>
              </div>
            </div>
            {!locked && (
              <div className="mt-3 grid gap-2">
                <textarea
                  rows={2}
                  value={instruction}
                  onChange={(event) => setInstruction(event.target.value)}
                  placeholder="Instruction for marked sections, e.g. Drop payments from v1 and recut price to the lean band."
                  className="w-full rounded-xl border border-rule bg-white/70 px-3 py-2 text-sm leading-relaxed"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={Boolean(busy) || marked.length === 0}
                    onClick={() => void revise("revise")}
                    className="rounded-full bg-forest px-4 py-2 text-sm text-paper disabled:opacity-40"
                  >
                    {busy ??
                      (marked.length
                        ? `Regenerate ${sectionLabels(marked)}`
                        : "Mark sections to regenerate")}
                  </button>
                  {marked.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMarked([])}
                      className="text-sm text-ink-soft"
                    >
                      Clear marks
                    </button>
                  )}
                </div>
              </div>
            )}
            {locked && (
              <p className="mt-3 text-sm text-ink-soft">
                Client-ready. Move back to Draft to edit or regenerate.
              </p>
            )}
            {error && <p className="mt-3 text-sm text-copper">{error}</p>}
          </div>

          {diffVersion && (
            <section className="no-print mb-4 rounded-3xl border border-rule bg-white/50 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl">Diff vs {diffVersion.label}</h2>
                <button type="button" onClick={() => setDiffId(null)} className="text-sm text-ink-soft">
                  Close
                </button>
              </div>
              <ul className="mt-4 space-y-4">
                {diffs.filter((item) => item.changed).length === 0 && (
                  <li className="text-sm text-ink-soft">No section changes.</li>
                )}
                {diffs
                  .filter((item) => item.changed)
                  .map((item) => (
                    <li key={item.sectionId} className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-moss">
                          {item.label} · before
                        </p>
                        <pre className="mt-1 whitespace-pre-wrap text-xs leading-5 text-ink-soft">
                          {item.before || "—"}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-moss">
                          {item.label} · current
                        </p>
                        <pre className="mt-1 whitespace-pre-wrap text-xs leading-5">{item.after || "—"}</pre>
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          <ProposalCover proposal={proposal} company={company} />
          <SowCover proposal={proposal} company={company} />
          <ProposalDocument
            proposal={proposal}
            currency={company.currency}
            editor={{
              enabled: editing,
              locked,
              marked,
              author,
              onToggleMark: (id) =>
                setMarked((current) =>
                  current.includes(id)
                    ? current.filter((item) => item !== id)
                    : [...current, id],
                ),
              onChange: (next) => persist(next),
              onAddComment: (sectionId, body) =>
                persist({
                  ...proposal,
                  comments: [
                    {
                      id: newId(),
                      sectionId,
                      author,
                      body,
                      createdAt: new Date().toISOString(),
                      resolved: false,
                    },
                    ...(proposal.comments ?? []),
                  ],
                }),
              onToggleComment: (id) =>
                persist({
                  ...proposal,
                  comments: (proposal.comments ?? []).map((item) =>
                    item.id === id ? { ...item, resolved: !item.resolved } : item,
                  ),
                }),
            }}
          />
          <CommercialAppendix proposal={proposal} company={company} />
          <MsaAppendix proposal={proposal} company={company} />
          <BoardOnePager proposal={proposal} company={company} />
          <OutcomePanel
            proposal={proposal}
            currency={company.currency}
            onChange={(next, writeLesson) => {
              persist(next);
              if (!writeLesson) return;
              const lesson = outcomeLesson(next);
              if (lesson) addLesson(lesson);
            }}
          />
          {proposal.rfpScore && <RfpScorecard score={proposal.rfpScore} />}
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
        Tag the outcome so the next similar bid retrieves it. Won or lost writes a lesson into studio
        memory.
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
      {outcome === "won" && (
        <p className="mt-4 text-sm leading-6">
          They said yes.{" "}
          <Link href="/delivery" className="text-forest underline">
            Open delivery
          </Link>{" "}
          for kickoff, RAID, Jira/Linear epics, and change orders from this brief.
        </p>
      )}
    </section>
  );
}
