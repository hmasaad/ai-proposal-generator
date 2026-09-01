import { guessKind } from "./format";
import { looksLikeEmailThread, parseEmailThread } from "./import-mail";
import { looksLikeTranscript, parseTranscript } from "./import-transcript";
import type { SourceKind } from "./types";

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function ingestFileError(name: string) {
  if (ext(name) === "msg") {
    return "Outlook .msg files are not supported. Save as .eml or paste the thread.";
  }
  return null;
}

export function ingestSourceText(name: string, raw: string): { kind: SourceKind; text: string } {
  const extension = ext(name);
  if (extension === "eml" || looksLikeEmailThread(raw)) {
    return { kind: "email", text: parseEmailThread(raw) };
  }
  if (["vtt", "srt"].includes(extension) || looksLikeTranscript(raw)) {
    return { kind: "transcript", text: parseTranscript(raw) };
  }
  return { kind: guessKind(name), text: raw };
}
