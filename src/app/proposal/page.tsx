"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ProposalDocument } from "@/components/ProposalDocument";
import { loadCompany, loadProposal } from "@/lib/storage";
import { proposalToMarkdown } from "@/lib/proposal-markdown";
import { formatDate } from "@/lib/format";
import type { CompanyProfile, Proposal } from "@/lib/types";

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
        </div>
      </div>
    </div>
  );
}
