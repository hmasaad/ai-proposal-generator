import { reviseProposalSections, translateProposal } from "@/lib/agent";
import { DEFAULT_COMPANY } from "@/lib/defaults";
import type {
  CompanyProfile,
  OutputLanguage,
  Proposal,
  ProposalSectionId,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: "revise" | "translate";
      proposal?: Proposal;
      company?: CompanyProfile | null;
      sections?: ProposalSectionId[];
      instruction?: string;
      language?: OutputLanguage;
    };

    if (!body.proposal) {
      return Response.json({ error: "Missing proposal" }, { status: 400 });
    }

    const company = { ...DEFAULT_COMPANY, ...(body.company ?? {}) };

    if (body.mode === "translate") {
      if (!body.language) {
        return Response.json({ error: "Pick a language." }, { status: 400 });
      }
      const proposal = await translateProposal({
        proposal: body.proposal,
        language: body.language,
      });
      return Response.json({ proposal });
    }

    const proposal = await reviseProposalSections({
      proposal: body.proposal,
      company,
      sections: body.sections ?? [],
      instruction: body.instruction,
      language: body.language,
    });
    return Response.json({ proposal });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not revise the draft.";
    return Response.json({ error: message }, { status: 500 });
  }
}
