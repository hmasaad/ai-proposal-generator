import { SAMPLE_KNOWLEDGE } from "@/lib/sample-knowledge";
import { SAMPLE_LESSONS } from "@/lib/sample-lessons";
import { SAMPLE_PROPOSAL } from "@/lib/sample-proposal";
import type { KnowledgeDoc, Lesson, Proposal, SourceDocument } from "@/lib/types";
import { knowledgeToChunks, lessonToChunks, proposalToChunks } from "./documents";
import { embedDocument, embedQuery, embeddingsAvailable } from "./embed";
import { loadChunks, upsertChunks } from "./store";
import { cosine, type RagChunk, type RetrievedChunk } from "./types";

function keywordScore(query: string, text: string) {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const hay = text.toLowerCase();
  return words.reduce((score, word) => (hay.includes(word) ? score + 1 : score), 0);
}

async function ensureSeeded() {
  let existing = await loadChunks();
  if (!existing.length) {
    await indexLessons(SAMPLE_LESSONS);
    await indexProposal(SAMPLE_PROPOSAL);
    await indexKnowledge(SAMPLE_KNOWLEDGE);
    return loadChunks();
  }

  if (!existing.some((chunk) => chunk.sourceType === "knowledge")) {
    await indexKnowledge(SAMPLE_KNOWLEDGE);
    existing = await loadChunks();
  }

  if (embeddingsAvailable() && existing.some((chunk) => chunk.embedding.length === 0)) {
    try {
      const next: RagChunk[] = [];
      for (const chunk of existing) {
        next.push({
          ...chunk,
          embedding: chunk.embedding.length ? chunk.embedding : await embedDocument(chunk.text),
        });
      }
      await upsertChunks(next);
      return next;
    } catch {
      return existing;
    }
  }

  return existing;
}

export async function ensureIndex() {
  return ensureSeeded();
}

export async function indexLessons(lessons: Lesson[]) {
  const prepared = lessons.flatMap(lessonToChunks);
  const chunks: RagChunk[] = [];
  for (const part of prepared) {
    const embedding = embeddingsAvailable()
      ? await embedDocument(part.text).catch(() => [] as number[])
      : [];
    chunks.push({ ...part, embedding });
  }
  await upsertChunks(chunks);
}

export async function indexProposal(proposal: Proposal) {
  const prepared = proposalToChunks(proposal);
  const chunks: RagChunk[] = [];
  for (const part of prepared) {
    const embedding = embeddingsAvailable()
      ? await embedDocument(part.text).catch(() => [] as number[])
      : [];
    chunks.push({ ...part, embedding });
  }
  await upsertChunks(chunks);
}

export async function indexKnowledge(docs: KnowledgeDoc[]) {
  const prepared = docs.flatMap(knowledgeToChunks);
  const chunks: RagChunk[] = [];
  for (const part of prepared) {
    const embedding = embeddingsAvailable()
      ? await embedDocument(part.text).catch(() => [] as number[])
      : [];
    chunks.push({ ...part, embedding });
  }
  await upsertChunks(chunks);
}

export async function retrieveContext(
  sources: SourceDocument[],
  extraLessons: Lesson[] = [],
  extraKnowledge: KnowledgeDoc[] = [],
  limit = 8,
): Promise<RetrievedChunk[]> {
  if (extraLessons.length) {
    await indexLessons(extraLessons);
  }
  if (extraKnowledge.length) {
    await indexKnowledge(extraKnowledge);
  }

  const chunks = await ensureSeeded();
  const query = sources.map((source) => `${source.name}\n${source.text}`).join("\n");
  if (!chunks.length || !query.trim()) return [];

  let scored: RetrievedChunk[] = [];

  if (embeddingsAvailable() && chunks.some((chunk) => chunk.embedding.length)) {
    try {
      const queryVector = await embedQuery(query);
      scored = chunks.map((chunk) => ({
        id: chunk.id,
        sourceId: chunk.sourceId,
        sourceType: chunk.sourceType,
        title: chunk.title,
        text: chunk.text,
        score: cosine(queryVector, chunk.embedding),
      }));
    } catch {
      scored = [];
    }
  }

  if (!scored.length) {
    scored = chunks.map((chunk) => ({
      id: chunk.id,
      sourceId: chunk.sourceId,
      sourceType: chunk.sourceType,
      title: chunk.title,
      text: chunk.text,
      score: keywordScore(query, `${chunk.title} ${chunk.text}`),
    }));
  }

  const seen = new Set<string>();
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((hit) => {
      if (seen.has(hit.sourceId)) return false;
      seen.add(hit.sourceId);
      return hit.score > 0;
    })
    .slice(0, limit);
}

export function formatRetrieved(hits: RetrievedChunk[]) {
  if (!hits.length) {
    return "No prior studio memory retrieved.";
  }

  return hits
    .map(
      (hit, index) =>
        `MEMORY ${index + 1} [${hit.sourceType}] ${hit.title} (score ${hit.score.toFixed(3)})\n${hit.text}`,
    )
    .join("\n\n---\n\n");
}
