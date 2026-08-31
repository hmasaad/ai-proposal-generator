"use client";

import { useState } from "react";
import { LESSON_CATEGORIES } from "@/lib/sample-lessons";
import { addLesson } from "@/lib/storage";
import { newId } from "@/lib/format";
import type { Lesson, LessonCategory } from "@/lib/types";

export function LessonForm({
  proposalId,
  projectTitle,
  onSaved,
}: {
  proposalId?: string;
  projectTitle?: string;
  onSaved?: (lesson: Lesson) => void;
}) {
  const [category, setCategory] = useState<LessonCategory>("estimate");
  const [mistake, setMistake] = useState("");
  const [correction, setCorrection] = useState("");
  const [saved, setSaved] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!mistake.trim() || !correction.trim()) return;
    const lesson: Lesson = {
      id: newId(),
      createdAt: new Date().toISOString(),
      proposalId,
      projectTitle,
      category,
      mistake: mistake.trim(),
      correction: correction.trim(),
    };
    addLesson(lesson);
    setMistake("");
    setCorrection("");
    setSaved(true);
    onSaved?.(lesson);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <form
      onSubmit={submit}
      className="no-print rounded-3xl border border-rule bg-white/50 p-5"
    >
      <h2 className="font-serif text-xl">Log a mistake for next time</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">
        This is indexed into the studio vector store. The next proposal retrieves it with RAG
        if the new brief is similar.
      </p>
      <label className="mt-4 block text-sm text-ink-soft">
        Category
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as LessonCategory)}
          className="mt-1 w-full rounded-xl border border-rule bg-paper px-3 py-2 text-ink"
        >
          {LESSON_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm text-ink-soft">
        What went wrong
        <textarea
          value={mistake}
          onChange={(event) => setMistake(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-rule bg-paper px-3 py-2 text-ink"
          placeholder="We under-scoped calendar import and ate a week after signature."
        />
      </label>
      <label className="mt-3 block text-sm text-ink-soft">
        What we should do next time
        <textarea
          value={correction}
          onChange={(event) => setCorrection(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-rule bg-paper px-3 py-2 text-ink"
          placeholder="Demand a sample export in week 1 and price migration as its own phase."
        />
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-forest px-4 py-2 text-sm text-paper"
        >
          Index lesson
        </button>
        {saved && <span className="text-sm text-moss">Saved to studio memory.</span>}
      </div>
    </form>
  );
}
