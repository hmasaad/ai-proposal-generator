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
  leanCuts: z.array(z.string()).optional().default([]),
  paddedAdds: z.array(z.string()).optional().default([]),
  weekOneNeeds: z.array(z.string()).optional().default([]),
});

export const requirementBriefJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    clientName: { type: "string" },
    projectTitle: { type: "string" },
    problem: { type: "string" },
    goals: { type: "array", items: { type: "string" } },
    mustHave: { type: "array", items: { type: "string" } },
    niceToHave: { type: "array", items: { type: "string" } },
    constraints: { type: "array", items: { type: "string" } },
    stakeholders: { type: "array", items: { type: "string" } },
    successCriteria: { type: "array", items: { type: "string" } },
    unknownOrMissing: { type: "array", items: { type: "string" } },
  },
  required: [
    "clientName",
    "projectTitle",
    "problem",
    "goals",
    "mustHave",
    "niceToHave",
    "constraints",
    "stakeholders",
    "successCriteria",
    "unknownOrMissing",
  ],
};

export const proposalDraftJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    clientName: { type: "string" },
    projectTitle: { type: "string" },
    executiveSummary: { type: "string" },
    understanding: { type: "string" },
    approach: { type: "string" },
    scope: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          included: { type: "boolean" },
        },
        required: ["title", "description", "included"],
      },
    },
    deliverables: { type: "array", items: { type: "string" } },
    phases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          durationWeeks: { type: "number" },
          objectives: { type: "array", items: { type: "string" } },
          deliverables: { type: "array", items: { type: "string" } },
        },
        required: ["name", "durationWeeks", "objectives", "deliverables"],
      },
    },
    estimates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string" },
          hours: { type: "number" },
          rate: { type: "number" },
          cost: { type: "number" },
        },
        required: ["role", "hours", "rate", "cost"],
      },
    },
    contingencyPct: { type: "number" },
    timelineSummary: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } },
    risks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          risk: { type: "string" },
          impact: { type: "string", enum: ["low", "medium", "high"] },
          likelihood: { type: "string", enum: ["low", "medium", "high"] },
          mitigation: { type: "string" },
        },
        required: ["risk", "impact", "likelihood", "mitigation"],
      },
    },
    openQuestions: { type: "array", items: { type: "string" } },
    nextSteps: { type: "array", items: { type: "string" } },
    leanCuts: { type: "array", items: { type: "string" } },
    paddedAdds: { type: "array", items: { type: "string" } },
    weekOneNeeds: { type: "array", items: { type: "string" } },
  },
  required: [
    "clientName",
    "projectTitle",
    "executiveSummary",
    "understanding",
    "approach",
    "scope",
    "deliverables",
    "phases",
    "estimates",
    "contingencyPct",
    "timelineSummary",
    "assumptions",
    "risks",
    "openQuestions",
    "nextSteps",
  ],
};
