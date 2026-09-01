"use client";

import { useState } from "react";
import { downloadBlob, fileSlug, printClientPack } from "@/lib/export-pack";
import { proposalToMarkdown } from "@/lib/proposal-markdown";
import type { ClientPackKind, CompanyProfile, Proposal } from "@/lib/types";

const PACKS: { id: ClientPackKind; label: string; hint: string }[] = [
  { id: "full", label: "Branded PDF", hint: "Cover, SOW, commercial, terms" },
  { id: "sow", label: "SOW PDF", hint: "Scope only — no prices" },
  { id: "commercial", label: "Commercial PDF", hint: "Investment + payment terms" },
  { id: "board", label: "Board one-pager", hint: "Landscape ask for the board" },
  { id: "msa", label: "MSA / terms", hint: "Legal appendix from template" },
];

export function ExportActions({
  proposal,
  company,
}: {
  proposal: Proposal;
  company: CompanyProfile;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slug = fileSlug(proposal.projectTitle);

  async function downloadDocx(pack: ClientPackKind) {
    setBusy(pack);
    setError(null);
    try {
      const response = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack, proposal, company }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Could not build the Word file.");
      }
      const blob = await response.blob();
      const suffix =
        pack === "full" ? "proposal" : pack === "sow" ? "sow" : pack === "board" ? "board" : pack;
      downloadBlob(blob, `${slug}-${suffix}.docx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build the Word file.");
    } finally {
      setBusy(null);
    }
  }

  function downloadMarkdown() {
    downloadBlob(
      new Blob([proposalToMarkdown(proposal, company.currency)], { type: "text/markdown" }),
      `${slug}-proposal.md`,
    );
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(proposalToMarkdown(proposal, company.currency));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="no-print space-y-3">
      <p className="text-xs uppercase tracking-[0.16em] text-moss">Client pack</p>
      <div className="flex flex-col gap-2">
        {PACKS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => printClientPack(item.id)}
            className={`rounded-2xl px-3 py-2 text-left text-sm ${
              item.id === "full" ? "bg-forest text-paper" : "border border-rule"
            }`}
          >
            <span className="block font-medium">{item.label}</span>
            <span className={item.id === "full" ? "text-paper/80" : "text-ink-soft"}>
              {item.hint}
            </span>
          </button>
        ))}
      </div>
      <p className="pt-2 text-xs uppercase tracking-[0.16em] text-moss">Word / Google Docs</p>
      <button
        type="button"
        disabled={Boolean(busy)}
        onClick={() => void downloadDocx("full")}
        className="w-full rounded-full border border-rule px-3 py-2 text-sm disabled:opacity-40"
      >
        {busy === "full" ? "Building…" : "Download .docx"}
      </button>
      <p className="text-xs leading-5 text-ink-soft">
        Opens in Word and in Google Docs (File → Open). Split packs:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(["sow", "commercial", "board", "msa"] as const).map((pack) => (
          <button
            key={pack}
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void downloadDocx(pack)}
            className="rounded-full border border-rule px-2 py-1.5 text-xs disabled:opacity-40"
          >
            {busy === pack ? "Building…" : `${pack === "msa" ? "MSA" : pack} .docx`}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={downloadMarkdown}
        className="w-full rounded-full border border-rule px-3 py-2 text-sm"
      >
        Download Markdown
      </button>
      <button
        type="button"
        onClick={() => void copyMarkdown()}
        className="w-full rounded-full border border-rule px-3 py-2 text-sm"
      >
        {copied ? "Copied" : "Copy Markdown"}
      </button>
      {error && <p className="text-xs leading-5 text-copper">{error}</p>}
    </div>
  );
}
