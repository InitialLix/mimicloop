import { describe, expect, it } from "vitest";
import { buildUseTask, type UseTaskCard } from "../../src/domain/practice/use-task";

const structureCard: UseTaskCard = {
  id: "structure-card",
  learning_sentence: "While this policy may reduce costs, it can also weaken access.",
  primary_focus: "structure",
  chunks: [],
  pattern: "While {policy} may {benefit}, it can also {cost}.",
  slots: [
    { name: "policy", role_zh: "被讨论的政策" },
    { name: "benefit", role_zh: "短期好处" },
    { name: "cost", role_zh: "代价" },
  ],
  simplified_version: null,
  transfer_example: null,
  exercise_seed: {
    slot_replacement: [{
      prompt_zh: "虽然我承认远程办公可以节省办公室成本，但它也可能削弱协作。",
      hints: [{ zh: "削弱协作", en: "reduce collaboration" }],
      feedback_pattern: "While {policy} may save office costs, it can also {cost}.",
      slot_values: [
        { slot_name: "policy", value: "remote work" },
        { slot_name: "benefit", value: "save office costs" },
        { slot_name: "cost", value: "reduce collaboration" },
      ],
      reference_answer: "While remote work may save office costs, it can also reduce collaboration.",
    }],
  },
};

const vocabularyCard: UseTaskCard = {
  id: "vocabulary-card",
  learning_sentence: "The decline has been linked in part to heavier traffic.",
  primary_focus: "vocabulary",
  chunks: [{ text: "linked in part to", meaning_zh: "部分归因于；与……有一定关联" }],
  pattern: null,
  slots: [],
  simplified_version: null,
  transfer_example: "Lower productivity has been linked in part to poor sleep.",
  exercise_seed: {
    chunk_cloze: [{
      chunk_text: "linked in part to",
      prompt_sentence: "The decline has been ____ heavier traffic.",
      reference_answer: "linked in part to",
    }],
    guided_application: {
      prompt_zh: "生产率下降被认为在一定程度上与睡眠不足有关。",
      hints: [{ zh: "生产率", en: "productivity" }],
      target_chunk: "linked in part to",
      reference_answer: "Lower productivity has been linked in part to poor sleep.",
    },
  },
};

describe("focus-aware Use task", () => {
  it("uses reviewed slots for a structure card", () => {
    const task = buildUseTask(structureCard);

    expect(task.mode).toBe("structure");
    if (task.mode !== "structure") throw new Error("Expected a structure task");
    expect(task.exerciseType).toBe("slot_replacement");
    expect(task.guidedPrompt?.text).toContain("远程办公");
    expect(task.pattern).toBe("While {policy} may save office costs, it can also {cost}.");
    expect(task.slotValues[0]).toEqual({ name: "policy", roleZh: "被讨论的政策", value: "remote work" });
  });

  it("uses a simple target-chunk application for a vocabulary card", () => {
    const task = buildUseTask(vocabularyCard);

    expect(task.mode).toBe("vocabulary");
    if (task.mode !== "vocabulary") throw new Error("Expected a vocabulary task");
    expect(task.exerciseType).toBe("guided_application");
    expect(task.guidedPrompt?.text).toContain("生产率下降");
    expect(task.guidedPrompt?.hints[0]).toEqual({ zh: "生产率", en: "productivity" });
    expect(task.referenceAnswer).toBe(vocabularyCard.transfer_example);
    expect("scaffold" in task).toBe(false);
  });
});
