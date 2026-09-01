import { jsonError, requireSession } from "@/lib/auth";
import { attachValidation, runEvalSuite } from "@/lib/eval";
import { loadStudio } from "@/lib/studio-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const suite = runEvalSuite();
    const studio = await loadStudio();
    const live = studio.latestProposal
      ? attachValidation(studio.latestProposal, studio.company)
      : null;
    return Response.json({
      suite,
      live: live
        ? {
            projectTitle: live.projectTitle,
            clientName: live.clientName,
            validation: live.validation,
          }
        : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
