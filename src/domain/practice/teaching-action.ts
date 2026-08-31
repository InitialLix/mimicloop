import type { UseEvaluationFeedback, UseEvaluationV1 } from "./use-evaluation";

export const MAX_USE_RETRIES = 2;

export type TeachingActionV1 =
  | { type: "PASS" }
  | { type: "RETRY" }
  | { type: "GIVE_MINIMAL_HINT"; hint: NonNullable<UseEvaluationV1["minimal_hint"]> }
  | { type: "SHOW_REFERENCE" };

export function referenceRevealUsesAssistance(
  teachingAction: TeachingActionV1 | null,
  assistanceAlreadyUsed: boolean,
) {
  return assistanceAlreadyUsed || teachingAction?.type !== "PASS";
}

export function recallReferenceUsesAssistance(
  action: "reveal_after_answer" | "continue_editing",
  assistanceAlreadyUsed: boolean,
) {
  return assistanceAlreadyUsed || action === "continue_editing";
}

export function revisionTreatment(feedback: UseEvaluationFeedback | null) {
  const isMechanicalTypo = feedback?.typoOnly === true;
  return {
    countsAsAssistance: !isMechanicalTypo,
    continuesRetryChain: !isMechanicalTypo,
    draftMode: isMechanicalTypo ? "typo" as const : "revision" as const,
  };
}

function normalizedHint(hint: NonNullable<UseEvaluationV1["minimal_hint"]>) {
  return `${hint.kind}:${hint.text_zh.trim().replace(/\s+/g, " ").toLocaleLowerCase("zh-CN")}`;
}

export function selectTeachingAction(input: {
  evaluation: UseEvaluationV1 | null;
  retryIndex: number;
  previousHints?: Array<NonNullable<UseEvaluationV1["minimal_hint"]>>;
}): TeachingActionV1 {
  const { evaluation, retryIndex, previousHints = [] } = input;
  if (!evaluation || evaluation.verdict === "cannot_judge") return { type: "SHOW_REFERENCE" };
  if (evaluation.verdict === "pass") return { type: "PASS" };
  if (retryIndex >= MAX_USE_RETRIES) return { type: "SHOW_REFERENCE" };

  if (evaluation.minimal_hint) {
    const seen = new Set(previousHints.map(normalizedHint));
    if (!seen.has(normalizedHint(evaluation.minimal_hint))) {
      return { type: "GIVE_MINIMAL_HINT", hint: evaluation.minimal_hint };
    }
  }
  return { type: "RETRY" };
}
