import { describe, expect, it } from "vitest";
import {
  buildCollocationHighlightRanges,
  buildSentenceCardMap,
  essaySentenceAnchor,
  essaySentenceHref,
  sentenceLocationKey,
  splitParagraphSentences,
} from "../../src/lib/essay-sentence-links";
import type { SentenceCardData } from "../../src/lib/content-types";

describe("splitParagraphSentences", () => {
  it("keeps terminal punctuation and closing quotation marks", () => {
    expect(splitParagraphSentences('One sentence. "A question?" The last one!')).toEqual([
      "One sentence.",
      '"A question?"',
      "The last one!",
    ]);
  });

  it("keeps a final sentence without terminal punctuation", () => {
    expect(splitParagraphSentences("A complete sentence. A final fragment")).toEqual([
      "A complete sentence.",
      "A final fragment",
    ]);
  });
});

describe("buildSentenceCardMap", () => {
  it("maps a card by source paragraph and sentence instead of edited learning text", () => {
    const card = {
      id: "card-1",
      paragraph_index: 2,
      sentence_index: 3,
      original_sentence: "Original source sentence.",
      learning_sentence: "Edited learning sentence.",
    } as SentenceCardData;

    const result = buildSentenceCardMap([card]);

    expect(result.get(sentenceLocationKey(2, 3))).toBe(card);
    expect(result.get(sentenceLocationKey(2, 2))).toBeUndefined();
  });
});

describe("essay sentence anchors", () => {
  it("uses the same stable anchor for rendered sentences and every source link", () => {
    expect(essaySentenceAnchor(2, 3)).toBe("sentence-2-3");
    expect(essaySentenceHref("essay-1", 2, 3)).toBe("/library/essays/essay-1#sentence-2-3");
  });
});

describe("buildCollocationHighlightRanges", () => {
  it("marks collocations inside the original sentence without duplicating their text", () => {
    expect(buildCollocationHighlightRanges(
      "Students gain real experience and learn practical skills.",
      [
        { collocationId: "c1", label: "gain real experience", translation: "获得真实经验", learningMode: "recall_use", surfaceForm: "gain real experience", occurrenceIndex: 0 },
        { collocationId: "c2", label: "learn practical skills", translation: "学习实用技能", learningMode: "appreciation", surfaceForm: "learn practical skills", occurrenceIndex: 0 },
      ],
    )).toEqual([
      { start: 9, end: 29, collocationId: "c1", label: "gain real experience", translation: "获得真实经验", learningMode: "recall_use" },
      { start: 34, end: 56, collocationId: "c2", label: "learn practical skills", translation: "学习实用技能", learningMode: "appreciation" },
    ]);
  });

  it("uses the recorded occurrence and merges overlapping collocations", () => {
    expect(buildCollocationHighlightRanges(
      "Jobs create jobs and create better jobs.",
      [
        { collocationId: "c1", label: "jobs", translation: "工作", learningMode: "recall_use", surfaceForm: "jobs", occurrenceIndex: 1 },
        { collocationId: "c2", label: "create better jobs", translation: "创造更好的工作", learningMode: "recall_use", surfaceForm: "create better jobs", occurrenceIndex: 0 },
        { collocationId: "c3", label: "better jobs", translation: "更好的工作", learningMode: "appreciation", surfaceForm: "better jobs", occurrenceIndex: 0 },
      ],
    )).toEqual([
      { start: 12, end: 16, collocationId: "c1", label: "jobs", translation: "工作", learningMode: "recall_use" },
      { start: 21, end: 39, collocationId: "c2", label: "create better jobs", translation: "创造更好的工作", learningMode: "recall_use" },
    ]);
  });
});
