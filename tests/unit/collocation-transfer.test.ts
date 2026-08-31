import { describe, expect, it } from "vitest";
import { buildCollocationVariations } from "../../src/lib/collocation-transfer";
import type { CollocationData } from "../../src/lib/content-types";

const collocation = (overrides: Partial<CollocationData>): CollocationData => ({
  schema_version: "1.2.0",
  id: "013dfc34-f91e-5e4d-9bb2-c8672db61fc7",
  canonical_text: "contribute to the economy",
  translation_prompt: "为经济作出贡献",
  pattern: "contribute to {outcome}",
  slots: [{ name: "outcome", role_zh: "产生的结果", replacement_examples: ["economic growth", "social development", "environmental protection"] }],
  expression_type: "collocation",
  grammar_pattern: null,
  usage_note: null,
  common_error: null,
  accepted_answers: ["contribute to the economy"],
  exercise_seed: {},
  topics: ["economy_business_work"],
  argument_functions: [],
  source_links: [],
  selection_scores: { naturalness: 5, active_recall_value: 5, transfer_value: 5, ielts_usefulness: 5 },
  difficulty: 3,
  normalized_text_hash: "0".repeat(64),
  deduplication: { group_key: "contribute", merge_target_id: null, confidence: "high", note: null },
  recommendation_reasons: ["test"],
  uncertainties: [],
  workflow_status: "approved",
  learning_mode: "recall_use",
  priority: "core",
  provenance: { guideline_version: "1.2.0", prompt_version: "test", processor_type: "manual", model_id: null },
  review_history: [],
  content_revision: 1,
  created_at: "2026-08-17T00:00:00.000Z",
  updated_at: "2026-08-17T00:00:00.000Z",
  ...overrides,
});

describe("collocation transfer guidance", () => {
  it("builds complete cross-topic expressions instead of blank skeletons", () => {
    expect(buildCollocationVariations(collocation({}))).toEqual([
      "contribute to economic growth",
      "contribute to social development",
      "contribute to environmental protection",
    ]);
  });

  it("does not force variations onto a complete phrase with an ordinary complement", () => {
    expect(buildCollocationVariations(collocation({
      canonical_text: "a compelling reason",
      pattern: "a compelling reason to {action}",
      slots: [{ name: "action", role_zh: "动作", replacement_examples: ["change the policy", "delay the decision"] }],
    }))).toEqual([]);
  });

  it("does not teach fixed phrases through mechanical slot filling", () => {
    expect(buildCollocationVariations(collocation({
      canonical_text: "as a means of",
      expression_type: "fixed_phrase",
      pattern: "as a means of {activity}",
      slots: [{ name: "activity", role_zh: "行为", replacement_examples: ["reducing emissions", "building trust"] }],
    }))).toEqual([]);
  });

  it("hides the section when fewer than two distinct approved changes remain", () => {
    expect(buildCollocationVariations(collocation({
      pattern: "contribute to {outcome}",
      slots: [{ name: "outcome", role_zh: "结果", replacement_examples: ["the economy", "the economy"] }],
    }))).toEqual([]);
  });
});
