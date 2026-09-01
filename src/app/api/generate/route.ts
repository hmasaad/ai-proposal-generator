import { runProposalAgent } from "@/lib/agent";
import { recordAudit } from "@/lib/audit";
import { jsonError, requireSession } from "@/lib/auth";
import { friendlyModelError } from "@/lib/model-errors";
import { canDraft } from "@/lib/session";
import { loadStudio, patchStudio } from "@/lib/studio-store";
import { recordUsage } from "@/lib/usage";
import { proposalToComparable } from "@/lib/accuracy";
import type { ModelUsage, ProjectType, Proposal, SourceDocument } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  let user;
  try {
    user = await requireSession(request);
  } catch (error) {
    return jsonError(error);
  }

  if (!canDraft(user.role)) {
    return Response.json(
      { error: "Sales drafts proposals. Finance locks the rate card." },
      { status: 403 },
    );
  }

  let sources: SourceDocument[] = [];
  let projectType: ProjectType = "web";

  try {
    const body = (await request.json()) as {
      sources?: SourceDocument[];
      projectType?: ProjectType;
    };
    sources = body.sources ?? [];
    projectType = body.projectType ?? "web";
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const studio = await loadStudio();
  const actor = user;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sse(event, data)));
      };

      try {
        let lastUsage: ModelUsage | null = null;
        let lastProposal: Proposal | null = null;
        await runProposalAgent({
          sources,
          company: studio.company,
          lessons: studio.lessons,
          knowledge: studio.knowledge,
          projectType,
          pastBids: studio.history,
          onEvent: (event) => {
            if (event.type === "step") send("step", event.step);
            if (event.type === "usage") {
              lastUsage = event.usage;
              send("usage", event.usage);
            }
            if (event.type === "proposal") {
              lastProposal = event.proposal;
              send("proposal", event.proposal);
            }
            if (event.type === "error") send("error", { message: event.message });
          },
        });
        const generated = lastProposal as Proposal | null;
        const billed = lastUsage as ModelUsage | null;
        if (generated) {
          const comparable = proposalToComparable(generated);
          await patchStudio((current) => ({
            ...current,
            latestProposal: generated,
            history: [
              comparable,
              ...current.history.filter((item) => item.id !== comparable.id),
            ].slice(0, 50),
          }));
          await recordAudit(
            actor,
            "generate",
            `Generated ${generated.projectTitle}`,
            {
              proposalId: generated.id,
              projectTitle: generated.projectTitle,
            },
          );
        }
        if (billed && generated) {
          await recordUsage(actor, "generate", billed, {
            proposalId: generated.id,
            projectTitle: generated.projectTitle,
          });
        }
        send("done", { ok: true, usage: billed });
      } catch (error) {
        send("error", { message: friendlyModelError(error) });
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
