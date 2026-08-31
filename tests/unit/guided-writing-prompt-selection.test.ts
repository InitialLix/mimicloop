import { describe, expect, it } from "vitest";
import { resolveGuidedWritingPromptId } from "../../src/domain/writing/prompt-selection";

const prompts = [
  { sourceEssayId: "first" },
  { sourceEssayId: "second" },
  { sourceEssayId: "third" },
];

describe("Guided Writing prompt selection", () => {
  it("restores a valid essay id from the URL", () => {
    expect(resolveGuidedWritingPromptId(prompts, "second")).toBe("second");
  });

  it("uses the first repeated query value and safely falls back for unknown ids", () => {
    expect(resolveGuidedWritingPromptId(prompts, ["third", "second"])).toBe("third");
    expect(resolveGuidedWritingPromptId(prompts, "missing")).toBe("first");
  });

  it("handles an empty prompt collection", () => {
    expect(resolveGuidedWritingPromptId([], undefined)).toBe("");
  });
});
