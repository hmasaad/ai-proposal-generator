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

const scopeItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  included: z.boolean(),
});

const phaseItemSchema = z.object({
  name: z.string(),
  durationWeeks: z.number(),
  objectives: z.array(z.string()),
  deliverables: z.array(z.string()),
});

const estimateLineSchema = z.object({
  role: z.string(),
  hours: z.number(),
  rate: z.number(),
  cost: z.number(),
});

export const proposalOutlineSchema = z.object({
  clientName: z.string(),
  projectTitle: z.string(),
  scope: z.array(scopeItemSchema),
  phases: z.array(phaseItemSchema),
  deliverables: z.array(z.string()),
  staffing: z.array(z.string()),
});

export const proposalEstimateSchema = z.object({
  estimates: z.array(estimateLineSchema),
  contingencyPct: z.number(),
  leanCuts: z.array(z.string()),
  paddedAdds: z.array(z.string()),
});

export const proposalProseSchema = z.object({
  executiveSummary: z.string(),
  understanding: z.string(),
  approach: z.string(),
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
  weekOneNeeds: z.array(z.string()),
});

const scopeJson = {
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
};

const phasesJson = {
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
};

export const proposalOutlineJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    clientName: { type: "string" },
    projectTitle: { type: "string" },
    scope: scopeJson,
    phases: phasesJson,
    deliverables: { type: "array", items: { type: "string" } },
    staffing: { type: "array", items: { type: "string" } },
  },
  required: [
    "clientName",
    "projectTitle",
    "scope",
    "phases",
    "deliverables",
    "staffing",
  ],
};

export const proposalEstimateJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
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
    leanCuts: { type: "array", items: { type: "string" } },
    paddedAdds: { type: "array", items: { type: "string" } },
  },
  required: ["estimates", "contingencyPct", "leanCuts", "paddedAdds"],
};

export const proposalProseJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    executiveSummary: { type: "string" },
    understanding: { type: "string" },
    approach: { type: "string" },
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
    weekOneNeeds: { type: "array", items: { type: "string" } },
  },
  required: [
    "executiveSummary",
    "understanding",
    "approach",
    "timelineSummary",
    "assumptions",
    "risks",
    "openQuestions",
    "nextSteps",
    "weekOneNeeds",
  ],
};

export const rfpScoreSchema = z.object({
  competitorsNamed: z.array(z.string()),
  criteria: z.array(
    z.object({
      criterion: z.string(),
      importance: z.enum(["must", "should", "nice"]),
      ourPosition: z.enum(["strong", "adequate", "weak", "out"]),
      why: z.string(),
      bidMove: z.string(),
    }),
  ),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  winThemes: z.array(z.string()),
  watchouts: z.array(z.string()),
});

export const rfpScoreJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    competitorsNamed: { type: "array", items: { type: "string" } },
    criteria: {
      type: "array",
      items: {
        type: "object",
        properties: {
          criterion: { type: "string" },
          importance: { type: "string", enum: ["must", "should", "nice"] },
          ourPosition: { type: "string", enum: ["strong", "adequate", "weak", "out"] },
          why: { type: "string" },
          bidMove: { type: "string" },
        },
        required: ["criterion", "importance", "ourPosition", "why", "bidMove"],
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    winThemes: { type: "array", items: { type: "string" } },
    watchouts: { type: "array", items: { type: "string" } },
  },
  required: [
    "competitorsNamed",
    "criteria",
    "strengths",
    "weaknesses",
    "winThemes",
    "watchouts",
  ],
};

export const kickoffAndRaidSchema = z.object({
  kickoff: z.object({
    goal: z.string(),
    sessions: z.array(
      z.object({
        title: z.string(),
        day: z.string(),
        durationMins: z.number(),
        attendees: z.array(z.string()),
        agenda: z.array(z.string()),
        outputs: z.array(z.string()),
      }),
    ),
    accessNeeded: z.array(z.string()),
    decisionsNeeded: z.array(z.string()),
    communications: z.array(z.string()),
  }),
  raid: z.array(
    z.object({
      kind: z.enum(["risk", "assumption", "issue", "dependency"]),
      title: z.string(),
      owner: z.string(),
      due: z.string(),
      status: z.enum(["open", "watch", "closed"]),
      notes: z.string(),
    }),
  ),
});

export const deliveryEpicsSchema = z.object({
  epics: z.array(
    z.object({
      title: z.string(),
      phase: z.string(),
      summary: z.string(),
      stories: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          acceptance: z.array(z.string()),
          estimatePoints: z.number(),
          labels: z.array(z.string()),
        }),
      ),
    }),
  ),
});

export const changeOrderDraftSchema = z.object({
  title: z.string(),
  inBaseline: z.boolean(),
  rationale: z.string(),
  addedScope: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      included: z.boolean(),
    }),
  ),
  estimates: z.array(
    z.object({
      role: z.string(),
      hours: z.number(),
    }),
  ),
  extraWeeks: z.number(),
  assumptions: z.array(z.string()),
  clientLetter: z.string(),
});

export const kickoffAndRaidJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    kickoff: {
      type: "object",
      properties: {
        goal: { type: "string" },
        sessions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              day: { type: "string" },
              durationMins: { type: "number" },
              attendees: { type: "array", items: { type: "string" } },
              agenda: { type: "array", items: { type: "string" } },
              outputs: { type: "array", items: { type: "string" } },
            },
            required: [
              "title",
              "day",
              "durationMins",
              "attendees",
              "agenda",
              "outputs",
            ],
          },
        },
        accessNeeded: { type: "array", items: { type: "string" } },
        decisionsNeeded: { type: "array", items: { type: "string" } },
        communications: { type: "array", items: { type: "string" } },
      },
      required: [
        "goal",
        "sessions",
        "accessNeeded",
        "decisionsNeeded",
        "communications",
      ],
    },
    raid: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["risk", "assumption", "issue", "dependency"],
          },
          title: { type: "string" },
          owner: { type: "string" },
          due: { type: "string" },
          status: { type: "string", enum: ["open", "watch", "closed"] },
          notes: { type: "string" },
        },
        required: ["kind", "title", "owner", "due", "status", "notes"],
      },
    },
  },
  required: ["kickoff", "raid"],
};

export const deliveryEpicsJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    epics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          phase: { type: "string" },
          summary: { type: "string" },
          stories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                acceptance: { type: "array", items: { type: "string" } },
                estimatePoints: { type: "number" },
                labels: { type: "array", items: { type: "string" } },
              },
              required: [
                "title",
                "description",
                "acceptance",
                "estimatePoints",
                "labels",
              ],
            },
          },
        },
        required: ["title", "phase", "summary", "stories"],
      },
    },
  },
  required: ["epics"],
};

export const changeOrderDraftJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    title: { type: "string" },
    inBaseline: { type: "boolean" },
    rationale: { type: "string" },
    addedScope: {
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
    estimates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string" },
          hours: { type: "number" },
        },
        required: ["role", "hours"],
      },
    },
    extraWeeks: { type: "number" },
    assumptions: { type: "array", items: { type: "string" } },
    clientLetter: { type: "string" },
  },
  required: [
    "title",
    "inBaseline",
    "rationale",
    "addedScope",
    "estimates",
    "extraWeeks",
    "assumptions",
    "clientLetter",
  ],
};
