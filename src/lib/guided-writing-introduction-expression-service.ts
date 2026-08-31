import { ContentRepository } from "../db/content-repository";
import type { SqliteConnection } from "../db/client";
import {
  introductionLanguageNeed,
  type IntroductionLanguagePart,
  type IntroductionLanguageRetrievalView,
} from "../domain/writing/introduction-language-activation";
import {
  rankLearnedWritingAssets,
  semanticOverlapCount,
  transferGuidanceForUnit,
  transferUnitForKind,
  type LearnedWritingAsset,
  type LearnedWritingAssetInput,
} from "../domain/writing/learned-expression-retrieval";
import type { WritingAssetSelectionInputV1 } from "../domain/writing/writing-asset-selection";
import type { CollocationData, SentenceCardData, SourceEssayData } from "./content-types";
import { getGuidedWritingConfig } from "./ai/config";
import { GuidedWritingProviderHttpError } from "./ai/guided-writing-provider";
import {
  DeepSeekWritingAssetSelector,
  type WritingAssetSelectorProvider,
} from "./ai/writing-asset-selector-provider";
import { validateWritingAssetSelection } from "../domain/writing/writing-asset-selection";
import { getGuidedWritingIntroductionWorkspace } from "./guided-writing-introduction-service";
import { GuidedWritingRequestError } from "./guided-writing-service";

type ProgressRow = { id: string; stage: "new" | "learned" | "recall" | "use" };

function semanticContextForPart(
  part: IntroductionLanguagePart,
  workspace: ReturnType<typeof getGuidedWritingIntroductionWorkspace>,
  learnerDraft: string,
) {
  const context = workspace.context;
  const trustedMeaning = part === "opening"
    ? [context.prompt]
    : part === "task_framing"
      ? [context.prompt]
      : [context.prompt, context.essayPosition, ...context.bodyPlan.map((body) => `${body.role}: ${body.mainPoint}`)];
  return [...trustedMeaning, learnerDraft.trim()].filter(Boolean).join(" ");
}

function introductionRecommendation(asset: LearnedWritingAsset) {
  if (asset.transferUnit === "sentence_frame") {
    return "它来自已审核 IELTS 范文的开头，并提供当前部分可迁移的句法骨架；替换槽位时仍要忠于你的题目和立场。";
  }
  return "它来自已审核 IELTS 范文的开头。请迁移表达动作，不要照搬原文主题或完整句子。";
}

export function prepareIntroductionWritingAssetSelection(input: {
  connection: SqliteConnection;
  sourceEssayId: string;
  part: IntroductionLanguagePart;
  learnerDraft?: string;
}): {
  retrieval: IntroductionLanguageRetrievalView;
  candidates: LearnedWritingAsset[];
  semanticContext: string;
} {
  const workspace = getGuidedWritingIntroductionWorkspace(input.connection, input.sourceEssayId);
  const content = new ContentRepository(input.connection);
  const cards = content.listCards() as unknown as SentenceCardData[];
  const collocations = content.listCollocations() as unknown as CollocationData[];
  const sources = content.listSources() as unknown as SourceEssayData[];
  const sourceTitles = new Map(sources.map((source) => [source.id, source.title]));
  const ieltsModelSourceIds = new Set(sources
    .filter((source) => source.content_role !== "language_richness_corpus")
    .map((source) => source.id));
  const promptSource = sources.find((source) => source.id === input.sourceEssayId);
  if (!promptSource) throw new GuidedWritingRequestError("找不到这道已归档题目。", 404, "SOURCE_NOT_FOUND");

  const sentenceProgress = new Map((input.connection.sqlite.prepare(
    "SELECT card_id AS id, learning_stage AS stage FROM review_states",
  ).all() as ProgressRow[]).map((row) => [row.id, row.stage]));
  const collocationProgress = new Map((input.connection.sqlite.prepare(
    "SELECT collocation_id AS id, learning_stage AS stage FROM collocation_progress",
  ).all() as ProgressRow[]).map((row) => [row.id, row.stage]));

  const assets: LearnedWritingAssetInput[] = [];
  let approvedIntroductionSentences = 0;
  let studiedIntroductionSentences = 0;
  for (const card of cards) {
    if (
      card.content_status !== "approved"
      || card.paragraph_index !== 0
      || !ieltsModelSourceIds.has(card.source_essay_id)
    ) continue;
    approvedIntroductionSentences += 1;
    const stage = sentenceProgress.get(card.id) ?? "new";
    if (stage !== "new") studiedIntroductionSentences += 1;
    const firstChunk = card.chunks.find((chunk) => chunk.text.trim() && chunk.meaning_zh.trim());
    if (!card.pattern && !firstChunk) continue;
    const kind = card.pattern ? "sentence_frame" as const : "sentence_chunk" as const;
    const transferUnit = transferUnitForKind(kind);
    assets.push({
      assetType: "sentence",
      assetId: card.id,
      kind,
      cueZh: card.pattern ? card.translation_zh : firstChunk!.meaning_zh,
      englishForm: card.pattern ?? firstChunk!.text,
      originalSentence: card.learning_sentence,
      usageNote: card.pattern ? card.usage_note : firstChunk!.note || card.usage_note,
      argumentFunctions: card.argument_functions,
      topics: card.topics,
      learningStage: stage,
      sourceTitle: sourceTitles.get(card.source_essay_id) ?? "已审核语料",
      sourceRelation: card.source_essay_id === input.sourceEssayId ? "same_prompt" : "cross_topic",
      transferUnit,
      transferGuidanceZh: transferGuidanceForUnit(transferUnit),
    });
  }

  let approvedCoreExpressions = 0;
  let studiedCoreExpressions = 0;
  for (const collocation of collocations) {
    if (collocation.workflow_status !== "approved" || collocation.learning_mode !== "recall_use") continue;
    approvedCoreExpressions += 1;
    const stage = collocationProgress.get(collocation.id) ?? "new";
    if (stage !== "new") studiedCoreExpressions += 1;
    const samePrompt = collocation.source_links.some((link) => link.source_essay_id === input.sourceEssayId);
    const sourceId = collocation.source_links[0]?.source_essay_id;
    const transferUnit = transferUnitForKind("core_expression");
    assets.push({
      assetType: "collocation",
      assetId: collocation.id,
      kind: "core_expression",
      cueZh: collocation.translation_prompt,
      englishForm: collocation.canonical_text,
      originalSentence: null,
      usageNote: collocation.usage_note,
      argumentFunctions: collocation.argument_functions,
      topics: collocation.topics,
      learningStage: stage,
      sourceTitle: sourceId ? sourceTitles.get(sourceId) ?? "已审核语料" : "已审核语料",
      sourceRelation: samePrompt ? "same_prompt" : "cross_topic",
      transferUnit,
      transferGuidanceZh: transferGuidanceForUnit(transferUnit),
    });
  }

  const need = introductionLanguageNeed(input.part);
  const semanticContext = semanticContextForPart(input.part, workspace, input.learnerDraft ?? "");
  const sentenceCandidates = rankLearnedWritingAssets({
    assets: assets.filter((asset) => asset.assetType === "sentence"),
    promptTopics: promptSource.topics,
    semanticText: semanticContext,
    preferredArgumentFunctions: need.preferredArgumentFunctions,
    limit: 8,
    maxPerAssetType: 8,
  });
  const collocationCandidates = rankLearnedWritingAssets({
    assets: assets.filter((asset) => asset.assetType === "collocation"),
    promptTopics: promptSource.topics,
    semanticText: semanticContext,
    preferredArgumentFunctions: need.preferredArgumentFunctions,
    limit: 8,
    maxPerAssetType: 8,
  });
  const deterministicPrimary = sentenceCandidates.find((asset) => (
    asset.score >= 11
    && asset.sourceRelation === "same_prompt"
  ));
  const primaryAsset = deterministicPrimary
    ? { ...deterministicPrimary, recommendationReasonZh: introductionRecommendation(deterministicPrimary) }
    : null;
  const supportingExpressions = collocationCandidates
    .filter((asset) => semanticOverlapCount(asset.englishForm, semanticContext) > 0)
    .slice(0, 3);
  const partContent = input.learnerDraft?.trim() || (input.part === "thesis"
    ? workspace.context.essayPosition
    : workspace.context.prompt);
  const retrieval: IntroductionLanguageRetrievalView = {
    sourceEssayId: input.sourceEssayId,
    part: input.part,
    partContent,
    partNeed: { ...need, draftConsidered: Boolean(input.learnerDraft?.trim()) },
    pool: { approvedIntroductionSentences, approvedCoreExpressions, studiedIntroductionSentences, studiedCoreExpressions },
    assets: [primaryAsset, ...supportingExpressions].filter((asset): asset is LearnedWritingAsset => asset !== null),
    primaryAsset,
    supportingExpressions,
    noSuitableAsset: primaryAsset === null,
    noSuitableReasonZh: primaryAsset === null
      ? "已审核 IELTS 范文开头语料中没有足够贴合这一部分的句式。请直接用自己的英语表达，不必为了使用语料而硬套。"
      : null,
    selection: { mode: "deterministic", model: null, errorCode: null },
  };
  return { retrieval, candidates: [...sentenceCandidates.slice(0, 5), ...collocationCandidates.slice(0, 5)], semanticContext };
}

function selectionErrorCode(error: unknown) {
  if (error instanceof GuidedWritingProviderHttpError) return `PROVIDER_HTTP_${error.status}`;
  if (error instanceof SyntaxError) return "OUTPUT_PARSE_ERROR";
  if (error instanceof TypeError) return "PROVIDER_NETWORK_ERROR";
  if (error instanceof DOMException && error.name === "TimeoutError") return "MODEL_TIMEOUT";
  return "SELECTION_UNAVAILABLE";
}

export async function retrieveSelectedIntroductionWritingAssets(input: {
  connection: SqliteConnection;
  sourceEssayId: string;
  part: IntroductionLanguagePart;
  learnerDraft?: string;
  provider?: WritingAssetSelectorProvider | null;
}) {
  const prepared = prepareIntroductionWritingAssetSelection(input);
  const config = getGuidedWritingConfig();
  const provider = input.provider === undefined
    ? config.apiKey && config.model
      ? new DeepSeekWritingAssetSelector({ apiKey: config.apiKey, model: config.model })
      : null
    : input.provider;
  if (!provider || prepared.candidates.length === 0) return prepared.retrieval;

  const selectionInput: WritingAssetSelectionInputV1 = {
    schemaVersion: "guided-writing-asset-selection-input.v1",
    sessionId: `introduction:${input.sourceEssayId}`,
    node: input.part,
    nodePurposeZh: prepared.retrieval.partNeed.purposeZh,
    plannedMeaning: prepared.retrieval.partContent,
    semanticContext: prepared.semanticContext,
    candidates: prepared.candidates.map((candidate) => ({
      assetType: candidate.assetType,
      assetId: candidate.assetId,
      transferUnit: candidate.transferUnit,
      englishForm: candidate.englishForm,
      originalSentence: candidate.originalSentence,
      argumentFunctions: candidate.argumentFunctions,
      sourceRelation: candidate.sourceRelation,
      cueZh: candidate.cueZh,
    })),
  };
  try {
    const result = await provider.select(selectionInput, AbortSignal.timeout(config.timeoutMs));
    const validation = validateWritingAssetSelection(result.output, selectionInput);
    if (!validation.valid || validation.selection.needs_review || validation.selection.confidence < 0.7) {
      const errorCode = validation.valid ? "LOW_CONFIDENCE" : validation.errors.join("+");
      return { ...prepared.retrieval, selection: { mode: "fallback" as const, model: result.model, errorCode } };
    }
    const byId = new Map(prepared.candidates.map((candidate) => [candidate.assetId, candidate]));
    const primary = validation.selection.primary_asset_id
      ? byId.get(validation.selection.primary_asset_id) ?? null
      : null;
    const primaryAsset = primary?.assetType === "sentence"
      ? { ...primary, recommendationReasonZh: validation.selection.reason_zh }
      : null;
    const supportingExpressions = validation.selection.supporting_asset_ids
      .map((id) => byId.get(id))
      .filter((asset): asset is LearnedWritingAsset => asset?.assetType === "collocation")
      .slice(0, 3);
    return {
      ...prepared.retrieval,
      assets: [primaryAsset, ...supportingExpressions].filter((asset): asset is LearnedWritingAsset => asset !== null),
      primaryAsset,
      supportingExpressions,
      noSuitableAsset: primaryAsset === null,
      noSuitableReasonZh: primaryAsset === null ? validation.selection.reason_zh : null,
      selection: { mode: "deepseek" as const, model: result.model, errorCode: null },
    };
  } catch (error) {
    return {
      ...prepared.retrieval,
      selection: { mode: "fallback" as const, model: config.model, errorCode: selectionErrorCode(error) },
    };
  }
}
