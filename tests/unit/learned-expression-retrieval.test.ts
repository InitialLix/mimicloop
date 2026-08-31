import { describe, expect, it } from "vitest";
import {
  layerWritingAssets,
  rankLearnedWritingAssets,
  type LearnedWritingAssetInput,
} from "../../src/domain/writing/learned-expression-retrieval";

function asset(overrides: Partial<LearnedWritingAssetInput> & Pick<LearnedWritingAssetInput, "assetId" | "englishForm">): LearnedWritingAssetInput {
  return {
    assetType: "collocation",
    kind: "core_expression",
    cueZh: "提示",
    originalSentence: null,
    usageNote: null,
    argumentFunctions: ["explain_mechanism"],
    topics: [],
    learningStage: "recall",
    sourceTitle: "Source",
    sourceRelation: "cross_topic",
    transferUnit: "collocation",
    transferGuidanceZh: "迁移固定搭配。",
    ...overrides,
  };
}

describe("learned writing asset retrieval", () => {
  it("prefers useful argument functions and stronger learner evidence", () => {
    const ranked = rankLearnedWritingAssets({
      promptTopics: ["environment_energy_animals"],
      assets: [
        asset({ assetId: "weak", englishForm: "an unrelated phrase", argumentFunctions: [], learningStage: "use" }),
        asset({ assetId: "recall", englishForm: "linked to", learningStage: "recall" }),
        asset({ assetId: "use", englishForm: "result in", learningStage: "use" }),
      ],
    });
    expect(ranked.map((item) => item.assetId)).toEqual(["use", "recall"]);
  });

  it("labels same-prompt assets and avoids overlapping duplicate recommendations", () => {
    const ranked = rankLearnedWritingAssets({
      promptTopics: ["environment_energy_animals"],
      assets: [
        asset({
          assetType: "sentence",
          kind: "sentence_chunk",
          assetId: "sentence",
          englishForm: "there is no compelling reason why",
          topics: ["environment_energy_animals"],
          sourceRelation: "same_prompt",
        }),
        asset({
          assetId: "collocation",
          englishForm: "a compelling reason",
          topics: ["environment_energy_animals"],
          sourceRelation: "same_prompt",
        }),
      ],
    });
    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toMatchObject({ assetId: "sentence", sourceRelation: "same_prompt" });
  });

  it("does not treat cross-topic provenance as evidence of semantic fit or accept a mismatched rhetorical role", () => {
    const ranked = rankLearnedWritingAssets({
      promptTopics: ["environment_energy_animals"],
      semanticText: "Animals share the same environment as humans.",
      preferredArgumentFunctions: ["qualify_claim"],
      assets: [
        asset({
          assetType: "sentence",
          kind: "sentence_frame",
          assetId: "cross-topic-frame",
          englishForm: "It would be wrong to ban {practice} until {alternative} have been developed.",
          originalSentence: "It would be wrong to ban animal experiments until alternatives have been developed.",
          argumentFunctions: ["qualify_claim"],
          topics: ["environment_energy_animals"],
          learningStage: "new",
          sourceRelation: "cross_topic",
          transferUnit: "sentence_frame",
        }),
        asset({
          assetType: "sentence",
          kind: "sentence_chunk",
          assetId: "same-prompt-move",
          englishForm: "there is no compelling reason why",
          argumentFunctions: ["counterargument", "qualify_claim"],
          topics: ["environment_energy_animals"],
          learningStage: "use",
          sourceRelation: "same_prompt",
          transferUnit: "rhetorical_move",
        }),
      ],
    });
    expect(ranked.map((item) => item.assetId)).toEqual(["cross-topic-frame"]);
  });

  it("keeps one sentence structure separate from supporting collocations", () => {
    const layered = layerWritingAssets({
      promptTopics: ["environment_energy_animals"],
      semanticText: "When animal populations decline, ecological balance will be disrupted.",
      preferredArgumentFunctions: ["explain_mechanism"],
      assets: [
        asset({
          assetType: "sentence",
          kind: "sentence_frame",
          assetId: "structure",
          englishForm: "When {cause}, {result} will be disrupted.",
          originalSentence: "The decline of animals disrupts ecological balance.",
          argumentFunctions: ["explain_mechanism"],
          topics: ["environment_energy_animals"],
          transferUnit: "sentence_frame",
        }),
        asset({
          assetId: "fitting-collocation",
          englishForm: "ecological balance",
          argumentFunctions: ["explain_mechanism"],
          topics: ["environment_energy_animals"],
        }),
        asset({
          assetId: "topic-only-collocation",
          englishForm: "a necessary evil",
          argumentFunctions: ["explain_mechanism"],
          topics: ["environment_energy_animals"],
        }),
      ],
    });
    expect(layered.primaryAsset).toMatchObject({ assetId: "structure", assetType: "sentence" });
    expect(layered.supportingExpressions.map((item) => item.assetId)).toEqual(["fitting-collocation"]);
    expect(layered.assets.map((item) => item.assetId)).toEqual(["structure", "fitting-collocation"]);
  });

  it("keeps semantically relevant local collocations even when their broad argument label differs", () => {
    const layered = layerWritingAssets({
      promptTopics: ["work_economy_business_consumption"],
      semanticText: "A shorter working week can reduce pressure in a competitive job market.",
      preferredArgumentFunctions: ["topic_sentence", "state_position", "qualify_claim"],
      assets: [
        asset({
          assetId: "competitive-market",
          englishForm: "a competitive job market",
          argumentFunctions: ["describe_result", "explain_mechanism"],
          topics: ["work_economy_business_consumption"],
          learningStage: "new",
        }),
        asset({
          assetId: "reduce-pressure",
          englishForm: "reduce pressure on",
          argumentFunctions: ["explain_mechanism", "propose_solution"],
          topics: ["cities_housing_transport"],
          learningStage: "new",
        }),
      ],
    });
    expect(layered.primaryAsset).toBeNull();
    expect(layered.supportingExpressions.map((item) => item.assetId)).toEqual([
      "competitive-market",
      "reduce-pressure",
    ]);
  });

  it("returns no primary structure when topic and broad function match but the node meaning does not", () => {
    const layered = layerWritingAssets({
      promptTopics: ["environment_energy_animals"],
      semanticText: "Animals share the same environment as humans, so protecting them also protects people.",
      preferredArgumentFunctions: ["topic_sentence", "state_position", "qualify_claim"],
      assets: [
        asset({
          assetType: "sentence",
          kind: "sentence_chunk",
          assetId: "counterargument-move",
          englishForm: "there is no compelling reason why",
          originalSentence: "There is no compelling reason why wild animals should receive less protection.",
          argumentFunctions: ["counterargument", "qualify_claim"],
          topics: ["environment_energy_animals"],
          learningStage: "use",
          transferUnit: "rhetorical_move",
        }),
        asset({
          assetType: "sentence",
          kind: "sentence_frame",
          assetId: "ban-frame",
          englishForm: "It would be wrong to ban {practice} until {alternative} have been developed.",
          originalSentence: "It would be wrong to ban animal experiments until alternatives have been developed.",
          argumentFunctions: ["qualify_claim"],
          topics: ["environment_energy_animals"],
          transferUnit: "sentence_frame",
        }),
      ],
    });
    expect(layered.primaryAsset).toBeNull();
    expect(layered.assets).toEqual([]);
  });

  it("does not promote a Takeaway frame solely because both texts contain a relative pronoun", () => {
    const layered = layerWritingAssets({
      promptTopics: ["environment_energy_animals"],
      semanticText: "Animal decline disrupts food chains, which harms ecosystems and human well-being.",
      preferredArgumentFunctions: ["describe_result", "conclude_or_infer", "qualify_claim"],
      assets: [
        asset({
          assetType: "sentence",
          kind: "sentence_frame",
          assetId: "population-waste-frame",
          englishForm: "As {driver} increases, {actor} produce ever greater quantities of {pressure}, which {effect_one} and {effect_two}.",
          originalSentence: "As the human population increases, we produce more waste, which pollutes rivers and oceans.",
          argumentFunctions: ["explain_mechanism", "describe_result"],
          topics: ["environment_energy_animals"],
          learningStage: "new",
          transferUnit: "sentence_frame",
        }),
      ],
    });
    expect(layered.primaryAsset).toBeNull();
    expect(layered.assets).toEqual([]);
  });
});
