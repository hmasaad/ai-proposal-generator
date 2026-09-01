import { runProposalAgent } from "@/lib/agent";
import { DEFAULT_COMPANY } from "@/lib/defaults";
import type {
  BidComparable,
  CompanyProfile,
  KnowledgeDoc,
  Lesson,
  ProjectType,
  SourceDocument,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  let sources: SourceDocument[] = [];
  let company: CompanyProfile = DEFAULT_COMPANY;
  let lessons: Lesson[] = [];
  let knowledge: KnowledgeDoc[] = [];
  let projectType: ProjectType = "web";
  let pastBids: BidComparable[] = [];

  try {
    const body = (await request.json()) as {
      sources?: SourceDocument[];
      company?: CompanyProfile | null;
      lessons?: Lesson[];
      knowledge?: KnowledgeDoc[];
      projectType?: ProjectType;
      pastBids?: BidComparable[];
    };
    sources = body.sources ?? [];
    company = { ...DEFAULT_COMPANY, ...(body.company ?? {}) };
    lessons = body.lessons ?? [];
    knowledge = body.knowledge ?? [];
    projectType = body.projectType ?? "web";
    pastBids = body.pastBids ?? [];
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)));
      };

      try {
        await runProposalAgent({
          sources,
          company,
          lessons,
          knowledge,
          projectType,
          pastBids,
          onEvent: (event) => {
            if (event.type === "step") send("step", event.step);
            if (event.type === "proposal") send("proposal", event.proposal);
            if (event.type === "error") send("error", { message: event.message });
          },
        });
        send("done", { ok: true });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Proposal generation failed.";
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
