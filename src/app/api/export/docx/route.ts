import { proposalToDocx } from "@/lib/export-docx";
import { fileSlug } from "@/lib/export-pack";
import type { ClientPackKind, CompanyProfile, Proposal } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      pack?: ClientPackKind;
      proposal?: Proposal;
      company?: CompanyProfile;
    };
    if (!body.proposal || !body.company) {
      return Response.json({ error: "Missing proposal." }, { status: 400 });
    }
    const pack = body.pack ?? "full";
    const buffer = await proposalToDocx(pack, body.proposal, body.company);
    const suffix =
      pack === "full" ? "proposal" : pack === "sow" ? "sow" : pack === "board" ? "board" : pack;
    const filename = `${fileSlug(body.proposal.projectTitle)}-${suffix}.docx`;
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not build the Word file.";
    return Response.json({ error: message }, { status: 500 });
  }
}
