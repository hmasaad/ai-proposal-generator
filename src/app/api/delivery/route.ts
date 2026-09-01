import {
  generateChangeOrder,
  generateEpics,
  generateKickoffAndRaid,
} from "@/lib/delivery-generate";
import { recordAudit } from "@/lib/audit";
import { jsonError, requireSession } from "@/lib/auth";
import { canDraft } from "@/lib/session";
import { loadStudio } from "@/lib/studio-store";
import { recordUsage } from "@/lib/usage";
import type { Proposal } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const user = await requireSession(request);
    if (!canDraft(user.role)) {
      return Response.json(
        { error: "Sales owns delivery artifacts after a win." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      mode?: "kickoff" | "epics" | "changeOrder";
      proposal?: Proposal;
      request?: string;
    };

    if (!body.proposal) {
      return Response.json({ error: "Missing proposal" }, { status: 400 });
    }

    const studio = await loadStudio();
    const extra = {
      proposalId: body.proposal.id,
      projectTitle: body.proposal.projectTitle,
    };

    if (body.mode === "epics") {
      const result = await generateEpics(body.proposal);
      await recordAudit(user, "delivery", "Broke phases into Jira/Linear epics", extra);
      await recordUsage(user, "delivery-epics", result.usage, extra);
      return Response.json({ epics: result.epics, usage: result.usage });
    }

    if (body.mode === "changeOrder") {
      const result = await generateChangeOrder({
        proposal: body.proposal,
        company: studio.company,
        request: body.request ?? "",
      });
      await recordAudit(user, "delivery", `Change order: ${result.changeOrder.title}`, extra);
      await recordUsage(user, "delivery-change-order", result.usage, extra);
      return Response.json({ changeOrder: result.changeOrder, usage: result.usage });
    }

    const pack = await generateKickoffAndRaid(body.proposal, studio.company);
    await recordAudit(user, "delivery", "Built kickoff and RAID from the brief", extra);
    await recordUsage(user, "delivery-kickoff", pack.usage, extra);
    return Response.json(pack);
  } catch (error) {
    return jsonError(error);
  }
}
