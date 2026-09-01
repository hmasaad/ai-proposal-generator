import type { ModelUsage } from "./types";

/** Gemini 3.6 Flash intro pricing through Dec 31, 2026 (USD per 1M tokens). */
export const FLASH_INPUT_PER_M = Number(process.env.GEMINI_INPUT_PER_MILLION || "0.75");
export const FLASH_OUTPUT_PER_M = Number(process.env.GEMINI_OUTPUT_PER_MILLION || "3.75");
export const EMBED_PER_M = Number(process.env.GEMINI_EMBED_PER_MILLION || "0.15");

export function emptyUsage(model = "gemini-3.6-flash"): ModelUsage {
  return {
    model,
    inputTokens: 0,
    outputTokens: 0,
    thoughtTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  };
}

export function costUsd(inputTokens: number, outputTokens: number, embedTokens = 0) {
  return (
    (inputTokens / 1_000_000) * FLASH_INPUT_PER_M +
    (outputTokens / 1_000_000) * FLASH_OUTPUT_PER_M +
    (embedTokens / 1_000_000) * EMBED_PER_M
  );
}

export function addUsage(a: ModelUsage, b: ModelUsage): ModelUsage {
  const inputTokens = a.inputTokens + b.inputTokens;
  const outputTokens = a.outputTokens + b.outputTokens;
  const thoughtTokens = a.thoughtTokens + b.thoughtTokens;
  const totalTokens = a.totalTokens + b.totalTokens;
  return {
    model: b.model || a.model,
    inputTokens,
    outputTokens,
    thoughtTokens,
    totalTokens,
    costUsd: a.costUsd + b.costUsd,
  };
}

export function usageFromCounts(input: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  thoughtTokens?: number;
}): ModelUsage {
  const thoughtTokens = input.thoughtTokens ?? 0;
  const billedOutput = input.outputTokens + thoughtTokens;
  const totalTokens = input.inputTokens + billedOutput;
  return {
    model: input.model,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    thoughtTokens,
    totalTokens,
    costUsd: costUsd(input.inputTokens, billedOutput),
  };
}

export function formatUsd(amount: number) {
  if (amount <= 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}

export function embedTokensFromText(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}
