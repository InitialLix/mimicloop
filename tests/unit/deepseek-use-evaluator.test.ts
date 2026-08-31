import { describe, expect, it, vi } from "vitest";
import type { UseEvaluationInputV1, UseEvaluationV1 } from "../../src/domain/practice/use-evaluation";
import {
  DeepSeekChatUseEvaluator,
  UseEvaluatorProviderHttpError,
} from "../../src/lib/ai/use-evaluator-provider";

const input = {
  schemaVersion: "use-eval-input.v1",
  attemptId: "da09c380-d9d9-4a4b-a2d1-e3aa3bd749fe",
  exercise: {
    id: "collocation:421dc97f-3440-52a7-97a8-256046b4c319:guided_application:5",
    exerciseType: "collocation_use",
    instructionZh: "写英文。",
    intendedMeaningZh: "政府有理由推迟决定。",
    targetAsset: {
      id: "421dc97f-3440-52a7-97a8-256046b4c319",
      type: "collocation",
      canonicalText: "a compelling reason",
    },
    referenceAnswers: ["The government has a compelling reason to delay the decision."],
    allowedParaphrase: true,
  },
  learnerAnswer: "The government has a compelling reason to delay the decision.",
} satisfies UseEvaluationInputV1;

const evaluation: UseEvaluationV1 = {
  schema_version: "use-eval.v1",
  attempt_id: input.attemptId,
  verdict: "pass",
  dimensions: { meaning: "complete", target_expression: "natural", grammar: "ok", collocation: "natural" },
  errors: [],
  positive_evidence: [{ type: "target_expression", span: "a compelling reason", message_zh: "搭配自然。" }],
  minimal_hint: null,
  confidence: 0.96,
  needs_review: false,
};

describe("DeepSeek Chat Use evaluator adapter", () => {
  it("uses non-thinking JSON mode and returns provider metadata", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe("https://api.deepseek.com/chat/completions");
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-key");
      const serializedBody = String(init?.body);
      expect(serializedBody).not.toContain("test-key");
      const body = JSON.parse(serializedBody);
      expect(body).toMatchObject({
        model: "deepseek-v4-flash",
        stream: false,
        thinking: { type: "disabled" },
        temperature: 0,
        response_format: { type: "json_object" },
        max_tokens: 1200,
      });
      expect(body.messages[0].content).toContain("Return JSON only");
      expect(body.messages[0].content).toContain("use-eval.v1");
      expect(body.messages[0].content).toContain(input.attemptId);
      expect(body.messages[0].content).toContain("wrong preposition");
      expect(body.messages[0].content).toContain("One isolated subject-verb agreement");
      expect(body.messages[0].content).toContain("Before setting grammar=ok");
      expect(body.messages[0].content).toContain("The government have a compelling reason");
      expect(body.messages[0].content).toContain("matching non_blocking grammar/typo/spelling entry");
      expect(body.messages[0].content).toContain("no additional properties");
      expect(body.messages[0].content).toContain("Set every error and positive_evidence span to null");
      expect(body.messages[0].content).toContain("Do not create two blocking errors for one root cause");
      expect(body.messages[0].content).toContain("For sentence_pattern targets");
      expect(body.messages[0].content).toContain("never require placeholder names");
      expect(body.messages[0].content).toContain("a host of practical benefit");
      expect(body.messages[0].content).toContain("meaning=complete and verdict=retry");
      expect(body.messages[0].content).toContain("For stand out in a competitive job market");
      expect(body.messages[0].content).toContain("linnked in part to");
      expect(body.messages[0].content).toContain("simulationr");
      expect(body.messages[0].content).toContain("Distinguish mechanical typo from spelling uncertainty");
      expect(body.messages[0].content).toContain("Never call singular/plural choice");
      expect(body.messages[1]).toEqual({ role: "user", content: JSON.stringify(input) });
      return new Response(JSON.stringify({
        model: "deepseek-v4-flash",
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(evaluation) } }],
        usage: { prompt_tokens: 180, completion_tokens: 90 },
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const provider = new DeepSeekChatUseEvaluator({ apiKey: "test-key", model: "deepseek-v4-flash", fetchImpl });
    const result = await provider.evaluate(input, new AbortController().signal);
    expect(result.output).toEqual({
      ...evaluation,
      positive_evidence: [{ ...evaluation.positive_evidence[0], span: null }],
    });
    expect(result).toMatchObject({
      provider: "deepseek",
      model: "deepseek-v4-flash",
      inputTokens: 180,
      outputTokens: 90,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects truncated or empty JSON before local evaluation validation", async () => {
    const truncated = new DeepSeekChatUseEvaluator({
      apiKey: "test-key",
      model: "deepseek-v4-flash",
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({
        choices: [{ finish_reason: "length", message: { content: "{" } }],
      }), { status: 200 })),
    });
    await expect(truncated.evaluate(input, new AbortController().signal)).rejects.toBeInstanceOf(SyntaxError);
  });

  it("restores the trusted attempt ID and normalizes a non-blocking minor-error retry to pass", async () => {
    const providerOutput = {
      ...evaluation,
      attempt_id: "00000000-0000-4000-8000-000000000000",
      verdict: "retry" as const,
      dimensions: {
        ...evaluation.dimensions,
        target_expression: "used_with_error" as const,
        grammar: "minor_issue" as const,
      },
      errors: [{
        type: "typo" as const,
        severity: "non_blocking" as const,
        span: "fabricated location",
        message_zh: "有一处局部语法错误。",
      }],
      minimal_hint: { kind: "retry_instruction" as const, text_zh: "请修改。" },
    };
    const provider = new DeepSeekChatUseEvaluator({
      apiKey: "test-key",
      model: "deepseek-v4-flash",
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({
        model: "deepseek-v4-flash",
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(providerOutput) } }],
      }), { status: 200 })),
    });

    const result = await provider.evaluate(input, new AbortController().signal);
    expect(result.output).toMatchObject({
      attempt_id: input.attemptId,
      verdict: "pass",
      dimensions: { target_expression: "natural", grammar: "minor_issue" },
      minimal_hint: null,
      needs_review: false,
      errors: [{ severity: "non_blocking", span: null }],
    });
  });

  it("reports only a sanitized HTTP status for provider account errors", async () => {
    const provider = new DeepSeekChatUseEvaluator({
      apiKey: "test-key",
      model: "deepseek-v4-flash",
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({
        error: { message: "sensitive provider detail" },
      }), { status: 402 })),
    });
    const result = provider.evaluate(input, new AbortController().signal);
    await expect(result).rejects.toBeInstanceOf(UseEvaluatorProviderHttpError);
    await expect(result).rejects.toMatchObject({ status: 402, message: "DeepSeek request failed with HTTP 402" });
  });
});
