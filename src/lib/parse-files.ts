import mammoth from "mammoth";
import { extractText } from "unpdf";

const TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/html",
  "text/vtt",
  "application/x-subrip",
  "message/rfc822",
]);

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export async function extractFileText(file: File): Promise<string> {
  const name = file.name;
  const type = file.type;
  const extension = ext(name);

  if (extension === "msg") {
    throw new Error("Outlook .msg files are not supported. Save as .eml or paste the thread.");
  }

  if (
    TEXT_TYPES.has(type) ||
    ["txt", "md", "csv", "json", "html", "eml", "vtt", "srt"].includes(extension)
  ) {
    return file.text();
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (type.includes("word") || ["docx", "doc"].includes(extension)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (type.includes("pdf") || extension === "pdf") {
    const { text } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    const joined = Array.isArray(text) ? text.join("\n\n") : text;
    return joined.trim();
  }

  throw new Error(
    `Unsupported file type for ${name}. Use PDF, Word, Markdown, .eml, .vtt/.srt, or plain text.`,
  );
}
