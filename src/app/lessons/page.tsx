"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { KnowledgeForm } from "@/components/KnowledgeForm";
import { LessonForm } from "@/components/LessonForm";
import { KNOWLEDGE_KINDS } from "@/lib/sample-knowledge";
import { LESSON_CATEGORIES } from "@/lib/sample-lessons";
import { loadKnowledge, loadLessons, removeKnowledge, removeLesson, hydrateStudio } from "@/lib/storage";
import { formatDate } from "@/lib/format";
import type { KnowledgeDoc, Lesson } from "@/lib/types";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeDoc[]>([]);
  const [chunkCount, setChunkCount] = useState<number | null>(null);

  async function refresh() {
    await hydrateStudio();
    setLessons(loadLessons());
    setKnowledge(loadKnowledge());
    void fetch("/api/rag/index")
      .then((response) => response.json())
      .then((payload: { chunks?: number }) => setChunkCount(payload.chunks ?? 0))
      .catch(() => setChunkCount(null));
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-moss">RAG memory</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">Studio memory</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">
          Logged mistakes, finished proposals, past SOWs, case studies, and stack standards are
          shared for the whole studio, then chunked into the vector index. The next generation
          retrieves the closest chunks.
        </p>
        {chunkCount !== null && (
          <p className="mt-3 text-sm text-ink-soft">{chunkCount} chunks currently in the index.</p>
        )}

        <div className="mt-8">
          <KnowledgeForm onSaved={() => refresh()} />
        </div>

        <ul className="mt-8 space-y-4">
          {knowledge.map((doc) => (
            <li key={doc.id} className="rounded-2xl border border-rule bg-white/50 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.16em] text-moss">
                  {KNOWLEDGE_KINDS.find((item) => item.id === doc.kind)?.label}
                </p>
                <p className="text-xs text-ink-soft">{formatDate(doc.createdAt)}</p>
              </div>
              <p className="mt-2 font-medium">{doc.title}</p>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-ink-soft">{doc.text}</p>
              <button
                type="button"
                onClick={() => {
                  void removeKnowledge(doc.id).then(setKnowledge);
                }}
                className="mt-3 text-xs text-ink-soft hover:text-copper"
              >
                Remove from knowledge base
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          <LessonForm onSaved={() => refresh()} />
        </div>

        <ul className="mt-8 space-y-4">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="rounded-2xl border border-rule bg-white/50 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.16em] text-moss">
                  {LESSON_CATEGORIES.find((item) => item.id === lesson.category)?.label}
                  {lesson.projectTitle ? ` · ${lesson.projectTitle}` : ""}
                </p>
                <p className="text-xs text-ink-soft">{formatDate(lesson.createdAt)}</p>
              </div>
              <p className="mt-3 text-sm">
                <span className="text-ink-soft">Mistake. </span>
                {lesson.mistake}
              </p>
              <p className="mt-2 text-sm">
                <span className="text-ink-soft">Next time. </span>
                {lesson.correction}
              </p>
              <button
                type="button"
                onClick={() => {
                  setLessons(removeLesson(lesson.id));
                }}
                className="mt-3 text-xs text-ink-soft hover:text-copper"
              >
                Remove from studio memory
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
