"use client";

import { useRef, useState } from "react";
import { Captions, FileUp, Mail, Plus, Trash2 } from "lucide-react";
import { SOURCE_KINDS } from "@/lib/defaults";
import { ingestFileError, ingestSourceText } from "@/lib/ingest";
import { parseEmailThread } from "@/lib/import-mail";
import { parseTranscript } from "@/lib/import-transcript";
import { newId } from "@/lib/format";
import type { SourceDocument, SourceKind } from "@/lib/types";

type Panel = "paste" | "email" | "transcript" | null;

async function parseUploadedFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    ["txt", "md", "csv", "json", "html", "eml", "vtt", "srt"].includes(extension) ||
    file.type.startsWith("text/") ||
    file.type === "message/rfc822"
  ) {
    return file.text();
  }

  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/parse", { method: "POST", body });
  const payload = (await response.json()) as { text?: string; error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `Could not read ${file.name}`);
  }
  return payload.text ?? "";
}

export function SourceIntake({
  sources,
  onChange,
  disabled,
}: {
  sources: SourceDocument[];
  onChange: (sources: SourceDocument[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [pasteName, setPasteName] = useState("Pasted notes");
  const [pasteKind, setPasteKind] = useState<SourceKind>("notes");
  const [pasteText, setPasteText] = useState("");
  const [specialName, setSpecialName] = useState("");
  const [specialText, setSpecialText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function togglePanel(next: Panel) {
    setPanel((open) => (open === next ? null : next));
    setError(null);
    if (next === "email") setSpecialName("Email thread");
    if (next === "transcript") setSpecialName("Meeting transcript");
  }

  async function addFiles(fileList: FileList | File[]) {
    setError(null);
    setBusy(true);
    try {
      const next = [...sources];
      for (const file of Array.from(fileList)) {
        const blocked = ingestFileError(file.name);
        if (blocked) throw new Error(blocked);
        const raw = await parseUploadedFile(file);
        const ingested = ingestSourceText(file.name, raw);
        next.push({
          id: newId(),
          name: file.name,
          kind: ingested.kind,
          text: ingested.text,
        });
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function addPaste() {
    if (!pasteText.trim()) return;
    const ingested = ingestSourceText(pasteName, pasteText);
    const autoKind = ingested.kind === "email" || ingested.kind === "transcript";
    onChange([
      ...sources,
      {
        id: newId(),
        name: pasteName.trim() || "Pasted notes",
        kind: autoKind ? ingested.kind : pasteKind,
        text: autoKind ? ingested.text : pasteText,
      },
    ]);
    setPasteText("");
    setPanel(null);
  }

  function addEmail() {
    if (!specialText.trim()) return;
    onChange([
      ...sources,
      {
        id: newId(),
        name: specialName.trim() || "Email thread",
        kind: "email",
        text: parseEmailThread(specialText),
      },
    ]);
    setSpecialText("");
    setPanel(null);
  }

  function addTranscript() {
    if (!specialText.trim()) return;
    onChange([
      ...sources,
      {
        id: newId(),
        name: specialName.trim() || "Meeting transcript",
        kind: "transcript",
        text: parseTranscript(specialText),
      },
    ]);
    setSpecialText("");
    setPanel(null);
  }

  function update(id: string, patch: Partial<SourceDocument>) {
    onChange(sources.map((source) => (source.id === id ? { ...source, ...patch } : source)));
  }

  return (
    <section className="flex flex-col gap-4">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files);
        }}
        className="rounded-2xl border border-dashed border-rule bg-paper-2/50 px-5 py-8 text-center"
      >
        <FileUp className="mx-auto mb-3 h-5 w-5 text-moss" />
        <p className="font-serif text-lg">Drop client materials here</p>
        <p className="mt-1 text-sm text-ink-soft">
          RFP, Gmail/Outlook thread, Zoom/Meet transcript, notes, or a previous proposal. PDF,
          Word, .eml, .vtt, .srt, or text.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-forest px-4 py-2 text-sm text-paper disabled:opacity-50"
          >
            {busy ? "Reading files…" : "Upload files"}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => togglePanel("email")}
            className="inline-flex items-center gap-1 rounded-full border border-rule px-4 py-2 text-sm"
          >
            <Mail className="h-4 w-4" />
            Email thread
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => togglePanel("transcript")}
            className="inline-flex items-center gap-1 rounded-full border border-rule px-4 py-2 text-sm"
          >
            <Captions className="h-4 w-4" />
            Transcript
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => togglePanel("paste")}
            className="inline-flex items-center gap-1 rounded-full border border-rule px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Paste text
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.html,.eml,.vtt,.srt"
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {panel === "paste" && (
        <div className="rounded-2xl border border-rule bg-white/50 p-4">
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <input
              value={pasteName}
              onChange={(event) => setPasteName(event.target.value)}
              className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm"
              placeholder="Source name"
            />
            <select
              value={pasteKind}
              onChange={(event) => setPasteKind(event.target.value as SourceKind)}
              className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm"
            >
              {SOURCE_KINDS.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
            rows={8}
            className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm leading-relaxed"
            placeholder="Paste the email, RFP excerpt, or meeting notes…"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={addPaste}
              className="rounded-full bg-forest px-4 py-2 text-sm text-paper"
            >
              Add source
            </button>
          </div>
        </div>
      )}

      {panel === "email" && (
        <div className="rounded-2xl border border-rule bg-white/50 p-4">
          <p className="text-sm text-ink-soft">
            Paste a Gmail or Outlook thread, or upload an .eml. Quoted replies are split into
            chronological messages. Outlook .msg is not supported — save as .eml instead.
          </p>
          <input
            value={specialName}
            onChange={(event) => setSpecialName(event.target.value)}
            className="mt-3 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm"
            placeholder="Thread name"
          />
          <textarea
            value={specialText}
            onChange={(event) => setSpecialText(event.target.value)}
            rows={10}
            className="mt-3 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm leading-relaxed"
            placeholder={"From: Priya Shah\nSent: Thursday, August 21, 2026 9:14 AM\nSubject: Re: portal RFP\n\nThanks for jumping on the intro call…"}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={addEmail}
              className="rounded-full bg-forest px-4 py-2 text-sm text-paper"
            >
              Clean and add
            </button>
          </div>
        </div>
      )}

      {panel === "transcript" && (
        <div className="rounded-2xl border border-rule bg-white/50 p-4">
          <p className="text-sm text-ink-soft">
            Paste a Zoom or Google Meet transcript, or upload .vtt / .srt. Consecutive lines from
            the same speaker are collapsed into turns.
          </p>
          <input
            value={specialName}
            onChange={(event) => setSpecialName(event.target.value)}
            className="mt-3 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm"
            placeholder="Call name"
          />
          <textarea
            value={specialText}
            onChange={(event) => setSpecialText(event.target.value)}
            rows={10}
            className="mt-3 w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm leading-relaxed"
            placeholder={"WEBVTT\n\n00:00:04.000 --> 00:00:12.000\nPriya Shah: We looked at Phreesia…"}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={addTranscript}
              className="rounded-full bg-forest px-4 py-2 text-sm text-paper"
            >
              Clean and add
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-copper/30 bg-copper/10 px-3 py-2 text-sm text-copper">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {sources.map((source) => (
          <li key={source.id} className="rounded-2xl border border-rule bg-white/60 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <input
                value={source.name}
                onChange={(event) => update(source.id, { name: event.target.value })}
                className="min-w-0 flex-1 bg-transparent font-medium outline-none"
              />
              <select
                value={source.kind}
                onChange={(event) =>
                  update(source.id, { kind: event.target.value as SourceKind })
                }
                className="rounded-full border border-rule bg-paper px-2 py-1 text-xs"
              >
                {SOURCE_KINDS.map((kind) => (
                  <option key={kind.id} value={kind.id}>
                    {kind.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onChange(sources.filter((item) => item.id !== source.id))}
                className="rounded-full p-1.5 text-ink-soft hover:bg-paper-2 hover:text-copper"
                aria-label="Remove source"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={source.text}
              onChange={(event) => update(source.id, { text: event.target.value })}
              rows={5}
              className="w-full resize-y rounded-lg border border-rule bg-paper px-3 py-2 text-sm leading-relaxed text-ink-soft"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
