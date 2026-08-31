import { proposalToComparable } from "./accuracy";
import type { BidComparable, CompanyProfile, Lesson, Proposal } from "./types";
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

export function saveProposal(proposal: Proposal) {
  window.localStorage.setItem(STORAGE_KEYS.proposal, JSON.stringify(proposal));
  upsertHistory(proposalToComparable(proposal));
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
