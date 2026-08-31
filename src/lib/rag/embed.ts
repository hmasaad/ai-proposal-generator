function apiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
}

export function embeddingsAvailable() {
  return Boolean(apiKey());
}

async function embedOnce(text: string, taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY") {
  const key = apiKey();
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY for embeddings.");
  }

  const model = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text: text.slice(0, 8000) }] },
        taskType,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Embedding failed (${response.status}): ${detail.slice(0, 280)}`);
  }

  const payload = (await response.json()) as {
    embedding?: { values?: number[] };
  };
  const values = payload.embedding?.values;
  if (!values?.length) {
    throw new Error("Embedding response had no vector.");
  }
  return values;
}

export function embedDocument(text: string) {
  return embedOnce(text, "RETRIEVAL_DOCUMENT");
}

export function embedQuery(text: string) {
  return embedOnce(text, "RETRIEVAL_QUERY");
}
