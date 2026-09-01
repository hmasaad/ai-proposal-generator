import { indexKnowledge, indexLessons, indexProposal, ensureIndex } from "@/lib/rag/retrieve";
import { loadChunks, removeSource } from "@/lib/rag/store";
import type { KnowledgeDoc, Lesson, Proposal } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const chunks = await ensureIndex();
  return Response.json({
    chunks: chunks.length,
    lessons: new Set(chunks.filter((chunk) => chunk.sourceType === "lesson").map((chunk) => chunk.sourceId))
      .size,
    proposals: new Set(
      chunks.filter((chunk) => chunk.sourceType === "proposal").map((chunk) => chunk.sourceId),
    ).size,
    knowledge: new Set(
      chunks.filter((chunk) => chunk.sourceType === "knowledge").map((chunk) => chunk.sourceId),
    ).size,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      lesson?: Lesson;
      proposal?: Proposal;
      knowledge?: KnowledgeDoc;
      removeSourceId?: string;
    };

    if (body.lesson) {
      await indexLessons([body.lesson]);
    }
    if (body.proposal) {
      await indexProposal(body.proposal);
    }
    if (body.knowledge) {
      await indexKnowledge([body.knowledge]);
    }
    if (body.removeSourceId) {
      await removeSource(body.removeSourceId);
    }

    const chunks = await loadChunks();
    return Response.json({ ok: true, chunks: chunks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not index memory.";
    return Response.json({ error: message }, { status: 500 });
  }
}
