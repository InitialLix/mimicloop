import type { UseEvaluationV1 } from "../practice/use-evaluation";

export type CorrectionObservationV1 = Pick<UseEvaluationV1, "verdict" | "errors">;

export type CorrectionPathV1 = {
  kind: "none" | "typo_only" | "minor_surface" | "substantive" | "unresolved";
  correctionCount: number;
};

export const NO_CORRECTION_PATH: CorrectionPathV1 = {
  kind: "none",
  correctionCount: 0,
};

export function summarizeCorrectionPath(
  history: CorrectionObservationV1[],
): CorrectionPathV1 {
  if (history.length <= 1) return NO_CORRECTION_PATH;

  const correctionCount = history.length - 1;
  const final = history.at(-1)!;
  if (final.verdict !== "pass") return { kind: "unresolved", correctionCount };

  const prior = history.slice(0, -1);
  if (prior.every((item) => (
    item.verdict === "pass"
    && item.errors.length > 0
    && item.errors.every((error) => error.type === "typo" && error.severity === "non_blocking")
  ))) {
    return { kind: "typo_only", correctionCount };
  }

  if (prior.length === 1
    && prior[0]!.verdict === "pass"
    && prior[0]!.errors.length === 1
    && prior[0]!.errors[0]!.severity === "non_blocking"
    && (prior[0]!.errors[0]!.type === "grammar" || prior[0]!.errors[0]!.type === "spelling")) {
    return { kind: "minor_surface", correctionCount };
  }

  return { kind: "substantive", correctionCount };
}
