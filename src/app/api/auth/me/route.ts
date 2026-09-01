import { jsonError, requireSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireSession(request);
    return Response.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
