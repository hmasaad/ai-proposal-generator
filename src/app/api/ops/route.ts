import { createUser, jsonError, listUsers, requireSession } from "@/lib/auth";
import { listAudit, recordAudit } from "@/lib/audit";
import { canManageUsers, canViewOps } from "@/lib/session";
import { listUsage } from "@/lib/usage";
import type { StudioRole } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireSession(request);
    if (!canViewOps(user.role)) {
      return Response.json({ error: "Finance or admin can open ops." }, { status: 403 });
    }
    const [audit, usage, users] = await Promise.all([
      listAudit(100),
      listUsage(100),
      canManageUsers(user.role) ? listUsers() : Promise.resolve([]),
    ]);
    return Response.json({ audit, usage, users });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSession(request);
    if (!canManageUsers(user.role)) {
      return Response.json({ error: "Only admin can invite people." }, { status: 403 });
    }
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      role?: StudioRole;
      password?: string;
    };
    const created = await createUser({
      email: body.email ?? "",
      name: body.name ?? "",
      role: body.role === "finance" || body.role === "admin" ? body.role : "sales",
      password: body.password ?? "",
    });
    await recordAudit(user, "invite_user", `Invited ${created.email} as ${created.role}`);
    return Response.json({ user: created });
  } catch (error) {
    return jsonError(error);
  }
}
