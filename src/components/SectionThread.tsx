"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { ProposalSectionId, SectionComment } from "@/lib/types";

export function SectionThread({
  sectionId,
  comments,
  author,
  locked,
  onAdd,
  onToggle,
}: {
  sectionId: ProposalSectionId;
  comments: SectionComment[];
  author: string;
  locked: boolean;
  onAdd: (sectionId: ProposalSectionId, body: string) => void;
  onToggle: (id: string) => void;
}) {
  const [body, setBody] = useState("");
  const open = comments.filter((item) => !item.resolved).length;

  return (
    <div className="no-print mt-4 rounded-2xl border border-rule bg-white/50 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-moss">
        Comments{open ? ` · ${open} open` : ""}
      </p>
      {comments.length === 0 && (
        <p className="mt-2 text-xs text-ink-soft">No comments yet.</p>
      )}
      <ul className="mt-2 space-y-2">
        {comments.map((item) => (
          <li
            key={item.id}
            className={`rounded-xl px-3 py-2 text-sm ${
              item.resolved ? "bg-paper-2 text-ink-soft" : "bg-paper"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{item.author}</span>
              <span className="text-xs">{formatDate(item.createdAt)}</span>
            </div>
            <p className={`mt-1 leading-6 ${item.resolved ? "line-through" : ""}`}>
              {item.body}
            </p>
            {!locked && (
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className="mt-1 text-xs text-forest"
              >
                {item.resolved ? "Reopen" : "Resolve"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {!locked && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!body.trim()) return;
            onAdd(sectionId, body.trim());
            setBody("");
          }}
        >
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={`Comment as ${author}`}
            className="min-w-0 flex-1 rounded-xl border border-rule bg-white/70 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full border border-rule px-3 py-1.5 text-sm"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
