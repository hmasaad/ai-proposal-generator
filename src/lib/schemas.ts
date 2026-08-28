import { z } from "zod";

export const requirementBriefSchema = z.object({
  clientName: z.string(),
  projectTitle: z.string(),
  problem: z.string(),
  goals: z.array(z.string()),
  mustHave: z.array(z.string()),
  niceToHave: z.array(z.string()),
  constraints: z.array(z.string()),
  stakeholders: z.array(z.string()),
  successCriteria: z.array(z.string()),
  unknownOrMissing: z.array(z.string()),
});

export const proposalDraftSchema = z.object({
  clientName: z.string(),
  projectTitle: z.string(),
  executiveSummary: z.string(),
  understanding: z.string(),
  approach: z.string(),
  scope: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      included: z.boolean(),
    }),
  ),
  deliverables: z.array(z.string()),
  phases: z.array(
    z.object({
      name: z.string(),
      durationWeeks: z.number(),
      objectives: z.array(z.string()),
      deliverables: z.array(z.string()),
    }),
  ),
  estimates: z.array(
    z.object({
      role: z.string(),
      hours: z.number(),
      rate: z.number(),
      cost: z.number(),
    }),
  ),
  contingencyPct: z.number(),
  timelineSummary: z.string(),
  assumptions: z.array(z.string()),
  risks: z.array(
    z.object({
      risk: z.string(),
      impact: z.enum(["low", "medium", "high"]),
      likelihood: z.enum(["low", "medium", "high"]),
      mitigation: z.string(),
    }),
  ),
  openQuestions: z.array(z.string()),
  nextSteps: z.array(z.string()),
});
