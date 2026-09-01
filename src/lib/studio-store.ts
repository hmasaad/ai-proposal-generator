import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEFAULT_COMPANY, SAMPLE_PAST_BIDS } from "./defaults";
import { SAMPLE_KNOWLEDGE } from "./sample-knowledge";
import { SAMPLE_LESSONS } from "./sample-lessons";
import type {
  BidComparable,
  CompanyProfile,
  KnowledgeDoc,
  Lesson,
  Proposal,
} from "./types";

const STORE_PATH = path.join(process.cwd(), "data", "studio.json");

export interface StudioState {
  company: CompanyProfile;
  lessons: Lesson[];
  knowledge: KnowledgeDoc[];
  history: BidComparable[];
  latestProposal: Proposal | null;
}

let writeChain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeChain.then(fn, fn);
  writeChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function mergeHistory(stored?: BidComparable[]) {
  const list = stored?.length ? stored : [];
  const seedById = new Map(SAMPLE_PAST_BIDS.map((item) => [item.id, item]));
  const ids = new Set(list.map((item) => item.id));
  const hydrated = list.map((item) => {
    const seed = seedById.get(item.id);
    if (!seed) return item;
    return { ...seed, ...item, reason: item.reason ?? seed.reason };
  });
  return [...hydrated, ...SAMPLE_PAST_BIDS.filter((item) => !ids.has(item.id))];
}

function seed(): StudioState {
  return {
    company: { ...DEFAULT_COMPANY, rates: [...DEFAULT_COMPANY.rates] },
    lessons: SAMPLE_LESSONS,
    knowledge: SAMPLE_KNOWLEDGE,
    history: SAMPLE_PAST_BIDS,
    latestProposal: null,
  };
}

async function readStore(): Promise<StudioState> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<StudioState>;
    const base = seed();
    return {
      company: { ...base.company, ...(parsed.company ?? {}) },
      lessons: parsed.lessons?.length ? parsed.lessons : base.lessons,
      knowledge: parsed.knowledge?.length ? parsed.knowledge : base.knowledge,
      history: mergeHistory(parsed.history),
      latestProposal: parsed.latestProposal ?? null,
    };
  } catch {
    return seed();
  }
}

async function writeStore(state: StudioState) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export function loadStudio() {
  return withLock(() => readStore());
}

export function saveStudio(state: StudioState) {
  return withLock(async () => {
    await writeStore(state);
    return state;
  });
}

export function patchStudio(patch: (current: StudioState) => StudioState) {
  return withLock(async () => {
    const current = await readStore();
    const next = patch(current);
    await writeStore(next);
    return next;
  });
}
