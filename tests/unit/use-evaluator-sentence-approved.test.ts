import { describe, expect, it } from "vitest";
import approved from "../fixtures/use-evaluator-sentence.approved.json";

describe("Sentence Use evaluator approved set", () => {
  it("records complete human approval for all 18 cases", () => {
    expect(approved.review_status).toBe("approved");
    expect(approved.cases).toHaveLength(18);
    expect(new Set(approved.cases.map((item) => item.id)).size).toBe(approved.cases.length);
    expect(new Set(approved.human_review.approved_case_ids))
      .toEqual(new Set(approved.cases.map((item) => item.id)));
  });

  it("covers both Sentence Use modes and the main failure classes", () => {
    const refs = approved.cases.map((item) => item.exercise_ref);
    expect(refs.some((ref) => ref.includes(":slot_replacement:"))).toBe(true);
    expect(refs.some((ref) => ref.includes(":guided_application:"))).toBe(true);

    const tags = new Set(approved.cases.flatMap((item) => item.tags));
    for (const required of [
      "fully_correct",
      "natural_paraphrase",
      "complete_meaning_missing_target",
      "minor_grammar",
      "partial_meaning",
      "grammatical_semantically_wrong",
      "target_used_unnaturally",
      "wrong_preposition_collocation",
      "target_spelling_error",
      "obvious_typo",
      "chinese_only",
      "empty",
    ]) expect(tags.has(required)).toBe(true);
  });
});
