export type ProjectType = "web" | "mobile" | "data" | "integration";

export type BidOutcome = "draft" | "sent" | "won" | "lost" | "no_bid";

export interface EstimateBands {
  leanHours: number;
  leanCost: number;
  likelyHours: number;
  likelyCost: number;
  paddedHours: number;
  paddedCost: number;
}

export interface BidComparable {
  id: string;
  projectTitle: string;
  clientName: string;
  projectType: ProjectType;
  quotedHours: number;
  quotedCost: number;
  actualHours?: number;
  outcome: BidOutcome;
  note: string;
}

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

export type LessonCategory =
  | "scope"
  | "estimate"
  | "timeline"
  | "risk"
  | "assumption"
  | "wording"
  | "other";

export interface Lesson {
  id: string;
  createdAt: string;
  proposalId?: string;
  projectTitle?: string;
  category: LessonCategory;
  mistake: string;
  correction: string;
}

export interface ProposalMemory {
  id: string;
  createdAt: string;
  clientName: string;
  projectTitle: string;
  problem: string;
  totalCost: number;
  totalHours: number;
  mustHave: string[];
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
  projectType?: ProjectType;
  estimateBands?: EstimateBands;
  leanCuts?: string[];
  paddedAdds?: string[];
  weekOneNeeds?: string[];
  comparables?: BidComparable[];
  outcome?: BidOutcome;
  outcomeNote?: string;
  actualHours?: number;
  actualCost?: number;
  appliedLessonIds?: string[];
  retrievedMemory?: {
    id: string;
    title: string;
    sourceType: "lesson" | "proposal";
    text: string;
    score: number;
  }[];
}

export type AgentStepId =
  | "ingest"
  | "extract"
  | "learn"
  | "scope"
  | "estimate"
  | "draft"
  | "review";

export interface AgentStepEvent {
  id: AgentStepId;
  label: string;
  detail?: string;
}
