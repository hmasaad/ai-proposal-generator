import { GoogleGenAI } from "@google/genai";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { z } from "zod";
import { emptyUsage, usageFromCounts } from "./pricing";
import type { ModelUsage } from "./types";

const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

function geminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
}

function stripFences(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function outputText(interaction: { output_text?: unknown }) {
  if (typeof interaction.output_text === "string" && interaction.output_text.trim()) {
    return interaction.output_text;
  }
  throw new Error("Gemini Interactions API returned no output_text.");
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function usageFromInteraction(interaction: unknown, model: string): ModelUsage {
  const raw = (interaction ?? {}) as { usage?: Record<string, unknown> };
  const usage = raw.usage ?? {};
  return usageFromCounts({
    model,
    inputTokens: num(usage.total_input_tokens ?? usage.promptTokenCount),
    outputTokens: num(usage.total_output_tokens ?? usage.candidatesTokenCount),
    thoughtTokens: num(usage.total_thought_tokens ?? usage.thoughtsTokenCount),
  });
}

export async function generateStructured<T extends z.ZodTypeAny>(input: {
  schema: T;
  jsonSchema: Record<string, unknown>;
  system: string;
  prompt: string;
}): Promise<{ object: z.infer<T>; usage: ModelUsage }> {
  const key = geminiKey();
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  if (key) {
    const ai = new GoogleGenAI({ apiKey: key });
    const interaction = await ai.interactions.create({
      model: geminiModel,
      system_instruction: input.system,
      input: input.prompt,
      response_format: [
        {
          type: "text",
          mime_type: "application/json",
          schema: input.jsonSchema,
        },
      ],
    });
    const parsed = JSON.parse(stripFences(outputText(interaction)));
    return {
      object: input.schema.parse(parsed),
      usage: usageFromInteraction(interaction, geminiModel),
    };
  }

  if (openaiKey && !openaiKey.includes("your-key")) {
    const openai = createOpenAI({ apiKey: openaiKey });
    const modelName = process.env.OPENAI_MODEL || "gpt-4o";
    const result = await generateObject({
      model: openai(modelName),
      schema: input.schema,
      system: input.system,
      prompt: input.prompt,
    });
    const promptTokens = num(result.usage?.promptTokens);
    const completionTokens = num(result.usage?.completionTokens);
    return {
      object: result.object,
      usage: usageFromCounts({
        model: modelName,
        inputTokens: promptTokens,
        outputTokens: completionTokens,
      }),
    };
  }

  throw new Error(
    "Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey and add it to .env.local.",
  );
}

export { emptyUsage };
