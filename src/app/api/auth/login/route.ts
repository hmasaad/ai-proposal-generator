import { authenticate, ensureUsers, jsonError } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { sessionCookie, signSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await ensureUsers();
    const body = (await request.json()) as { email?: string; password?: string };
    const user = await authenticate(body.email ?? "", body.password ?? "");
    if (!user) {
      return Response.json({ error: "Wrong email or password." }, { status: 401 });
    }
    const token = await signSession(user);
    await recordAudit(user, "login", `${user.name} signed in`);
    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": sessionCookie(token),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
