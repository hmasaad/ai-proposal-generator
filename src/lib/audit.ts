import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { AuditAction, AuditEvent, SessionUser } from "./types";

const AUDIT_PATH = path.join(process.cwd(), "data", "audit.json");
const MAX = 400;

type AuditFile = { events: AuditEvent[] };

async function readAudit(): Promise<AuditFile> {
  try {
    const raw = await readFile(AUDIT_PATH, "utf8");
    return JSON.parse(raw) as AuditFile;
  } catch {
    return { events: [] };
  }
}

async function writeAudit(file: AuditFile) {
  await mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  await writeFile(AUDIT_PATH, JSON.stringify(file, null, 2), "utf8");
}

export async function recordAudit(
  user: SessionUser,
  action: AuditAction,
  detail: string,
  extra?: { proposalId?: string; projectTitle?: string },
) {
  const file = await readAudit();
  const event: AuditEvent = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    email: user.email,
    role: user.role,
    action,
    detail,
    proposalId: extra?.proposalId,
    projectTitle: extra?.projectTitle,
  };
  file.events = [event, ...file.events].slice(0, MAX);
  await writeAudit(file);
  return event;
}

export async function listAudit(limit = 80) {
  return (await readAudit()).events.slice(0, limit);
}
