import { proposalToMarkdown } from "@/lib/proposal-markdown";
import type { KnowledgeDoc, Lesson, Proposal } from "@/lib/types";
import { chunkText, type RagChunk } from "./types";

export function lessonToChunks(lesson: Lesson): Omit<RagChunk, "embedding">[] {
  const text = `Past proposal mistake [${lesson.category}] ${lesson.projectTitle ?? "studio"}
What went wrong: ${lesson.mistake}
What to do next time: ${lesson.correction}`;

  return chunkText(text, 1200).map((part, index) => ({
    id: `${lesson.id}:${index}`,
    sourceId: lesson.id,
    sourceType: "lesson" as const,
    title: lesson.projectTitle || "Studio lesson",
    text: part,
  }));
}

export function proposalToChunks(proposal: Proposal): Omit<RagChunk, "embedding">[] {
  const markdown = proposalToMarkdown(proposal);
  const outcome = proposal.outcome ?? "draft";
  const type = proposal.projectType ?? "web";
  const bands = proposal.estimateBands
    ? `Bands: lean ${proposal.estimateBands.leanHours}h / likely ${proposal.estimateBands.likelyHours}h / padded ${proposal.estimateBands.paddedHours}h.`
    : "";
  const actual = proposal.actualHours
    ? `Actual hours: ${proposal.actualHours}.`
    : "";
  const note = proposal.outcomeNote ? `Outcome note: ${proposal.outcomeNote}` : "";
  const reason = proposal.outcomeReason ? `Reason: ${proposal.outcomeReason}.` : "";
  const header = `${proposal.projectTitle} for ${proposal.clientName}. Type: ${type}. Outcome: ${outcome}. ${reason} Quoted ${proposal.totalHours}h / ${proposal.totalCost}. ${bands} ${actual} ${note}`;
  return chunkText(`${header}\n${markdown}`, 900).map((part, index) => ({
    id: `${proposal.id}:${index}`,
    sourceId: proposal.id,
    sourceType: "proposal" as const,
    title: proposal.projectTitle,
    text: part,
  }));
}

export function knowledgeToChunks(doc: KnowledgeDoc): Omit<RagChunk, "embedding">[] {
  const text = `Company knowledge [${doc.kind}] ${doc.title}\n${doc.text}`;
  return chunkText(text, 1200).map((part, index) => ({
    id: `${doc.id}:${index}`,
    sourceId: doc.id,
    sourceType: "knowledge" as const,
    title: doc.title,
    text: part,
  }));
}
