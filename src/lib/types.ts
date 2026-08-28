export type SourceKind =
  | "email"
  | "rfp"
  | "notes"
  | "requirements"
  | "project"
  | "past_proposal";

export interface SourceDocument {
  id: string;
  name: string;
  kind: SourceKind;
  text: string;
}

export interface RateCard {
  role: string;
  hourlyRate: number;
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  differentiators: string;
  techStack: string;
  rates: RateCard[];
  currency: string;
  hoursPerDay: number;
  defaultContingencyPct: number;
}

export interface RequirementBrief {
  clientName: string;
  projectTitle: string;
  problem: string;
  goals: string[];
  mustHave: string[];
  niceToHave: string[];
  constraints: string[];
  stakeholders: string[];
  successCriteria: string[];
  unknownOrMissing: string[];
}

export interface ScopeItem {
  title: string;
  description: string;
  included: boolean;
}

export interface Phase {
  name: string;
  durationWeeks: number;
  objectives: string[];
  deliverables: string[];
}

export interface EstimateLine {
  role: string;
  hours: number;
  rate: number;
  cost: number;
}

export interface Risk {
  risk: string;
  impact: "low" | "medium" | "high";
  likelihood: "low" | "medium" | "high";
  mitigation: string;
}

export interface Proposal {
  id: string;
  createdAt: string;
  clientName: string;
  projectTitle: string;
  executiveSummary: string;
  understanding: string;
  approach: string;
  scope: ScopeItem[];
  deliverables: string[];
  phases: Phase[];
  estimates: EstimateLine[];
  totalHours: number;
  totalCost: number;
  contingencyPct: number;
  timelineSummary: string;
  assumptions: string[];
  risks: Risk[];
  openQuestions: string[];
  nextSteps: string[];
  brief: RequirementBrief;
}

export type AgentStepId =
  | "ingest"
  | "extract"
  | "scope"
  | "estimate"
  | "draft"
  | "review";

export interface AgentStepEvent {
  id: AgentStepId;
  label: string;
  detail?: string;
}
