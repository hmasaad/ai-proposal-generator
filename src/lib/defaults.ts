import type { BidComparable, CompanyProfile, ProjectType, SourceKind } from "./types";

export const SOURCE_KINDS: { id: SourceKind; label: string }[] = [
  { id: "rfp", label: "RFP / RFQ" },
  { id: "email", label: "Email thread" },
  { id: "transcript", label: "Zoom / Meet transcript" },
  { id: "notes", label: "Meeting notes" },
  { id: "requirements", label: "Requirements" },
  { id: "project", label: "Existing project" },
  { id: "past_proposal", label: "Previous proposal" },
];

export const DEFAULT_COMPANY: CompanyProfile = {
  name: "Northline Studio",
  tagline: "Product engineering for operators who need software that ships.",
  differentiators:
    "We specialize in custom web platforms for regulated and operationally complex businesses. Senior-led delivery, weekly demos, and a written scope that sales, product, and engineering can all stand behind.",
  techStack:
    "TypeScript, Next.js, Node.js, PostgreSQL, Prisma, AWS, Terraform, automated testing, CI/CD",
  currency: "USD",
  hoursPerDay: 6,
  defaultContingencyPct: 15,
  rates: [
    { role: "Engagement lead / PM", hourlyRate: 165 },
    { role: "Product designer", hourlyRate: 125 },
    { role: "Senior engineer", hourlyRate: 155 },
    { role: "Engineer", hourlyRate: 110 },
    { role: "QA / automation", hourlyRate: 95 },
  ],
  legalName: "Northline Studio LLC",
  address: "US-based delivery · notices at hello@northline.example",
};

export const STORAGE_KEYS = {
  company: "proposal-agent:company",
  proposal: "proposal-agent:latest",
  lessons: "proposal-agent:lessons",
  history: "proposal-agent:history",
  versions: "proposal-agent:versions",
  author: "proposal-agent:author",
  knowledge: "proposal-agent:knowledge",
} as const;

export const PROJECT_TYPES: {
  id: ProjectType;
  label: string;
  mix: string;
  extraRoles: { role: string; seniorMultiple: number }[];
}[] = [
  {
    id: "web",
    label: "Web platform",
    mix: "Heavier on product design and full-stack. Integrations stay CSV/API-light unless named.",
    extraRoles: [],
  },
  {
    id: "mobile",
    label: "Mobile",
    mix: "Add native/mobile engineering. Design covers both platforms. Native apps are rarely a side task on a web estimate.",
    extraRoles: [
      { role: "Mobile engineer", seniorMultiple: 0.95 },
      { role: "Mobile QA", seniorMultiple: 0.65 },
    ],
  },
  {
    id: "data",
    label: "Data / analytics",
    mix: "Add data engineering and extra QA on pipelines. Dashboard work is not a one-sprint add-on to an ops app.",
    extraRoles: [
      { role: "Data engineer", seniorMultiple: 1.05 },
      { role: "Analytics engineer", seniorMultiple: 0.9 },
    ],
  },
  {
    id: "integration",
    label: "Integration / EHR / ERP",
    mix: "Price discovery of the foreign system as its own phase. Never treat an unknown calendar/EHR/ERP export as a two-day job.",
    extraRoles: [{ role: "Integration engineer", seniorMultiple: 1.05 }],
  },
];

export const SAMPLE_PAST_BIDS: BidComparable[] = [
  {
    id: "past-clinic-cal",
    projectTitle: "Clinic scheduling rewrite",
    clientName: "Westside Medical",
    projectType: "integration",
    quotedHours: 720,
    quotedCost: 118000,
    actualHours: 980,
    outcome: "won",
    reason: "technical_fit",
    note: "Quoted calendar import as 2 days. Three Google Calendars; dual-run ate a week. Next time: sample file in week 1, migration as its own phase.",
  },
  {
    id: "past-reminders",
    projectTitle: "Patient reminders v1",
    clientName: "Harbor Pediatrics",
    projectType: "web",
    quotedHours: 410,
    quotedCost: 64000,
    outcome: "lost",
    reason: "compliance",
    note: "SMS with visit reason. Compliance killed the SOW after signature on a similar deal. Keep SMS non-PHI.",
  },
  {
    id: "past-ops",
    projectTitle: "Ops console for three sites",
    clientName: "Northline internal",
    projectType: "web",
    quotedHours: 1600,
    quotedCost: 248000,
    actualHours: 1540,
    outcome: "won",
    reason: "scope",
    note: "Bid the full wish list against a known budget and almost lost. Cut payments from v1; booking held.",
  },
];
