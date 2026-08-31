import type { SentenceCardData, SourceEssayData } from "./content-types";

export interface EssaySummary {
  id: string;
  title: string;
  ieltsPrompt: string | null;
  topics: string[];
  publicationRef: string | null;
  sourceLabel: string;
  sentenceCount: number;
  essayNumber: number | null;
  contentRole: "ielts_model_essay" | "language_richness_corpus";
}

export function collectionEssayNumber(publicationRef: string | null) {
  const match = publicationRef?.match(/^Essay (\d+),/);
  return match ? Number(match[1]) : null;
}

export function compactEssaySourceLine(essay: EssaySummary, fallbackIndex: number) {
  if (essay.contentRole === "language_richness_corpus") {
    const lesson = essay.publicationRef?.match(/\bLesson\s+(\d+)\b/i)?.[1];
    return lesson ? `${essay.sourceLabel} · 第 ${lesson} 课` : essay.sourceLabel;
  }

  return `${essay.essayNumber ? `合集第 ${String(essay.essayNumber).padStart(2, "0")} 篇` : (essay.publicationRef ?? `原文 ${String(fallbackIndex + 1).padStart(2, "0")}`)} · ${essay.sourceLabel}`;
}

export function buildEssaySummaries(
  sources: SourceEssayData[],
  cards: SentenceCardData[],
  sourceLabel: (answerOrigin: string, author: string, sourceName?: string) => string,
) {
  const sentenceCounts = new Map<string, number>();
  for (const card of cards) {
    sentenceCounts.set(card.source_essay_id, (sentenceCounts.get(card.source_essay_id) ?? 0) + 1);
  }

  return sources
    .map((source): EssaySummary => ({
      id: source.id,
      title: source.title,
      ieltsPrompt: source.ielts_prompt,
      topics: source.topics,
      publicationRef: source.publication_ref,
      sourceLabel: sourceLabel(source.answer_origin, source.author, source.source_name),
      sentenceCount: sentenceCounts.get(source.id) ?? 0,
      essayNumber: collectionEssayNumber(source.publication_ref),
      contentRole: source.content_role ?? "ielts_model_essay",
    }))
    .sort((left, right) => (
      (left.essayNumber ?? Number.MAX_SAFE_INTEGER) - (right.essayNumber ?? Number.MAX_SAFE_INTEGER)
      || left.title.localeCompare(right.title)
    ));
}
