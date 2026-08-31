import { z } from "zod";
import type { LearnedWritingAsset, WritingLanguageNode } from "./learned-expression-retrieval";
import type { IntroductionLanguagePart } from "./introduction-language-activation";

export const WRITING_ASSET_SELECTION_SCHEMA_VERSION = "guided-writing-asset-selection.v1" as const;
export const WRITING_ASSET_SELECTION_PROMPT_VERSION = "guided-writing-asset-selection-v1.1" as const;

export type WritingAssetSelectionInputV1 = {
  schemaVersion: "guided-writing-asset-selection-input.v1";
  sessionId: string;
  node: WritingLanguageNode | IntroductionLanguagePart;
  nodePurposeZh: string;
  plannedMeaning: string;
  semanticContext: string;
  candidates: Array<Pick<LearnedWritingAsset,
    "assetType" | "assetId" | "transferUnit" | "englishForm" | "originalSentence" |
    "argumentFunctions" | "sourceRelation" | "cueZh"
  >>;
};

const outputSchema = z.object({
  schema_version: z.literal(WRITING_ASSET_SELECTION_SCHEMA_VERSION),
  primary_asset_id: z.string().nullable(),
  supporting_asset_ids: z.array(z.string()).max(3),
  reason_zh: z.string().min(1).max(160),
  observation_zh: z.string().min(1).max(120).optional().default("当前表达已经承担了这个节点的基本任务。"),
  revision_direction_zh: z.string().min(1).max(160).optional().default("保留原意，优先提高表达的准确度与自然度。"),
  confidence: z.number().min(0).max(1),
  needs_review: z.boolean(),
}).strict();

export type WritingAssetSelectionV1 = z.infer<typeof outputSchema>;

export function validateWritingAssetSelection(value: unknown, input: WritingAssetSelectionInputV1) {
  const parsed = outputSchema.safeParse(value);
  if (!parsed.success) return {
    valid: false as const,
    errors: parsed.error.issues.map((issue) => `SCHEMA_${issue.path.join("_") || "root"}_${issue.code}`),
  };
  const output = parsed.data;
  const candidates = new Map(input.candidates.map((candidate) => [candidate.assetId, candidate]));
  const errors: string[] = [];
  if (output.primary_asset_id) {
    const primary = candidates.get(output.primary_asset_id);
    if (!primary) errors.push("PRIMARY_NOT_IN_CANDIDATES");
    else if (primary.assetType !== "sentence") errors.push("PRIMARY_MUST_BE_SENTENCE");
  }
  if (new Set(output.supporting_asset_ids).size !== output.supporting_asset_ids.length) {
    errors.push("SUPPORTING_IDS_NOT_UNIQUE");
  }
  for (const id of output.supporting_asset_ids) {
    const supporting = candidates.get(id);
    if (!supporting) errors.push("SUPPORTING_NOT_IN_CANDIDATES");
    else if (supporting.assetType !== "collocation") errors.push("SUPPORTING_MUST_BE_COLLOCATION");
  }
  if (output.primary_asset_id && output.supporting_asset_ids.includes(output.primary_asset_id)) {
    errors.push("PRIMARY_REPEATED_AS_SUPPORTING");
  }
  return errors.length ? { valid: false as const, errors } : { valid: true as const, selection: output };
}
