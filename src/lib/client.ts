import type { AgentStepEvent, AgentStepId } from "./types";

export const AGENT_STEPS: { id: AgentStepId; label: string }[] = [
  { id: "ingest", label: "Ingest" },
  { id: "extract", label: "Extract" },
  { id: "score", label: "Score" },
  { id: "learn", label: "RAG" },
  { id: "scope", label: "Scope" },
  { id: "estimate", label: "Estimate" },
  { id: "draft", label: "Draft" },
  { id: "review", label: "Review" },
];

export function stepIndex(id: AgentStepId) {
  return AGENT_STEPS.findIndex((step) => step.id === id);
}

export async function readSse(
  response: Response,
  onEvent: (event: string, data: unknown) => void,
) {
  if (!response.body) {
    throw new Error("No response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const event = chunk.match(/^event: (.+)$/m)?.[1];
      const dataLine = chunk.match(/^data: (.+)$/m)?.[1];
      if (!event || !dataLine) continue;
      onEvent(event, JSON.parse(dataLine));
    }
  }
}

export function describeStep(step: AgentStepEvent) {
  return step.detail ? `${step.label} — ${step.detail}` : step.label;
}
