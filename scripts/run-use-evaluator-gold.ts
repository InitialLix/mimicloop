import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import nextEnv from "@next/env";
import { migrateDatabase, openDatabase } from "../src/db/client";
import { ContentRepository, loadApprovedCollocationSeed, loadSeedBundle } from "../src/db/content-repository";
import { UseEvaluationRepository } from "../src/db/use-evaluation-repository";
import {
  calculateUseEvaluationMetrics,
  diagnoseUseEvaluationCase,
  type UseEvaluationGoldExpectation,
} from "../src/domain/practice/use-evaluation-metrics";
import { getUseEvaluatorConfig } from "../src/lib/ai/config";
import { DeepSeekChatUseEvaluator } from "../src/lib/ai/use-evaluator-provider";
import { evaluateUseAttempt } from "../src/lib/use-evaluation-service";

type GoldFixture = {
  schema_version: string;
  review_status: "candidate" | "approved";
  cases: Array<{
    id: string;
    exercise_ref: string;
    answer: string;
    expected: UseEvaluationGoldExpectation;
  }>;
};

function stableAttemptId(value: string) {
  const bytes = Buffer.from(createHash("sha256").update(value).digest().subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function percentile(values: number[], quantile: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)];
}

nextEnv.loadEnvConfig(process.cwd());
const config = getUseEvaluatorConfig();
if (!config.apiKey || !config.model) {
  throw new Error("Set DEEPSEEK_API_KEY and MIMICLOOP_DEEPSEEK_MODEL before running the evaluator gold baseline.");
}

const fixtureFiles = [
  "use-evaluator-gold.approved.json",
  "use-evaluator-sentence.approved.json",
];
const fixtures = await Promise.all(fixtureFiles.map(async (file) => JSON.parse(
  await readFile(path.join(process.cwd(), "tests", "fixtures", file), "utf8"),
) as GoldFixture));
if (fixtures.some((fixture) => fixture.review_status !== "approved")) {
  throw new Error("Every gold fixture must be human-approved before a release baseline can run.");
}
const totalCases = fixtures.reduce((count, fixture) => count + fixture.cases.length, 0);
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "mimicloop-use-gold-"));
const connection = openDatabase(path.join(temporaryDirectory, "gold.db"));
try {
  migrateDatabase(connection);
  const content = new ContentRepository(connection);
  content.importSeeds(await loadSeedBundle());
  content.importApprovedCollocations(await loadApprovedCollocationSeed());
  const provider = new DeepSeekChatUseEvaluator({ apiKey: config.apiKey, model: config.model });
  const measured = [];
  const caseDiagnostics = [];
  const latencies: number[] = [];
  let inputTokens = 0;
  let outputTokens = 0;
  let fallbackCount = 0;

  for (const fixture of fixtures) {
    for (const goldCase of fixture.cases) {
      const attemptId = stableAttemptId(`${fixture.schema_version}:${goldCase.id}`);
      const started = performance.now();
      const result = await evaluateUseAttempt({
        connection,
        attemptId,
        exerciseRef: goldCase.exercise_ref,
        learnerAnswer: goldCase.answer,
        provider,
      });
      latencies.push(Math.round(performance.now() - started));
      if (result.status !== "evaluated") fallbackCount += 1;
      const repository = new UseEvaluationRepository(connection);
      const run = repository.get(attemptId);
      const trace = repository.getTrace(result.traceId);
      if (run?.errorCode?.startsWith("PROVIDER_HTTP_")) {
        throw new Error(`Baseline stopped at ${goldCase.id}: ${run.errorCode}. Check DeepSeek balance/service status before retrying.`);
      }
      inputTokens += trace?.inputTokens ?? 0;
      outputTokens += trace?.outputTokens ?? 0;
      measured.push({ expected: goldCase.expected, actual: run?.evaluation ?? null });
      caseDiagnostics.push({
        ...diagnoseUseEvaluationCase(goldCase.id, goldCase.expected, run?.evaluation ?? null),
        status: run?.status ?? "missing",
        errorCode: run?.errorCode ?? null,
        validationErrorCodes: Array.from(new Set(
          trace?.steps.flatMap((step) => step.errorCodes ?? []) ?? [],
        )),
      });

      await evaluateUseAttempt({
        connection,
        attemptId,
        exerciseRef: goldCase.exercise_ref,
        learnerAnswer: goldCase.answer,
        provider,
      });
    }
  }

  const duplicateRows = connection.sqlite.prepare("SELECT COUNT(*) AS count FROM use_evaluation_runs").get() as { count: number };
  console.log(JSON.stringify({
    fixtureStatus: "approved",
    fixtureCaseCounts: Object.fromEntries(fixtures.map((fixture, index) => [fixtureFiles[index], fixture.cases.length])),
    releaseEligible: true,
    provider: "deepseek",
    model: config.model,
    metrics: calculateUseEvaluationMetrics(measured),
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    fallbackRate: fallbackCount / totalCases,
    inputTokens,
    outputTokens,
    duplicateWriteRate: (duplicateRows.count - totalCases) / totalCases,
    diagnosticCases: caseDiagnostics.filter((item) => item.status !== "success" || !item.exact),
  }, null, 2));
} finally {
  connection.close();
  const resolved = path.resolve(temporaryDirectory);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to remove a non-temporary directory");
  await rm(resolved, { recursive: true, force: true });
}
