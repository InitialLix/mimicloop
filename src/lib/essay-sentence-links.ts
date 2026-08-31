import type { SentenceCardData } from "./content-types";

export interface CollocationHighlightTarget {
  collocationId: string;
  label: string;
  translation: string;
  learningMode: "recall_use" | "appreciation";
  surfaceForm: string;
  occurrenceIndex: number;
}

export interface CollocationTextRange {
  start: number;
  end: number;
  collocationId: string;
  label: string;
  translation: string;
  learningMode: "recall_use" | "appreciation";
}

export const essaySentenceTypeLabels: Record<SentenceCardData["primary_focus"], string> = {
  structure: "STRUCTURE SENTENCE",
  vocabulary: "VOCABULARY SENTENCE",
  mixed: "MIXED SENTENCE",
};

export function splitParagraphSentences(paragraph: string) {
  return (paragraph.match(/[^.!?]+(?:[.!?]+(?:[”’"']+)?|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function sentenceLocationKey(paragraphIndex: number, sentenceIndex: number) {
  return `${paragraphIndex}:${sentenceIndex}`;
}

export function essaySentenceAnchor(paragraphIndex: number, sentenceIndex: number) {
  return `sentence-${paragraphIndex}-${sentenceIndex}`;
}

export function essaySentenceHref(sourceEssayId: string, paragraphIndex: number, sentenceIndex: number) {
  return `/library/essays/${sourceEssayId}#${essaySentenceAnchor(paragraphIndex, sentenceIndex)}`;
}

function occurrenceAt(text: string, needle: string, occurrenceIndex: number) {
  const normalizedText = text.toLocaleLowerCase("en");
  const normalizedNeedle = needle.toLocaleLowerCase("en");
  let cursor = 0;

  for (let index = 0; index <= occurrenceIndex; index += 1) {
    const found = normalizedText.indexOf(normalizedNeedle, cursor);
    if (found < 0) return -1;
    if (index === occurrenceIndex) return found;
    cursor = found + normalizedNeedle.length;
  }

  return -1;
}

export function buildCollocationHighlightRanges(
  sentence: string,
  targets: CollocationHighlightTarget[],
): CollocationTextRange[] {
  const ranges = targets
    .map((target) => {
      const start = occurrenceAt(sentence, target.surfaceForm, target.occurrenceIndex);
      return {
        start,
        end: start + target.surfaceForm.length,
        collocationId: target.collocationId,
        label: target.label,
        translation: target.translation,
        learningMode: target.learningMode,
      };
    })
    .filter((range) => range.start >= 0 && range.end > range.start)
    .sort((left, right) => left.start - right.start || right.end - left.end);

  return ranges.reduce<CollocationTextRange[]>((selected, range) => {
    const previous = selected.at(-1);
    if (previous && range.start < previous.end) return selected;
    selected.push({ ...range });
    return selected;
  }, []);
}

export function buildSentenceCardMap(cards: SentenceCardData[]) {
  const cardsByLocation = new Map<string, SentenceCardData>();

  for (const card of cards) {
    const key = sentenceLocationKey(card.paragraph_index, card.sentence_index);
    if (!cardsByLocation.has(key)) cardsByLocation.set(key, card);
  }

  return cardsByLocation;
}
