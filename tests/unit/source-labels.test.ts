import { describe, expect, it } from "vitest";
import { buildEssaySummaries, compactEssaySourceLine, type EssaySummary } from "../../src/lib/essay-summaries";
import { isLanguageRichnessSource, modelDisplayName, sourceDisplayLabel } from "../../src/lib/labels";
import type { SourceEssayData } from "../../src/lib/content-types";

describe("source role labels", () => {
  it("uses the collection name for a published language textbook", () => {
    expect(sourceDisplayLabel("published_language_textbook", "L. G. Alexander", "新概念英语 3"))
      .toBe("新概念英语 3");
  });

  it("keeps language-richness sources separate from model essays", () => {
    expect(isLanguageRichnessSource({
      answer_origin: "published_language_textbook",
      content_role: "language_richness_corpus",
    })).toBe(true);
    expect(isLanguageRichnessSource({ answer_origin: "teacher_model" })).toBe(false);
  });

  it("shows a compact textbook and lesson reference instead of the raw publication note", () => {
    const essay: EssaySummary = {
      id: "lesson-59",
      title: "Collecting",
      ieltsPrompt: null,
      topics: ["culture_art_language_media"],
      publicationRef: "New Concept English 3, Lesson 59; question: What does a collector gain?; web transcript verified against https://example.com",
      sourceLabel: "新概念英语 3",
      sentenceCount: 4,
      essayNumber: null,
      contentRole: "language_richness_corpus",
    };

    expect(compactEssaySourceLine(essay, 0)).toBe("新概念英语 3 · 第 59 课");
  });

  it("uses the official DeepSeek capitalization in model labels", () => {
    expect(modelDisplayName("deepseek-v4-flash")).toBe("DeepSeek-v4-flash");
    expect(modelDisplayName("DeepSeek-chat")).toBe("DeepSeek-chat");
  });

  it("does not expose imported guided-writing prompts as reading essays", () => {
    const source = {
      id: "prompt-1",
      title: "Imported prompt",
      ielts_prompt: "Discuss both views.",
      content_role: "guided_writing_prompt",
      topics: ["education"],
      publication_ref: null,
      answer_origin: "learner_imported_prompt",
      author: "learner",
      source_name: "Imported Task 2 prompt",
    } as SourceEssayData;

    expect(buildEssaySummaries([source], [], () => "导入题目")).toEqual([]);
  });
});
