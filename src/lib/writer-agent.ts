import { pinEstimatesToRateCard } from "./accuracy";
import { generateStructured } from "./model";
import { addUsage, emptyUsage } from "./pricing";
import {
  ESTIMATE_SYSTEM,
  OUTLINE_SYSTEM,
  WRITER_SYSTEM,
  estimatePrompt,
  outlinePrompt,
  writerPrompt,
} from "./prompts";
import {
  proposalDraftSchema,
  proposalEstimateJsonSchema,
  proposalEstimateSchema,
  proposalOutlineJsonSchema,
  proposalOutlineSchema,
  proposalProseJsonSchema,
  proposalProseSchema,
} from "./schemas";
import type { RetrievedChunk } from "./rag/types";
import type {
  BidComparable,
  CompanyProfile,
  ModelUsage,
  ProjectType,
  RfpScore,
  SourceDocument,
} from "./types";

type Outline = ReturnType<typeof proposalOutlineSchema.parse>;
type Estimate = ReturnType<typeof proposalEstimateSchema.parse>;
type Prose = ReturnType<typeof proposalProseSchema.parse>;
type Draft = ReturnType<typeof proposalDraftSchema.parse>;

export function assembleWriterDraft(
  outline: Outline,
  estimate: Estimate,
  prose: Prose,
  company: CompanyProfile,
): Draft {
  const estimates = pinEstimatesToRateCard(estimate.estimates, company);
  const contingencyPct = Math.min(
    25,
    Math.max(0, estimate.contingencyPct || company.defaultContingencyPct),
  );
  return proposalDraftSchema.parse({
    clientName: outline.clientName,
    projectTitle: outline.projectTitle,
    executiveSummary: prose.executiveSummary,
    understanding: prose.understanding,
    approach: prose.approach,
    scope: outline.scope,
    deliverables: outline.deliverables,
    phases: outline.phases,
    estimates,
    contingencyPct,
    timelineSummary: prose.timelineSummary,
    assumptions: prose.assumptions,
    risks: prose.risks,
    openQuestions: prose.openQuestions,
    nextSteps: prose.nextSteps,
    leanCuts: estimate.leanCuts,
    paddedAdds: estimate.paddedAdds,
    weekOneNeeds: prose.weekOneNeeds,
  });
}

export async function runProposalWriter(input: {
  sources: SourceDocument[];
  company: CompanyProfile;
  briefJson: string;
  score: RfpScore;
  memory: RetrievedChunk[];
  projectType: ProjectType;
  pastBids: BidComparable[];
  onStep: (id: "scope" | "estimate" | "draft", label: string, detail?: string) => void;
}): Promise<{ draft: Draft; usage: ModelUsage }> {
  const {
    sources,
    company,
    briefJson,
    score,
    memory,
    projectType,
    pastBids,
    onStep,
  } = input;
  let usage = emptyUsage();

  onStep("scope", "Writer outlining scope and phases");
  const outlined = await generateStructured({
    schema: proposalOutlineSchema,
    jsonSchema: proposalOutlineJsonSchema,
    system: OUTLINE_SYSTEM,
    prompt: outlinePrompt(sources, company, briefJson, memory, projectType, score),
  });
  usage = addUsage(usage, outlined.usage);
  const outline = outlined.object;
  const included = outline.scope.filter((item) => item.included).length;
  const excluded = outline.scope.length - included;
  onStep(
    "scope",
    "Writer outlining scope and phases",
    `${outline.projectTitle} · ${included} in / ${excluded} out · ${outline.phases.length} phases`,
  );

  onStep("estimate", "Writer pricing the likely band");
  const priced = await generateStructured({
    schema: proposalEstimateSchema,
    jsonSchema: proposalEstimateJsonSchema,
    system: ESTIMATE_SYSTEM,
    prompt: estimatePrompt(
      company,
      JSON.stringify(outline, null, 2),
      projectType,
      pastBids,
      score,
    ),
  });
  usage = addUsage(usage, priced.usage);
  const estimates = pinEstimatesToRateCard(priced.object.estimates, company);
  const hours = estimates.reduce((sum, row) => sum + row.hours, 0);
  onStep(
    "estimate",
    "Writer pricing the likely band",
    `${hours.toLocaleString()}h likely · ${estimates.length} roles`,
  );

  onStep("draft", "Writer drafting the client document");
  const written = await generateStructured({
    schema: proposalProseSchema,
    jsonSchema: proposalProseJsonSchema,
    system: WRITER_SYSTEM,
    prompt: writerPrompt(
      sources,
      company,
      briefJson,
      memory,
      JSON.stringify(outline, null, 2),
      JSON.stringify({ ...priced.object, estimates }, null, 2),
      score,
    ),
  });
  usage = addUsage(usage, written.usage);

  const draft = assembleWriterDraft(outline, { ...priced.object, estimates }, written.object, company);
  onStep("draft", "Writer drafting the client document", outline.projectTitle);
  return { draft, usage };
}
