import { proposalToComparable } from "./accuracy";
import { makeVersion } from "./workflow";
import type {
  BidComparable,
  CompanyProfile,
  Lesson,
  Proposal,
  ProposalVersion,
} from "./types";
import { DEFAULT_COMPANY, SAMPLE_PAST_BIDS, STORAGE_KEYS } from "./defaults";
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
  return readJson<CompanyProfile>(STORAGE_KEYS.company) ?? DEFAULT_COMPANY;
}

export function saveCompany(company: CompanyProfile) {
  window.localStorage.setItem(STORAGE_KEYS.company, JSON.stringify(company));
}

export function loadProposal(): Proposal | null {
  return readJson<Proposal>(STORAGE_KEYS.proposal);
}

export function saveProposal(proposal: Proposal, options?: { index?: boolean }) {
  window.localStorage.setItem(STORAGE_KEYS.proposal, JSON.stringify(proposal));
  upsertHistory(proposalToComparable(proposal));
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
  void fetch("/api/rag/index", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson }),
  }).catch(() => undefined);
  return next;
}

export function removeLesson(id: string) {
  const next = loadLessons().filter((item) => item.id !== id);
  saveLessons(next);
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
