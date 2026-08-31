import { ContentRepository } from "../db/content-repository";
import { GuidedWritingRepository } from "../db/guided-writing-repository";
import type { SqliteConnection } from "../db/client";
import {
  languageNeedForNode,
  layerWritingAssets,
  rankLearnedWritingAssets,
  transferGuidanceForUnit,
  transferUnitForKind,
  type LearnedWritingAsset,
  type LearnedWritingAssetInput,
  type LearnedWritingRetrievalView,
  type WritingLanguageNode,
} from "../domain/writing/learned-expression-retrieval";
import type { CollocationData, SentenceCardData, SourceEssayData } from "./content-types";
import { GuidedWritingRequestError } from "./guided-writing-service";

type ProgressRow = { id: string; stage: "new" | "learned" | "recall" | "use" };

function deterministicWordingGuidance(node: WritingLanguageNode) {
  if (node === "claim") return {
    observationZh: "这句话已经提出了本段要展开的中心主张。",
    directionZh: "保留一个中心判断，优先减少重复表达；原因、过程和结果留给后续节点。",
  };
  if (node === "reason") return {
    observationZh: "这句话已经给出了支撑 Main point 的依据。",
    directionZh: "把依据说得具体而克制，避免重复 Main point 或提前写最终结果。",
  };
  if (node === "mechanism") return {
    observationZh: "这句话已经尝试补出原因产生影响的中间过程。",
    directionZh: "优先说清前后变化怎样发生，不要再次复述 Reason。",
  };
  return {
    observationZh: "这句话已经尝试收束前面的论证结果。",
    directionZh: "只保留前文已经证明的结论，并检查语法、拼写和表达自然度。",
  };
}

export function prepareLearnedWritingAssetSelection(
  connection: SqliteConnection,
  sessionId: string,
  node: WritingLanguageNode,
  learnerDraft = "",
): { retrieval: LearnedWritingRetrievalView; candidates: LearnedWritingAsset[]; semanticContext: string } {
  const sessionRepository = new GuidedWritingRepository(connection);
  const session = sessionRepository.getSession(sessionId);
  if (!session) throw new GuidedWritingRequestError("找不到这次写作练习。", 404, "SESSION_NOT_FOUND");
  if (session.status !== "ready_to_draft") {
    throw new GuidedWritingRequestError("请先完成并复检论证链。", 409, "ARGUMENT_NOT_READY");
  }
  const sessionView = sessionRepository.view(sessionId)!;
  const plannedNode = session.graph[node];
  if (!plannedNode) throw new GuidedWritingRequestError("这个论证节点尚未完成。", 409, "NODE_NOT_READY");
  const nodeNeed = languageNeedForNode(node, sessionView.developmentRelation);

  const content = new ContentRepository(connection);
  const cards = content.listCards() as unknown as SentenceCardData[];
  const collocations = content.listCollocations() as unknown as CollocationData[];
  const sources = content.listSources() as unknown as SourceEssayData[];
  const sourceTitles = new Map(sources.map((source) => [source.id, source.title]));
  const promptSource = sources.find((source) => source.id === session.sourceEssayId);
  if (!promptSource) throw new GuidedWritingRequestError("找不到这道已归档题目。", 404, "SOURCE_NOT_FOUND");

  const sentenceProgress = new Map((connection.sqlite.prepare(
    "SELECT card_id AS id, learning_stage AS stage FROM review_states",
  ).all() as ProgressRow[]).map((row) => [row.id, row.stage]));
  const collocationProgress = new Map((connection.sqlite.prepare(
    "SELECT collocation_id AS id, learning_stage AS stage FROM collocation_progress",
  ).all() as ProgressRow[]).map((row) => [row.id, row.stage]));

  const assets: LearnedWritingAssetInput[] = [];
  let approvedSentences = 0;
  let studiedSentences = 0;
  for (const card of cards) {
    if (card.content_status !== "approved") continue;
    approvedSentences += 1;
    const stage = sentenceProgress.get(card.id) ?? "new";
    if (stage !== "new") studiedSentences += 1;
    const firstChunk = card.chunks.find((chunk) => chunk.text.trim() && chunk.meaning_zh.trim());
    if (!card.pattern && !firstChunk) continue;
    const sourceRelation = card.source_essay_id === session.sourceEssayId ? "same_prompt" as const : "cross_topic" as const;
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
      sourceRelation,
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
    const samePrompt = collocation.source_links.some((link) => link.source_essay_id === session.sourceEssayId);
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

  const semanticContext = node === "claim"
    ? [session.graph.claim?.content]
    : node === "reason"
      ? [session.graph.claim?.content, session.graph.reason?.content]
      : node === "mechanism"
        ? [session.graph.claim?.content, session.graph.reason?.content, session.graph.mechanism?.content]
        : [session.graph.claim?.content, session.graph.mechanism?.content, session.graph.result?.content];
  const semanticText = [...semanticContext, learnerDraft.trim()].filter(Boolean).join(" ");
  const layered = layerWritingAssets({
    assets,
    promptTopics: promptSource.topics,
    semanticText,
    preferredArgumentFunctions: nodeNeed.preferredArgumentFunctions,
  });
  const { primaryAsset, supportingExpressions } = layered;
  const structureCandidates = rankLearnedWritingAssets({
    assets: assets.filter((asset) => asset.assetType === "sentence"),
    promptTopics: promptSource.topics,
    semanticText,
    preferredArgumentFunctions: nodeNeed.preferredArgumentFunctions,
    limit: 12,
    maxPerAssetType: 12,
  });
  const collocationCandidates = rankLearnedWritingAssets({
    assets: assets.filter((asset) => asset.assetType === "collocation"),
    promptTopics: promptSource.topics,
    semanticText,
    preferredArgumentFunctions: nodeNeed.preferredArgumentFunctions,
    allowFunctionNeutral: true,
    requireSemanticOverlap: true,
    limit: 4,
    maxPerAssetType: 4,
  });
  const wordingGuidance = deterministicWordingGuidance(node);

  const retrieval: LearnedWritingRetrievalView = {
    sessionId,
    node,
    nodeContent: plannedNode.content,
    draftTextConsidered: learnerDraft.trim() || plannedNode.content,
    nodeNeed: {
      ...nodeNeed,
      draftConsidered: Boolean(learnerDraft.trim()),
    },
    wordingObservationZh: wordingGuidance.observationZh,
    revisionDirectionZh: wordingGuidance.directionZh,
    pool: { approvedSentences, approvedCoreExpressions, studiedSentences, studiedCoreExpressions },
    assets: layered.assets,
    primaryAsset,
    supportingExpressions,
    noSuitableAsset: primaryAsset === null,
    noSuitableReasonZh: primaryAsset === null
      ? supportingExpressions.length
        ? "没有足够贴合的完整句型，但语料库中有可用于当前表达的局部搭配。"
        : "正式语料库里没有足够贴合这个节点的完整句型或局部表达。清楚地用自己的英语写，比勉强套用结构更好。"
      : null,
    selection: { mode: "deterministic", model: null, errorCode: null },
  };
  return { retrieval, candidates: [...structureCandidates, ...collocationCandidates], semanticContext: semanticText };
}

export function retrieveLearnedWritingAssets(
  connection: SqliteConnection,
  sessionId: string,
  node: WritingLanguageNode,
  learnerDraft = "",
): LearnedWritingRetrievalView {
  return prepareLearnedWritingAssetSelection(connection, sessionId, node, learnerDraft).retrieval;
}
