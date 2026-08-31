import type { Lesson } from "./types";

export const SAMPLE_LESSONS: Lesson[] = [
  {
    id: "lesson-integration",
    createdAt: "2026-03-12T10:00:00.000Z",
    projectTitle: "Clinic scheduling rewrite",
    category: "estimate",
    mistake:
      "We priced calendar import as a two-day CSV job. The client's 'simple export' was three incompatible Google Calendars and we ate a week.",
    correction:
      "Treat calendar/data migration as its own phase with dual-run. Never estimate import as a single engineer-day unless you have seen a sample file.",
  },
  {
    id: "lesson-phi-sms",
    createdAt: "2026-04-02T10:00:00.000Z",
    projectTitle: "Patient reminders v1",
    category: "scope",
    mistake:
      "The proposal promised SMS reminders with visit reason. Compliance killed it after signature and we had to rewrite copy and the timeline.",
    correction:
      "If health or finance is in play, keep SMS to a non-PHI ping plus a login link. Put visit details in authenticated email or the portal.",
  },
  {
    id: "lesson-fhir",
    createdAt: "2026-05-18T10:00:00.000Z",
    projectTitle: "Charting add-on",
    category: "scope",
    mistake:
      "EHR/FHIR was listed as a nice-to-have instead of a hard exclusion. The buyer assumed it was included. Change order fight followed.",
    correction:
      "If the client names Epic, FHIR, or an EHR 'later', put it in out-of-scope with a priced follow-on phase. Do not leave it as a vague later.",
  },
  {
    id: "lesson-budget-cut",
    createdAt: "2026-06-09T10:00:00.000Z",
    projectTitle: "Ops console for three sites",
    category: "estimate",
    mistake:
      "We bid the full wish list against a budget they had already told us. They picked a cheaper vendor who cut payments from v1.",
    correction:
      "When budget and deadline conflict with the wish list, recommend the cut in the proposal. Protect the must-have path and make payments/analytics the first thing to slip.",
  },
];

export const LESSON_CATEGORIES: { id: Lesson["category"]; label: string }[] = [
  { id: "scope", label: "Scope" },
  { id: "estimate", label: "Estimate" },
  { id: "timeline", label: "Timeline" },
  { id: "risk", label: "Risk" },
  { id: "assumption", label: "Assumption" },
  { id: "wording", label: "Wording" },
  { id: "other", label: "Other" },
];
