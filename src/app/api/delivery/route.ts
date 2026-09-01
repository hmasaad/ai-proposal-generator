import {
  generateChangeOrder,
  generateEpics,
  generateKickoffAndRaid,
} from "@/lib/delivery-generate";
import { DEFAULT_COMPANY } from "@/lib/defaults";
import type { CompanyProfile, Proposal } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: "kickoff" | "epics" | "changeOrder";
      proposal?: Proposal;
      company?: CompanyProfile | null;
      request?: string;
    };

    if (!body.proposal) {
      return Response.json({ error: "Missing proposal" }, { status: 400 });
    }

    const company = { ...DEFAULT_COMPANY, ...(body.company ?? {}) };

    if (body.mode === "epics") {
      const epics = await generateEpics(body.proposal);
      return Response.json({ epics });
    }

    if (body.mode === "changeOrder") {
      const changeOrder = await generateChangeOrder({
        proposal: body.proposal,
        company,
        request: body.request ?? "",
      });
      return Response.json({ changeOrder });
    }

    const pack = await generateKickoffAndRaid(body.proposal, company);
    return Response.json(pack);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not build delivery artifacts.";
    return Response.json({ error: message }, { status: 500 });
  }
}
