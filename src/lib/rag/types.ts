export type RagSourceType = "lesson" | "proposal" | "knowledge";

export interface RagChunk {
  id: string;
  sourceId: string;
  sourceType: RagSourceType;
  title: string;
  text: string;
  embedding: number[];
}

export interface RetrievedChunk {
  id: string;
  sourceId: string;
  sourceType: RagSourceType;
  title: string;
  text: string;
  score: number;
}

export function chunkText(text: string, size = 900, overlap = 120): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  const parts: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(clean.length, start + size);
    parts.push(clean.slice(start, end).trim());
    if (end === clean.length) break;
    start = end - overlap;
  }
  return parts.filter(Boolean);
}

export function cosine(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
