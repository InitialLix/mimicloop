import { describe, expect, it, vi } from "vitest";
import {
  validateWritingAssetSelection,
  type WritingAssetSelectionInputV1,
} from "../../src/domain/writing/writing-asset-selection";
import { DeepSeekWritingAssetSelector } from "../../src/lib/ai/writing-asset-selector-provider";

const input: WritingAssetSelectionInputV1 = {
  schemaVersion: "guided-writing-asset-selection-input.v1",
  sessionId: "79eb8208-86fa-475b-a0b8-8e2a99f9eeba",
  node: "result",
  nodePurposeZh: "收束本段已经证明的有限结论。",
  plannedMeaning: "Protecting wildlife also supports human well-being.",
  semanticContext: "Ecological disruption affects systems people depend on.",
  candidates: [
    {
      assetType: "sentence",
      assetId: "sentence-1",
      transferUnit: "sentence_frame",
      englishForm: "This suggests that {claim}.",
      originalSentence: "This suggests that public action is justified.",
      argumentFunctions: ["conclude_or_infer"],
      sourceRelation: "cross_topic",
      cueZh: "这表明……",
    },
    {
      assetType: "collocation",
      assetId: "collocation-1",
      transferUnit: "collocation",
      englishForm: "human well-being",
      originalSentence: null,
      argumentFunctions: ["describe_result"],
      sourceRelation: "same_prompt",
      cueZh: "人类福祉",
    },
  ],
};

describe("Guided Writing corpus asset selection", () => {
  it("accepts only candidate IDs with the correct primary and supporting roles", () => {
    const result = validateWritingAssetSelection({
      schema_version: "guided-writing-asset-selection.v1",
      primary_asset_id: "sentence-1",
      supporting_asset_ids: ["collocation-1"],
      reason_zh: "该结构可以收束已经展开的因果关系。",
      confidence: 0.91,
      needs_review: false,
    }, input);
    expect(result).toMatchObject({ valid: true });
  });

  it("rejects invented IDs and a collocation used as the primary structure", () => {
    const invented = validateWritingAssetSelection({
      schema_version: "guided-writing-asset-selection.v1",
      primary_asset_id: "invented",
      supporting_asset_ids: [],
      reason_zh: "不可信选择。",
      confidence: 0.9,
      needs_review: false,
    }, input);
    expect(invented).toMatchObject({ valid: false });
    const wrongType = validateWritingAssetSelection({
      schema_version: "guided-writing-asset-selection.v1",
      primary_asset_id: "collocation-1",
      supporting_asset_ids: [],
      reason_zh: "错误类型。",
      confidence: 0.9,
      needs_review: false,
    }, input);
    expect(wrongType).toMatchObject({ valid: false });
  });

  it("sends approved candidates for ID-only selection without placing the API key in the body", async () => {
    const output = {
      schema_version: "guided-writing-asset-selection.v1",
      primary_asset_id: "sentence-1",
      supporting_asset_ids: ["collocation-1"],
      reason_zh: "该结构能自然承担当前收束任务。",
      confidence: 0.9,
      needs_review: false,
    };
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ authorization: "Bearer test-key" });
      expect(String(init?.body)).not.toContain("test-key");
      expect(String(init?.body)).toContain("sentence-1");
      expect(String(init?.body)).toContain("Never invent");
      return new Response(JSON.stringify({
        model: "deepseek-v4-flash",
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }],
        usage: { prompt_tokens: 100, completion_tokens: 30 },
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const result = await new DeepSeekWritingAssetSelector({
      apiKey: "test-key",
      model: "deepseek-v4-flash",
      fetchImpl: fetchImpl as typeof fetch,
    }).select(input, new AbortController().signal);
    expect(result).toMatchObject({ output, provider: "deepseek", model: "deepseek-v4-flash" });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
