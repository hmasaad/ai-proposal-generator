import { proposalToComparable } from "./accuracy";
import { makeVersion } from "./workflow";
import type {
  BidComparable,
  CompanyProfile,
  KnowledgeDoc,
  Lesson,
  Proposal,
  ProposalVersion,
  SessionUser,
} from "./types";
import { DEFAULT_COMPANY, SAMPLE_PAST_BIDS, STORAGE_KEYS } from "./defaults";
import { SAMPLE_KNOWLEDGE } from "./sample-knowledge";
import { SAMPLE_LESSONS } from "./sample-lessons";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadCompany(): CompanyProfile {
  const stored = readJson<Partial<CompanyProfile>>(STORAGE_KEYS.company);
  if (!stored) return DEFAULT_COMPANY;
  return {
    ...DEFAULT_COMPANY,
    ...stored,
    rates: stored.rates?.length ? stored.rates : DEFAULT_COMPANY.rates,
  };
}

export function saveCompany(company: CompanyProfile) {
  window.localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(company));
}

export function loadProposal(): Proposal | null {
  return readJson<Proposal>(STORAGE_KEYS.proposal);
}

export function saveProposal(
  proposal: Proposal,
  options?: { index?: boolean; share?: boolean; sent?: boolean },
) {
  window.localStorage.setItem(STORAGE_KEYS.proposal, JSON.stringify(proposal));
  upsertHistory(proposalToComparable(proposal));
  if (options?.share || options?.sent) {
    void fetch("/api/studio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposal, sent: options.sent }),
    }).catch(() => undefined);
  }
  if (options?.index === false) return;
  void fetch("/api/rag/index", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposal }),
  }).catch(() => undefined);
}

export function loadHistory(): BidComparable[] {
  return readJson<BidComparable[]>(STORAGE_KEYS.history) ?? SAMPLE_PAST_BIDS;
}

export function saveHistory(history: BidComparable[]) {
  window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

export function upsertHistory(item: BidComparable) {
  const next = [item, ...loadHistory().filter((entry) => entry.id !== item.id)].slice(
    0,
    50,
  );
  saveHistory(next);
  return next;
}

export function loadLessons(): Lesson[] {
  return readJson<Lesson[]>(STORAGE_KEYS.lessons) ?? SAMPLE_LESSONS;
}

export function saveLessons(lessons: Lesson[]) {
  window.localStorage.setItem(STORAGE_KEYS.lessons, JSON.stringify(lessons));
}

export function addLesson(lesson: Lesson) {
  const next = [lesson, ...loadLessons().filter((item) => item.id !== lesson.id)];
  saveLessons(next);
  void fetch("/api/studio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson }),
  }).catch(() => undefined);
  return next;
}

export function removeLesson(id: string) {
  const next = loadLessons().filter((item) => item.id !== id);
  saveLessons(next);
  void fetch("/api/studio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ removeLessonId: id }),
  }).catch(() => undefined);
  return next;
}

export function loadKnowledge(): KnowledgeDoc[] {
  return readJson<KnowledgeDoc[]>(STORAGE_KEYS.knowledge) ?? SAMPLE_KNOWLEDGE;
}

export function saveKnowledge(docs: KnowledgeDoc[]) {
  window.localStorage.setItem(STORAGE_KEYS.knowledge, JSON.stringify(docs));
}

export async function addKnowledge(doc: KnowledgeDoc) {
  const next = [doc, ...loadKnowledge().filter((item) => item.id !== doc.id)];
  saveKnowledge(next);
  const response = await fetch("/api/studio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ knowledge: doc }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Could not index knowledge.");
  }
  return next;
}

export async function removeKnowledge(id: string) {
  const next = loadKnowledge().filter((item) => item.id !== id);
  saveKnowledge(next);
  await fetch("/api/studio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ removeKnowledgeId: id }),
  }).catch(() => undefined);
  return next;
}

export function loadAuthor() {
  if (typeof window === "undefined") return "You";
  return window.localStorage.getItem(STORAGE_KEYS.author)?.trim() || "You";
}

export function saveAuthor(name: string) {
  window.localStorage.setItem(STORAGE_KEYS.author, name.trim() || "You");
}

export function loadVersions(proposalId: string): ProposalVersion[] {
  const all = readJson<Record<string, ProposalVersion[]>>(STORAGE_KEYS.versions) ?? {};
  return all[proposalId] ?? [];
}

export function saveVersions(proposalId: string, versions: ProposalVersion[]) {
  const all = readJson<Record<string, ProposalVersion[]>>(STORAGE_KEYS.versions) ?? {};
  all[proposalId] = versions.slice(0, 12);
  window.localStorage.setItem(STORAGE_KEYS.versions, JSON.stringify(all));
}

export function pushVersion(proposal: Proposal, label: string) {
  const next = [makeVersion(proposal, label), ...loadVersions(proposal.id)];
  saveVersions(proposal.id, next);
  return next;
}

export async function hydrateStudio() {
  const response = await fetch("/api/studio");
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    company?: CompanyProfile;
    lessons?: Lesson[];
    knowledge?: KnowledgeDoc[];
    history?: BidComparable[];
    latestProposal?: Proposal | null;
  };
  if (payload.company) saveCompany(payload.company);
  if (payload.lessons) saveLessons(payload.lessons);
  if (payload.knowledge) saveKnowledge(payload.knowledge);
  if (payload.history) saveHistory(payload.history);
  if (payload.latestProposal) {
    const local = loadProposal();
    const serverTime = payload.latestProposal.updatedAt || payload.latestProposal.createdAt;
    const localTime = local?.updatedAt || local?.createdAt || "";
    if (!local || serverTime > localTime) {
      window.localStorage.setItem(
        STORAGE_KEYS.proposal,
        JSON.stringify(payload.latestProposal),
      );
    }
  }
  return payload;
}

export async function persistCompany(company: CompanyProfile) {
  saveCompany(company);
  const response = await fetch("/api/studio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Could not save the studio profile.");
  }
  const studio = (await response.json()) as { company?: CompanyProfile };
  if (studio.company) saveCompany(studio.company);
  return studio.company ?? company;
}

export async function setRatesLocked(locked: boolean) {
  const response = await fetch("/api/studio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ratesLocked: locked }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Could not update the rate lock.");
  }
  const studio = (await response.json()) as { company?: CompanyProfile };
  if (studio.company) saveCompany(studio.company);
  return studio.company;
}

export async function fetchMe(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/me");
  if (!response.ok) return null;
  const payload = (await response.json()) as { user?: SessionUser };
  return payload.user ?? null;
}
