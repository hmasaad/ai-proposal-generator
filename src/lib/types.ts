export type ProjectType = "web" | "mobile" | "data" | "integration";

export type BidOutcome = "draft" | "sent" | "won" | "lost" | "no_bid";

export type ReviewStatus = "draft" | "internal_review" | "client_ready";

export type OutputLanguage = "en" | "ur" | "bilingual" | "ar" | "es";

export type ProposalSectionId =
  | "summary"
  | "understanding"
  | "approach"
  | "scope"
  | "deliverables"
  | "timeline"
  | "investment"
  | "assumptions"
  | "risks"
  | "questions"
  | "weekOne"
  | "next";

export interface SectionComment {
  id: string;
  sectionId: ProposalSectionId;
  author: string;
  body: string;
  createdAt: string;
  resolved: boolean;
}

export interface ProposalVersion {
  id: string;
  createdAt: string;
  label: string;
  language: OutputLanguage;
  status: ReviewStatus;
  snapshot: Proposal;
}

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
  | "past_proposal"
  | "transcript";

export type KnowledgeKind = "sow" | "case_study" | "stack" | "playbook";

export interface KnowledgeDoc {
  id: string;
  createdAt: string;
  kind: KnowledgeKind;
  title: string;
  text: string;
}

export type FitLevel = "strong" | "adequate" | "weak" | "out";

export interface RfpCriterion {
  criterion: string;
  importance: "must" | "should" | "nice";
  ourPosition: FitLevel;
  why: string;
  bidMove: string;
}

export interface RfpScore {
  competitorsNamed: string[];
  criteria: RfpCriterion[];
  strengths: string[];
  weaknesses: string[];
  winThemes: string[];
  watchouts: string[];
}

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
  legalName?: string;
  address?: string;
  logoDataUrl?: string;
  paymentTerms?: string;
  msaTemplate?: string;
  ratesLocked?: boolean;
  ratesLockedAt?: string;
  ratesLockedBy?: string;
}

export type ClientPackKind = "full" | "sow" | "commercial" | "board" | "msa";

export type RaidKind = "risk" | "assumption" | "issue" | "dependency";

export type RaidStatus = "open" | "watch" | "closed";

export interface RaidItem {
  id: string;
  kind: RaidKind;
  title: string;
  owner: string;
  due: string;
  status: RaidStatus;
  notes: string;
}

export interface KickoffSession {
  title: string;
  day: string;
  durationMins: number;
  attendees: string[];
  agenda: string[];
  outputs: string[];
}

export interface KickoffPlan {
  generatedAt: string;
  goal: string;
  sessions: KickoffSession[];
  accessNeeded: string[];
  decisionsNeeded: string[];
  communications: string[];
}

export interface DeliveryStory {
  key: string;
  title: string;
  description: string;
  acceptance: string[];
  estimatePoints: number;
  labels: string[];
}

export interface DeliveryEpic {
  key: string;
  title: string;
  phase: string;
  summary: string;
  stories: DeliveryStory[];
}

export type ChangeOrderStatus = "draft" | "sent" | "approved" | "rejected";

export interface ChangeOrder {
  id: string;
  createdAt: string;
  request: string;
  title: string;
  inBaseline: boolean;
  rationale: string;
  addedScope: ScopeItem[];
  estimates: EstimateLine[];
  totalHours: number;
  totalCost: number;
  extraWeeks: number;
  assumptions: string[];
  clientLetter: string;
  status: ChangeOrderStatus;
  appliedAt?: string;
}

export interface DeliveryPack {
  generatedAt?: string;
  kickoff?: KickoffPlan;
  raid?: RaidItem[];
  epics?: DeliveryEpic[];
  changeOrders?: ChangeOrder[];
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
  reviewStatus?: ReviewStatus;
  language?: OutputLanguage;
  comments?: SectionComment[];
  updatedAt?: string;
  rfpScore?: RfpScore;
  delivery?: DeliveryPack;
  retrievedMemory?: {
    id: string;
    title: string;
    sourceType: "lesson" | "proposal" | "knowledge";
    text: string;
    score: number;
  }[];
}

export type AgentStepId =
  | "ingest"
  | "extract"
  | "score"
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

export type StudioRole = "sales" | "finance" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: StudioRole;
}

export type AuditAction =
  | "login"
  | "generate"
  | "revise"
  | "translate"
  | "send"
  | "delivery"
  | "index_knowledge"
  | "index_lesson"
  | "lock_rates"
  | "unlock_rates"
  | "save_profile"
  | "invite_user";

export interface AuditEvent {
  id: string;
  at: string;
  userId: string;
  userName: string;
  email: string;
  role: StudioRole;
  action: AuditAction;
  detail: string;
  proposalId?: string;
  projectTitle?: string;
}

export interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  thoughtTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface UsageEvent extends ModelUsage {
  id: string;
  at: string;
  userId: string;
  userName: string;
  action: string;
  proposalId?: string;
  projectTitle?: string;
}
