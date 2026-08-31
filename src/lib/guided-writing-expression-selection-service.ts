import type { SqliteConnection } from "../db/client";
import type { LearnedWritingAsset, WritingLanguageNode } from "../domain/writing/learned-expression-retrieval";
import {
  validateWritingAssetSelection,
  type WritingAssetSelectionInputV1,
} from "../domain/writing/writing-asset-selection";
import { getGuidedWritingConfig } from "./ai/config";
import { GuidedWritingProviderHttpError } from "./ai/guided-writing-provider";
import {
  DeepSeekWritingAssetSelector,
  type WritingAssetSelectorProvider,
} from "./ai/writing-asset-selector-provider";
import { prepareLearnedWritingAssetSelection } from "./guided-writing-expression-service";

export async function retrieveSelectedWritingAssets(input: {
  connection: SqliteConnection;
  sessionId: string;
  node: WritingLanguageNode;
  learnerDraft?: string;
  provider?: WritingAssetSelectorProvider | null;
}) {
  const prepared = prepareLearnedWritingAssetSelection(
    input.connection,
    input.sessionId,
    input.node,
    input.learnerDraft ?? "",
  );
  const config = getGuidedWritingConfig();
  const provider = input.provider === undefined
    ? config.apiKey && config.model
      ? new DeepSeekWritingAssetSelector({ apiKey: config.apiKey, model: config.model })
      : null
    : input.provider;
  if (!provider || prepared.candidates.length === 0) return prepared.retrieval;

  const selectionInput: WritingAssetSelectionInputV1 = {
    schemaVersion: "guided-writing-asset-selection-input.v1",
    sessionId: input.sessionId,
    node: input.node,
    nodePurposeZh: prepared.retrieval.nodeNeed.purposeZh,
    plannedMeaning: prepared.retrieval.nodeContent,
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
    if (!validation.valid) {
      return {
        ...prepared.retrieval,
        selection: { mode: "fallback" as const, model: result.model, errorCode: validation.errors.join("+") },
      };
    }
    if (validation.selection.needs_review || validation.selection.confidence < 0.7) {
      return {
        ...prepared.retrieval,
        selection: { mode: "fallback" as const, model: result.model, errorCode: "LOW_CONFIDENCE" },
      };
    }
    const byId = new Map(prepared.candidates.map((candidate) => [candidate.assetId, candidate]));
    const primaryAsset = validation.selection.primary_asset_id
      ? byId.get(validation.selection.primary_asset_id) ?? null
      : null;
    const supportingExpressions = validation.selection.supporting_asset_ids
      .map((id) => byId.get(id))
      .filter((candidate): candidate is LearnedWritingAsset => candidate?.assetType === "collocation")
      .slice(0, 3);
    const selectedPrimary = primaryAsset
      ? { ...primaryAsset, recommendationReasonZh: validation.selection.reason_zh }
      : null;
    return {
      ...prepared.retrieval,
      wordingObservationZh: validation.selection.observation_zh,
      revisionDirectionZh: validation.selection.revision_direction_zh,
      assets: [selectedPrimary, ...supportingExpressions].filter((asset) => asset !== null),
      primaryAsset: selectedPrimary,
      supportingExpressions,
      noSuitableAsset: selectedPrimary === null,
      noSuitableReasonZh: selectedPrimary === null
        ? supportingExpressions.length
          ? `${validation.selection.reason_zh} 仍可按需使用下方局部搭配。`
          : validation.selection.reason_zh
        : null,
      selection: { mode: "deepseek" as const, model: result.model, errorCode: null },
    };
  } catch (error) {
    const errorCode = error instanceof GuidedWritingProviderHttpError
      ? `PROVIDER_HTTP_${error.status}`
      : error instanceof SyntaxError
        ? "OUTPUT_PARSE_ERROR"
        : error instanceof TypeError
          ? "PROVIDER_NETWORK_ERROR"
          : error instanceof DOMException && error.name === "TimeoutError"
            ? "MODEL_TIMEOUT"
            : "SELECTION_UNAVAILABLE";
    return {
      ...prepared.retrieval,
      selection: { mode: "fallback" as const, model: config.model, errorCode },
    };
  }
}
