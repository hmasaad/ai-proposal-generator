import type { CompanyProfile, Proposal } from "./types";
import { DEFAULT_COMPANY, STORAGE_KEYS } from "./defaults";

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
}
