"use client";

import { useState } from "react";
import { KNOWLEDGE_KINDS } from "@/lib/sample-knowledge";
import { addKnowledge } from "@/lib/storage";
import { newId } from "@/lib/format";
import type { KnowledgeDoc, KnowledgeKind } from "@/lib/types";

export function KnowledgeForm({
  onSaved,
}: {
  onSaved?: (doc: KnowledgeDoc) => void;
}) {
  const [kind, setKind] = useState<KnowledgeKind>("stack");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !text.trim()) return;
    setError(null);
    const doc: KnowledgeDoc = {
      id: newId(),
      createdAt: new Date().toISOString(),
      kind,
      title: title.trim(),
      text: text.trim(),
    };
    try {
      await addKnowledge(doc);
      setTitle("");
      setText("");
      setSaved(true);
      onSaved?.(doc);
      setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not index knowledge.");
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="rounded-3xl border border-rule bg-white/50 p-5"
    >
      <h2 className="font-serif text-xl">Index company knowledge</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">
        Past SOWs, case studies, and stack standards are retrieved on the next bid so the draft
        uses how you actually deliver — not a generic pitch.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-ink-soft">
          Kind
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as KnowledgeKind)}
            className="mt-1 w-full rounded-xl border border-rule bg-paper px-3 py-2 text-ink"
          >
            {KNOWLEDGE_KINDS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-ink-soft">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-rule bg-paper px-3 py-2 text-ink"
            placeholder="HIPAA stack standard"
          />
        </label>
      </div>
      <label className="mt-3 block text-sm text-ink-soft">
        Text
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={7}
          className="mt-1 w-full rounded-xl border border-rule bg-paper px-3 py-2 text-ink"
          placeholder="Paste a SOW excerpt, case study, or delivery standard…"
        />
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" className="rounded-full bg-forest px-4 py-2 text-sm text-paper">
          Index knowledge
        </button>
        {saved && <span className="text-sm text-moss">Saved to studio memory.</span>}
      </div>
      {error && <p className="mt-3 text-sm text-copper">{error}</p>}
    </form>
  );
}
