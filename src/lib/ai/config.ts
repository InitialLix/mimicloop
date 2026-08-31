export type UseEvaluatorConfig = {
  enabled: boolean;
  provider: "deepseek";
  apiKey: string | null;
  model: string | null;
  timeoutMs: number;
  confidenceThreshold: number;
};

export type GuidedWritingConfig = {
  enabled: boolean;
  provider: "deepseek";
  apiKey: string | null;
  model: string | null;
  timeoutMs: number;
};

function boundedNumber(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

export function getUseEvaluatorConfig(): UseEvaluatorConfig {
  return {
    enabled: process.env.MIMICLOOP_USE_EVALUATOR_ENABLED === "true",
    provider: "deepseek",
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() || null,
    model: process.env.MIMICLOOP_DEEPSEEK_MODEL?.trim() || null,
    timeoutMs: boundedNumber(process.env.MIMICLOOP_AI_TIMEOUT_MS, 8_000, 1_000, 30_000),
    confidenceThreshold: boundedNumber(process.env.MIMICLOOP_USE_EVALUATOR_CONFIDENCE, 0.65, 0, 1),
  };
}

export function isUseEvaluatorEnabled() {
  return getUseEvaluatorConfig().enabled;
}

export function getGuidedWritingConfig(): GuidedWritingConfig {
  const explicitFlag = process.env.MIMICLOOP_GUIDED_WRITING_ENABLED;
  return {
    enabled: explicitFlag === undefined
      ? process.env.MIMICLOOP_USE_EVALUATOR_ENABLED === "true"
      : explicitFlag === "true",
    provider: "deepseek",
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() || null,
    model: process.env.MIMICLOOP_DEEPSEEK_MODEL?.trim() || null,
    timeoutMs: boundedNumber(process.env.MIMICLOOP_AI_TIMEOUT_MS, 8_000, 1_000, 30_000),
  };
}
