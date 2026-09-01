import type { KnowledgeDoc } from "./types";

export const KNOWLEDGE_KINDS: { id: KnowledgeDoc["kind"]; label: string }[] = [
  { id: "sow", label: "Past SOW" },
  { id: "case_study", label: "Case study" },
  { id: "stack", label: "Stack standard" },
  { id: "playbook", label: "Playbook" },
];

export const SAMPLE_KNOWLEDGE: KnowledgeDoc[] = [
  {
    id: "kb-stack-hipaa",
    createdAt: "2026-01-10T10:00:00.000Z",
    kind: "stack",
    title: "Northline stack standard — HIPAA / US-hosted web",
    text: `Studio standard for US healthcare and other PHI-adjacent web apps.
Default stack: TypeScript, Next.js, PostgreSQL, Prisma, AWS (us-east-1 or us-west-2 only), Terraform, GitHub Actions.
Auth: patients = email magic/password; staff = Entra ID or Google Workspace SSO plus MFA.
SMS: Twilio. Copy may never include visit reason, diagnosis, or other PHI. Login link only.
Payments: Stripe, feature-flagged so it can slip a quarter without blocking booking.
No native apps in a v1 web bid. No Epic/FHIR unless the SOW prices a discovery phase with a sample payload.
BAA and privacy policy start in week 1, in parallel with design — never after UI polish.`,
  },
  {
    id: "kb-case-westside",
    createdAt: "2026-03-20T10:00:00.000Z",
    kind: "case_study",
    title: "Case study — Westside Medical clinic scheduling",
    text: `Client: Westside Medical. Outcome: won, then overran hours (quoted 720h, actual 980h).
Problem: three Google Calendars, phone booking, double-books.
What worked: made the portal the system of record at cutover; two-week dual-run with front desk; sample iCal in week 1.
What failed: calendar import was bid as two engineer-days. Treat migration as its own phase.
Proof points we can reuse (with permission): 40% of new appointments moved online in 90 days; callback volume dropped after the dual-run.
Do not claim Epic integration. We did not do FHIR.`,
  },
  {
    id: "kb-sow-calendar",
    createdAt: "2026-04-01T10:00:00.000Z",
    kind: "sow",
    title: "SOW pattern — calendar import + dual-run",
    text: `Standard SOW language we now reuse:
In scope: import of a client-provided CSV/iCal sample in week 1; mapping visit types and buffers; dual-run period of at least ten business days where front desk can override.
Out of scope unless priced: live two-way sync with Google Calendar after cutover; cleaning years of historical noise; building a custom connector to an unnamed EHR.
Assumption: client names an export owner and delivers a repeatable file in week 1. If the file is late, go-live slips by the same number of days.
Change order trigger: a second calendar product, or more than two source systems.`,
  },
];
