import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { RagChunk } from "./types";

const STORE_PATH = path.join(process.cwd(), "data", "rag", "index.json");

type StoreFile = { chunks: RagChunk[] };

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as StoreFile;
  } catch {
    return { chunks: [] };
  }
}

async function writeStore(store: StoreFile) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function loadChunks() {
  return (await readStore()).chunks;
}

export async function upsertChunks(next: RagChunk[]) {
  const store = await readStore();
  const ids = new Set(next.map((chunk) => chunk.id));
  store.chunks = [...store.chunks.filter((chunk) => !ids.has(chunk.id)), ...next];
  await writeStore(store);
  return store.chunks.length;
}

export async function removeSource(sourceId: string) {
  const store = await readStore();
  store.chunks = store.chunks.filter((chunk) => chunk.sourceId !== sourceId);
  await writeStore(store);
}
