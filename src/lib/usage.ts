import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ModelUsage, SessionUser, UsageEvent } from "./types";

const USAGE_PATH = path.join(process.cwd(), "data", "usage.json");
const MAX = 400;

type UsageFile = { events: UsageEvent[] };

async function readUsage(): Promise<UsageFile> {
  try {
    const raw = await readFile(USAGE_PATH, "utf8");
    return JSON.parse(raw) as UsageFile;
  } catch {
    return { events: [] };
  }
}

async function writeUsage(file: UsageFile) {
  await mkdir(path.dirname(USAGE_PATH), { recursive: true });
  await writeFile(USAGE_PATH, JSON.stringify(file, null, 2), "utf8");
}

export async function recordUsage(
  user: SessionUser,
  action: string,
  usage: ModelUsage,
  extra?: { proposalId?: string; projectTitle?: string },
) {
  if (usage.totalTokens <= 0 && usage.costUsd <= 0) return null;
  const file = await readUsage();
  const event: UsageEvent = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    action,
    proposalId: extra?.proposalId,
    projectTitle: extra?.projectTitle,
    ...usage,
  };
  file.events = [event, ...file.events].slice(0, MAX);
  await writeUsage(file);
  return event;
}

export async function listUsage(limit = 80) {
  const events = (await readUsage()).events;
  const monthKey = new Date().toISOString().slice(0, 7);
  const thisMonth = events.filter((item) => item.at.startsWith(monthKey));
  const sum = (rows: UsageEvent[]) =>
    rows.reduce(
      (acc, row) => ({
        costUsd: acc.costUsd + row.costUsd,
        totalTokens: acc.totalTokens + row.totalTokens,
        inputTokens: acc.inputTokens + row.inputTokens,
        outputTokens: acc.outputTokens + row.outputTokens,
        runs: acc.runs + 1,
      }),
      { costUsd: 0, totalTokens: 0, inputTokens: 0, outputTokens: 0, runs: 0 },
    );
  return {
    events: events.slice(0, limit),
    month: { key: monthKey, ...sum(thisMonth) },
    all: sum(events),
  };
}
