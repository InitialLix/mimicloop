import { describe, expect, it } from "vitest";
import gold from "../fixtures/use-evaluator-gold.approved.json";

describe("Use evaluator approved gold set", () => {
  it("records complete human approval and contains the required 30–50 case range", () => {
    expect(gold.review_status).toBe("approved");
    expect(gold.cases.length).toBeGreaterThanOrEqual(30);
    expect(gold.cases.length).toBeLessThanOrEqual(50);
    expect(new Set(gold.cases.map((item) => item.id)).size).toBe(gold.cases.length);
    expect(new Set(gold.human_review.approved_case_ids)).toEqual(new Set(gold.cases.map((item) => item.id)));
  });

  it("covers the initial evaluator failure classes before human adjudication", () => {
    const tags = new Set(gold.cases.flatMap((item) => item.tags));
    for (const required of [
      "fully_correct",
      "natural_paraphrase",
      "complete_meaning_missing_target",
      "target_used_unnaturally",
      "wrong_verb_collocation",
      "wrong_preposition_collocation",
      "grammatically_imperfect_communicative",
      "grammatical_semantically_wrong",
      "partial_meaning",
      "spelling_only",
      "multiple_errors",
      "empty",
      "chinese_only",
      "irrelevant",
      "prompt_injection_like",
      "difficult_acceptable_variant"
    ]) expect(tags.has(required)).toBe(true);
  });
});
