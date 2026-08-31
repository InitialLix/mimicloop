import type { UseEvaluationV1 } from "./use-evaluation";

export type UseEvaluationGoldExpectation = {
  verdict: UseEvaluationV1["verdict"];
  meaning: UseEvaluationV1["dimensions"]["meaning"];
  target_expression: UseEvaluationV1["dimensions"]["target_expression"];
  grammar: UseEvaluationV1["dimensions"]["grammar"];
  collocation: UseEvaluationV1["dimensions"]["collocation"];
  blocking: string[];
  non_blocking?: string[];
};

export type UseEvaluationMeasuredCase = {
  expected: UseEvaluationGoldExpectation;
  actual: UseEvaluationV1 | null;
};

export function diagnoseUseEvaluationCase(
  id: string,
  expected: UseEvaluationGoldExpectation,
  actual: UseEvaluationV1 | null,
) {
  if (!actual) return {
    id,
    exact: false,
    expected,
    actual: null,
    mismatches: ["no_valid_evaluation"],
  };

  const dimensions = ["meaning", "target_expression", "grammar", "collocation"] as const;
  const actualBlocking = actual.errors
    .filter((error) => error.severity === "blocking")
    .map((error) => error.type)
    .sort();
  const expectedBlocking = [...expected.blocking].sort();
  const actualNonBlocking = actual.errors
    .filter((error) => error.severity === "non_blocking")
    .map((error) => error.type)
    .sort();
  const expectedNonBlocking = expected.non_blocking ? [...expected.non_blocking].sort() : null;
  const mismatches = [
    ...(actual.verdict === expected.verdict ? [] : [`verdict:${expected.verdict}->${actual.verdict}`]),
    ...dimensions.flatMap((dimension) => actual.dimensions[dimension] === expected[dimension]
      ? []
      : [`${dimension}:${expected[dimension]}->${actual.dimensions[dimension]}`]),
    ...(sameSet(expectedBlocking, actualBlocking)
      ? []
      : [`blocking:[${expectedBlocking.join(",")}]->[${actualBlocking.join(",")}]`]),
    ...(expectedNonBlocking === null || sameSet(expectedNonBlocking, actualNonBlocking)
      ? []
      : [`non_blocking:[${expectedNonBlocking.join(",")}]->[${actualNonBlocking.join(",")}]`]),
  ];

  return {
    id,
    exact: mismatches.length === 0,
    expected,
    actual: {
      verdict: actual.verdict,
      ...actual.dimensions,
      blocking: actualBlocking,
      non_blocking: actualNonBlocking,
      confidence: actual.confidence,
      needs_review: actual.needs_review,
    },
    mismatches,
  };
}

function ratio(numerator: number, denominator: number) {
  return denominator === 0 ? null : numerator / denominator;
}

function sameSet(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return leftSet.size === rightSet.size && [...leftSet].every((value) => rightSet.has(value));
}

export function calculateUseEvaluationMetrics(cases: UseEvaluationMeasuredCase[]) {
  const valid = cases.filter((item) => item.actual !== null);
  const dimensions = ["meaning", "target_expression", "grammar", "collocation"] as const;
  const exact = valid.filter(({ expected, actual }) => {
    if (!actual || actual.verdict !== expected.verdict) return false;
    const actualBlocking = actual.errors.filter((error) => error.severity === "blocking").map((error) => error.type);
    const actualNonBlocking = actual.errors.filter((error) => error.severity === "non_blocking").map((error) => error.type);
    return dimensions.every((dimension) => actual.dimensions[dimension] === expected[dimension])
      && sameSet(expected.blocking, actualBlocking)
      && (!expected.non_blocking || sameSet(expected.non_blocking, actualNonBlocking));
  }).length;
  const expectedPasses = cases.filter((item) => item.expected.verdict === "pass");
  const expectedNonPasses = cases.filter((item) => item.expected.verdict !== "pass");
  const falsePasses = expectedNonPasses.filter((item) => item.actual?.verdict === "pass").length;
  const falseFails = expectedPasses.filter((item) => item.actual !== null && item.actual.verdict !== "pass").length;
  const expectedBlocking = cases.filter((item) => item.expected.blocking.length > 0);
  const expectedEvaluableBlocking = expectedBlocking.filter((item) => item.expected.verdict !== "cannot_judge");
  const predictedBlocking = valid.filter((item) => item.actual!.errors.some((error) => error.severity === "blocking"));
  const trueBlocking = predictedBlocking.filter((item) => item.expected.blocking.length > 0).length;
  const trueEvaluableBlocking = expectedEvaluableBlocking.filter(
    (item) => item.actual?.errors.some((error) => error.severity === "blocking"),
  ).length;

  return {
    total: cases.length,
    valid: valid.length,
    schemaValidRate: ratio(valid.length, cases.length),
    verdictAgreement: ratio(
      valid.filter((item) => item.actual!.verdict === item.expected.verdict).length,
      cases.length,
    ),
    exactAgreement: ratio(exact, cases.length),
    dimensionAgreement: Object.fromEntries(dimensions.map((dimension) => [
      dimension,
      ratio(valid.filter((item) => item.actual!.dimensions[dimension] === item.expected[dimension]).length, cases.length),
    ])) as Record<typeof dimensions[number], number | null>,
    falsePassRate: ratio(falsePasses, expectedNonPasses.length),
    falseFailRate: ratio(falseFails, expectedPasses.length),
    blockingPrecision: ratio(trueBlocking, predictedBlocking.length),
    blockingRecall: ratio(trueBlocking, expectedBlocking.length),
    blockingRecallEvaluable: ratio(trueEvaluableBlocking, expectedEvaluableBlocking.length),
  };
}
