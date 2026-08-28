import type { CompanyProfile, SourceKind } from "./types";

export const SOURCE_KINDS: { id: SourceKind; label: string }[] = [
  { id: "rfp", label: "RFP / RFQ" },
  { id: "email", label: "Client email" },
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
};

export const STORAGE_KEYS = {
  company: "proposal-agent:company",
  proposal: "proposal-agent:latest",
} as const;
