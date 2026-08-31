import { indexLessons, indexProposal, ensureIndex } from "@/lib/rag/retrieve";
import { loadChunks } from "@/lib/rag/store";
import type { Lesson, Proposal } from "@/lib/types";

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
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      lesson?: Lesson;
      proposal?: Proposal;
    };

    if (body.lesson) {
      await indexLessons([body.lesson]);
    }
    if (body.proposal) {
      await indexProposal(body.proposal);
    }

    const chunks = await loadChunks();
    return Response.json({ ok: true, chunks: chunks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not index memory.";
    return Response.json({ error: message }, { status: 500 });
  }
}
