import { reviseProposalSections, translateProposal } from "@/lib/agent";
import { recordAudit } from "@/lib/audit";
import { jsonError, requireSession } from "@/lib/auth";
import { canDraft } from "@/lib/session";
import { loadStudio } from "@/lib/studio-store";
import { recordUsage } from "@/lib/usage";
import type { OutputLanguage, Proposal, ProposalSectionId } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const user = await requireSession(request);
    if (!canDraft(user.role)) {
      return Response.json(
        { error: "Sales drafts proposals. Finance locks the rate card." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      mode?: "revise" | "translate";
      proposal?: Proposal;
      sections?: ProposalSectionId[];
      instruction?: string;
      language?: OutputLanguage;
    };

    if (!body.proposal) {
      return Response.json({ error: "Missing proposal" }, { status: 400 });
    }

    const studio = await loadStudio();
    const extra = {
      proposalId: body.proposal.id,
      projectTitle: body.proposal.projectTitle,
    };

    if (body.mode === "translate") {
      if (!body.language) {
        return Response.json({ error: "Pick a language." }, { status: 400 });
      }
      const result = await translateProposal({
        proposal: body.proposal,
        language: body.language,
      });
      await recordAudit(user, "translate", `Translated to ${body.language}`, extra);
      await recordUsage(user, "translate", result.usage, extra);
      return Response.json({ proposal: result.proposal, usage: result.usage });
    }

    const result = await reviseProposalSections({
      proposal: body.proposal,
      company: studio.company,
      sections: body.sections ?? [],
      instruction: body.instruction,
      language: body.language,
    });
    await recordAudit(
      user,
      "revise",
      body.instruction?.trim() || "Regenerated marked sections",
      extra,
    );
    await recordUsage(user, "revise", result.usage, extra);
    return Response.json({ proposal: result.proposal, usage: result.usage });
  } catch (error) {
    return jsonError(error);
  }
}
