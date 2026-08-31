import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeEssayTask } from "../../src/domain/writing/task-analysis";
import type { SourceEssayData } from "../../src/lib/content-types";

const sources = JSON.parse(readFileSync(resolve(process.cwd(), "data/source_essays.json"), "utf8")) as SourceEssayData[];
const ieltsSources = sources.filter((source) => source.content_role !== "language_richness_corpus" && source.ielts_prompt);

describe("Guided Writing Task Analyzer", () => {
  it("covers every archived IELTS prompt with a typed argument map and starting outline", () => {
    expect(ieltsSources).toHaveLength(28);
    for (const source of ieltsSources) {
      const analysis = analyzeEssayTask(source);
      expect(analysis.prompt).toBe(source.ielts_prompt);
      expect(analysis.requiredParts.length).toBeGreaterThan(0);
      expect(analysis.instructionText.length).toBeGreaterThan(0);
      expect(analysis.argumentMap.nodes).toHaveLength(3);
      expect(analysis.argumentMap.structureNote).toContain("段");
      expect(analysis.outline.map((item) => item.key)).toEqual(["introduction", "body_1", "body_2", "conclusion"]);
      expect(analysis.outline.every((item) => item.goal.length > 10 && item.coachQuestion.length > 10)).toBe(true);
    }
  });

  it("does not flatten all six task types into a binary debate", () => {
    const maps = new Map(ieltsSources.map((source) => {
      const analysis = analyzeEssayTask(source);
      return [analysis.questionType, analysis.argumentMap];
    }));
    expect(maps).toHaveLength(6);
    expect(maps.get("opinion")?.kind).toBe("support");
    expect(maps.get("causes_solutions")?.kind).toBe("cause_response");
    expect(maps.get("two_part_multi_part")?.kind).toBe("dual_question");
    expect(maps.get("discussion")?.kind).toBe("compare");
    expect(maps.get("opinion")?.nodes).toEqual(["中心立场", "理由一 ＋ 理由二", "回扣立场"]);
  });

  it("keeps two-part questions separate in the essay map", () => {
    const source = ieltsSources.find((item) => item.question_type === "two_part_multi_part")!;
    const analysis = analyzeEssayTask(source);
    expect(analysis.requiredParts).toEqual(["完整回答问题 1", "完整回答问题 2"]);
    expect(analysis.outline[1]?.goal).toContain("Why could this be?");
    expect(analysis.outline[2]?.goal).toContain("Should governments");
  });

  it("surfaces limiting language instead of flattening an outweigh task", () => {
    const source = ieltsSources.find((item) => item.ielts_prompt?.includes("outweigh"))!;
    const analysis = analyzeEssayTask(source);
    expect(analysis.scopeMarkers).toContain("outweigh");
    expect(analysis.requiredParts).toContain("明确哪一方影响更大并说明原因");
  });
});
