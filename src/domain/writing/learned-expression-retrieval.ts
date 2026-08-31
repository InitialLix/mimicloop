import type { ArgumentNodeKey, DevelopmentRelation } from "./guided-writing-coach";

export type LearnedWritingAssetKind = "sentence_frame" | "sentence_chunk" | "core_expression";
export type WritingLanguageNode = Exclude<ArgumentNodeKey, "stance">;
export type WritingTransferUnit = "collocation" | "sentence_frame" | "rhetorical_move";

export type LearnedWritingAsset = {
  assetType: "sentence" | "collocation";
  assetId: string;
  kind: LearnedWritingAssetKind;
  cueZh: string;
  englishForm: string;
  originalSentence: string | null;
  usageNote: string | null;
  argumentFunctions: string[];
  topics: string[];
  learningStage: "new" | "learned" | "recall" | "use";
  sourceTitle: string;
  sourceRelation: "same_prompt" | "cross_topic";
  transferUnit: WritingTransferUnit;
  transferGuidanceZh: string;
  score: number;
  recommendationReasonZh: string;
};

export type LearnedWritingAssetInput = Omit<LearnedWritingAsset, "score" | "recommendationReasonZh">;

export type LearnedWritingRetrievalView = {
  sessionId: string;
  node: WritingLanguageNode;
  nodeContent: string;
  draftTextConsidered: string;
  nodeNeed: {
    purposeZh: string;
    preferredArgumentFunctions: string[];
    draftConsidered: boolean;
  };
  wordingObservationZh: string;
  revisionDirectionZh: string;
  pool: {
    approvedSentences: number;
    approvedCoreExpressions: number;
    studiedSentences: number;
    studiedCoreExpressions: number;
  };
  assets: LearnedWritingAsset[];
  primaryAsset: LearnedWritingAsset | null;
  supportingExpressions: LearnedWritingAsset[];
  noSuitableAsset: boolean;
  noSuitableReasonZh: string | null;
  selection: {
    mode: "deepseek" | "deterministic" | "fallback";
    model: string | null;
    errorCode: string | null;
  };
};

export const writingLanguageNodes: WritingLanguageNode[] = ["claim", "reason", "mechanism", "result"];

export function isWritingLanguageNode(value: string): value is WritingLanguageNode {
  return writingLanguageNodes.includes(value as WritingLanguageNode);
}

export function languageNeedForNode(node: WritingLanguageNode, relation: DevelopmentRelation | null) {
  if (node === "claim") return {
    purposeZh: "把主体段中心观点写成清晰、可展开的主题句。",
    preferredArgumentFunctions: ["topic_sentence", "state_position", "qualify_claim"],
  };
  if (node === "reason") return {
    purposeZh: "补充支撑中心观点的依据，不重复 Main point，也不提前跳到结论。",
    preferredArgumentFunctions: ["explain_mechanism", "compare_or_weigh", "qualify_claim"],
  };
  if (node === "result") return {
    purposeZh: "收束本段已经证明的有限结论，不加入新的主要观点。",
    preferredArgumentFunctions: ["describe_result", "conclude_or_infer", "qualify_claim"],
  };
  const byRelation: Record<DevelopmentRelation, string[]> = {
    causal: ["explain_mechanism", "describe_result"],
    principle_application: ["explain_mechanism", "describe_result"],
    comparison: ["compare_or_weigh", "describe_result", "qualify_claim"],
    problem_response: ["propose_solution", "explain_mechanism", "describe_result"],
    qualification: ["qualify_claim", "concession", "describe_result"],
    unclear: ["explain_mechanism", "describe_result", "qualify_claim", "compare_or_weigh"],
  };
  return {
    purposeZh: relation === "comparison"
      ? "说明比较或权衡怎样支撑 Main point，而不是只列出两边。"
      : relation === "qualification"
        ? "说明这一观点在什么条件下成立，并控制结论强度。"
        : relation === "problem_response"
          ? "说明回应怎样作用于问题，补上中间关系。"
          : "把 Reason 与 Main point 之间缺失的作用过程解释清楚。",
    preferredArgumentFunctions: byRelation[relation ?? "unclear"],
  };
}

export function transferUnitForKind(kind: LearnedWritingAssetKind): WritingTransferUnit {
  if (kind === "core_expression") return "collocation";
  if (kind === "sentence_frame") return "sentence_frame";
  return "rhetorical_move";
}

export function transferGuidanceForUnit(unit: WritingTransferUnit) {
  if (unit === "collocation") return "迁移固定搭配；句子结构和具体内容仍由你决定。";
  if (unit === "sentence_frame") return "迁移句法骨架；用当前节点的内容替换槽位，不照搬原题。";
  return "迁移这个论证动作；保留功能，不照搬来源主题和完整句子。";
}

const preferredFunctions = new Map([
  ["topic_sentence", 5],
  ["state_position", 5],
  ["explain_mechanism", 5],
  ["propose_solution", 5],
  ["describe_result", 4],
  ["conclude_or_infer", 4],
  ["qualify_claim", 3],
  ["compare_or_weigh", 3],
  ["concession", 3],
  ["counterargument", 2],
  ["give_example", 1],
]);

const broadTopics = new Set([
  "government_public_policy_spending",
  "society_family_population_equality",
]);
const overlapStopWords = new Set([
  "a", "an", "and", "are", "as", "been", "but", "by", "for", "have", "is", "it", "no", "of", "or",
  "can", "could", "may", "might", "should", "that", "the", "there", "to", "we", "when", "where", "which", "while", "who", "whom", "whose", "why",
  "will", "with", "would", "highly", "people", "person", "someone", "something", "work", "working",
]);
const roleDefiningFunctions = new Set(["counterargument", "concession", "give_example", "propose_solution"]);

function contentWords(value: string) {
  return new Set((value.toLocaleLowerCase().match(/[a-z]+/gu) ?? []).filter((word) => word.length > 2 && !overlapStopWords.has(word)));
}

function substantiallyOverlaps(left: string, right: string) {
  const leftWords = contentWords(left);
  const rightWords = contentWords(right);
  const smaller = leftWords.size <= rightWords.size ? leftWords : rightWords;
  const larger = leftWords.size <= rightWords.size ? rightWords : leftWords;
  return smaller.size > 0 && Array.from(smaller).every((word) => larger.has(word));
}

export function semanticOverlapCount(left: string, right: string) {
  const leftWords = contentWords(left);
  const rightWords = contentWords(right);
  let overlap = 0;
  for (const word of leftWords) if (rightWords.has(word)) overlap += 1;
  return overlap;
}

function transferableFixedForm(asset: LearnedWritingAsset) {
  return asset.englishForm.replace(/\{[^}]+\}/gu, " ");
}

function learningWeight(stage: LearnedWritingAssetInput["learningStage"]) {
  if (stage === "use") return 3;
  if (stage === "recall") return 2;
  if (stage === "learned") return 1;
  return 0;
}

function recommendationReason(asset: LearnedWritingAssetInput, topicMatch: boolean, functionMatch: string | null) {
  if (asset.transferUnit === "rhetorical_move" && asset.argumentFunctions.includes("counterargument")) {
    return "适合用来质疑题目中的判断或分类标准；后续理由仍由你自己的论证链提供。";
  }
  if (asset.transferUnit === "sentence_frame") {
    return "它提供完整句法骨架；只有槽位之间的逻辑关系也符合当前节点时才应迁移。";
  }
  if (asset.transferUnit === "collocation") {
    return "它只提供一个局部固定搭配，不能代替当前节点的完整主张。";
  }
  if (functionMatch && topicMatch) return `与你的题目主题相近，可用于${functionMatch === "explain_mechanism" ? "解释机制" : functionMatch === "describe_result" ? "说明结果" : "推进论证"}。`;
  if (functionMatch) return `来自其他主题，但句式功能适合${functionMatch === "explain_mechanism" ? "解释机制" : functionMatch === "describe_result" ? "说明结果" : "推进当前论证"}。`;
  if (topicMatch) return "与你的题目主题相近，请只在确实符合现有思路时使用。";
  return asset.learningStage === "new"
    ? "这是正式语料库中的新表达；只有自然贴合当前意思时才使用。"
    : "这是你学过的表达；只有自然贴合当前意思时才使用。";
}

export function rankLearnedWritingAssets(input: {
  assets: LearnedWritingAssetInput[];
  promptTopics: string[];
  semanticText?: string;
  preferredArgumentFunctions?: string[];
  limit?: number;
  maxPerAssetType?: number;
  allowFunctionNeutral?: boolean;
  requireSemanticOverlap?: boolean;
}): LearnedWritingAsset[] {
  const promptTopics = new Set(input.promptTopics);
  const requestedFunctions = input.preferredArgumentFunctions?.length
    ? new Set(input.preferredArgumentFunctions)
    : null;
  const ranked = input.assets.map((asset) => {
    const topicMatch = asset.topics.some((topic) => promptTopics.has(topic) && !broadTopics.has(topic));
    const functionMatch = asset.argumentFunctions
      .filter((value) => !requestedFunctions || requestedFunctions.has(value))
      .map((value) => [value, preferredFunctions.get(value) ?? 0] as const)
      .sort((left, right) => right[1] - left[1])[0] ?? null;
    if (!functionMatch?.[1] && !input.allowFunctionNeutral) return null;
    if (!input.allowFunctionNeutral && requestedFunctions && asset.argumentFunctions.some((value) => (
      roleDefiningFunctions.has(value) && !requestedFunctions.has(value)
    ))) return null;
    const overlap = input.semanticText
      ? semanticOverlapCount(`${asset.englishForm} ${asset.originalSentence ?? ""}`, input.semanticText)
      : 0;
    if (input.requireSemanticOverlap && overlap === 0) return null;
    const score = learningWeight(asset.learningStage)
      + (topicMatch ? 5 : 0)
      + (functionMatch?.[1] ?? 0)
      + (input.allowFunctionNeutral && !functionMatch
        ? Math.min(Math.max(...asset.argumentFunctions.map((value) => preferredFunctions.get(value) ?? 0), 0), 2)
        : 0)
      + Math.min(overlap, 4) * 3
      + (asset.kind === "sentence_chunk" ? 3 : asset.kind === "sentence_frame" ? 1 : 1);
    return {
      ...asset,
      score,
      recommendationReasonZh: recommendationReason(asset, topicMatch, functionMatch?.[0] ?? null),
    };
  }).filter((asset): asset is LearnedWritingAsset => asset !== null)
    .sort((left, right) => right.score - left.score || left.englishForm.localeCompare(right.englishForm));

  const result: LearnedWritingAsset[] = [];
  const perType = { sentence: 0, collocation: 0 };
  const maxPerAssetType = input.maxPerAssetType ?? 2;
  for (const asset of ranked) {
    if (asset.assetType === "sentence" && perType.sentence >= maxPerAssetType) continue;
    if (asset.assetType === "collocation" && perType.collocation >= maxPerAssetType) continue;
    const normalized = asset.englishForm.toLocaleLowerCase();
    if (result.some((existing) => {
      const existingNormalized = existing.englishForm.toLocaleLowerCase();
      return existingNormalized.includes(normalized)
        || normalized.includes(existingNormalized)
        || substantiallyOverlaps(existingNormalized, normalized);
    })) continue;
    result.push(asset);
    perType[asset.assetType] += 1;
    if (result.length >= (input.limit ?? 4)) break;
  }
  return result;
}

export function layerWritingAssets(input: {
  assets: LearnedWritingAssetInput[];
  promptTopics: string[];
  semanticText: string;
  preferredArgumentFunctions: string[];
}) {
  const structures = rankLearnedWritingAssets({
    assets: input.assets.filter((asset) => asset.assetType === "sentence"),
    promptTopics: input.promptTopics,
    semanticText: input.semanticText,
    preferredArgumentFunctions: input.preferredArgumentFunctions,
    limit: 5,
  });
  const collocations = rankLearnedWritingAssets({
    assets: input.assets.filter((asset) => asset.assetType === "collocation"),
    promptTopics: input.promptTopics,
    semanticText: input.semanticText,
    preferredArgumentFunctions: input.preferredArgumentFunctions,
    allowFunctionNeutral: true,
    requireSemanticOverlap: true,
    limit: 12,
    maxPerAssetType: 12,
  });
  const primaryAsset = structures.find((asset) => (
    asset.score >= 11
    && semanticOverlapCount(transferableFixedForm(asset), input.semanticText) > 0
  )) ?? null;
  const supportingExpressions = collocations
    .filter((asset) => semanticOverlapCount(asset.englishForm, input.semanticText) > 0)
    .slice(0, 3);
  return {
    primaryAsset,
    supportingExpressions,
    assets: [primaryAsset, ...supportingExpressions].filter((asset): asset is LearnedWritingAsset => asset !== null),
  };
}
