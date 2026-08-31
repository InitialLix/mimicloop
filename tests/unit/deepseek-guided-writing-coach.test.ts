import { describe, expect, it, vi } from "vitest";
import {
  emptyArgumentGraph,
  questionForNode,
  type GuidedWritingChainReviewInputV1,
  type GuidedWritingCoachInputV1,
} from "../../src/domain/writing/guided-writing-coach";
import type { GuidedWritingParagraphInputV1 } from "../../src/domain/writing/paragraph-evaluation";
import { task2Topics } from "../../src/domain/writing/imported-task2-prompt";
import {
  DeepSeekGuidedWritingCoach,
  GuidedWritingProviderHttpError,
} from "../../src/lib/ai/guided-writing-provider";

const input: GuidedWritingCoachInputV1 = {
  schemaVersion: "guided-writing-coach-input.v1",
  sessionId: "a74c9c18-4a60-4df4-84f5-87705df158ad",
  turnId: "1fed4bf0-f3e2-48aa-bd55-799df0a2fc72",
  prompt: {
    sourceEssayId: "0bbea91d-c006-5f3f-a74e-6b51761cfa01",
    text: "Businesses have social responsibilities. To what extent do you agree or disagree?",
    questionType: "opinion",
    requiredParts: ["State a position"],
    scopeMarkers: ["to what extent"],
  },
  paragraph: { key: "body_1", role: "Support the position", goal: "Develop one reason." },
  currentNode: "stance",
  developmentRelation: null,
  graph: emptyArgumentGraph(),
  questionEn: questionForNode("stance"),
  learnerAnswer: "I agree that businesses should contribute to society.",
};

describe("DeepSeek Guided Writing coach adapter", () => {
  it("keeps the key in the header and explicitly forbids ghostwriting", async () => {
    const output = {
      schema_version: "guided-writing-coach.v1.2",
      turn_id: input.turnId,
      verdict: "accept",
      dimensions: { relevance: "direct", logic: "clear", specificity: "sufficient" },
      issue_type: null,
      development_relation: null,
      accepted_span: input.learnerAnswer,
      forward_span: null,
      feedback_en: "This gives a clear position for the essay.",
      confidence: 0.91,
      needs_review: false,
    };
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-key");
      const serialized = String(init?.body);
      expect(serialized).not.toContain("test-key");
      const body = JSON.parse(serialized);
      expect(body).toMatchObject({
        model: "deepseek-v4-flash",
        thinking: { type: "disabled" },
        temperature: 0,
        response_format: { type: "json_object" },
      });
      expect(body.messages[0].content).toContain("Do not write, rewrite, complete, improve");
      expect(body.messages[0].content).toContain("Accept simple or imperfect English");
      expect(body.messages[0].content).toContain("When currentNode=stance, never demand a reason");
      expect(body.messages[0].content).toContain("judge the answer against paragraph.role and paragraph.goal");
      expect(body.messages[0].content).toContain("the paragraph may fairly explain a view the learner rejects");
      expect(body.messages[0].content).toContain("does not need to endorse or refute it at this node");
      expect(body.messages[0].content).toContain("do not assume every argument is a physical cause-and-effect chain");
      expect(body.messages[0].content).toContain("classify development_relation using exactly one of");
      expect(body.messages[0].content).toContain("a fact, principle or condition");
      expect(body.messages[0].content).toContain("preserve input.developmentRelation");
      expect(body.messages[0].content).toContain("accepted_span must be an exact non-empty substring");
      expect(body.messages[0].content).toContain("immediate next node");
      expect(body.messages[0].content).toContain("never require a rebuttal or a return to the learner's preferred view");
      expect(body.messages[1]).toEqual({ role: "user", content: JSON.stringify(input) });
      return new Response(JSON.stringify({
        model: "deepseek-v4-flash",
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }],
        usage: { prompt_tokens: 210, completion_tokens: 70 },
      }), { status: 200 });
    });
    const result = await new DeepSeekGuidedWritingCoach({
      apiKey: "test-key", model: "deepseek-v4-flash", fetchImpl,
    }).evaluate(input, new AbortController().signal);
    expect(result).toMatchObject({ output, provider: "deepseek", model: "deepseek-v4-flash", inputTokens: 210 });
  });

  it("sanitizes provider account errors", async () => {
    const provider = new DeepSeekGuidedWritingCoach({
      apiKey: "test-key",
      model: "deepseek-v4-flash",
      fetchImpl: vi.fn(async () => new Response("sensitive detail", { status: 402 })),
    });
    await expect(provider.evaluate(input, new AbortController().signal)).rejects.toBeInstanceOf(GuidedWritingProviderHttpError);
    await expect(provider.evaluate(input, new AbortController().signal)).rejects.toMatchObject({ status: 402 });
  });

  it("reviews the complete learner-owned chain without requesting replacement content", async () => {
    const chainInput: GuidedWritingChainReviewInputV1 = {
      schemaVersion: "guided-writing-chain-review-input.v1",
      sessionId: input.sessionId,
      turnId: input.turnId,
      prompt: input.prompt,
      paragraph: input.paragraph,
      developmentRelation: "principle_application",
      graph: Object.fromEntries(["stance", "claim", "reason", "mechanism", "result"].map((node, index) => [node, {
        content: `Learner-owned ${node}`,
        origin: "user_after_question",
        turnId: `00000000-0000-4000-8000-00000000000${index}`,
      }])) as GuidedWritingChainReviewInputV1["graph"],
    };
    const output = {
      schema_version: "guided-writing-chain-review.v1",
      turn_id: input.turnId,
      verdict: "return_to_node",
      return_to_node: "mechanism",
      reason_code: "development_gap",
      feedback_en: "The development does not yet connect the reason to the claim.",
      confidence: 0.9,
      needs_review: false,
    };
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const serialized = String(init?.body);
      expect(serialized).not.toContain("test-key");
      const body = JSON.parse(serialized);
      expect(body.messages[0].content).toContain("one read-only coherence review");
      expect(body.messages[0].content).toContain("return the earliest node");
      expect(body.messages[0].content).toContain("Do not write, rewrite, improve");
      expect(body.messages[1]).toEqual({ role: "user", content: JSON.stringify(chainInput) });
      return new Response(JSON.stringify({
        model: "deepseek-v4-flash",
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }],
        usage: { prompt_tokens: 260, completion_tokens: 55 },
      }), { status: 200 });
    });
    const result = await new DeepSeekGuidedWritingCoach({
      apiKey: "test-key", model: "deepseek-v4-flash", fetchImpl,
    }).reviewChain(chainInput, new AbortController().signal);
    expect(result).toMatchObject({
      output,
      promptVersion: "guided-writing-chain-review-v1.1",
      schemaVersion: "guided-writing-chain-review.v1",
    });
  });

  it("evaluates a learner paragraph on separate logic and language axes without exposing the key", async () => {
    const paragraphInput: GuidedWritingParagraphInputV1 = {
      schemaVersion: "guided-writing-paragraph-input.v1",
      sessionId: input.sessionId,
      draftId: input.turnId,
      prompt: input.prompt,
      paragraph: input.paragraph,
      argumentGraph: Object.fromEntries(["stance", "claim", "reason", "mechanism", "result"].map((node, index) => [node, {
        content: `Learner-owned ${node}`,
        origin: "user_after_question",
        turnId: `00000000-0000-4000-8000-00000000000${index}`,
      }])) as GuidedWritingParagraphInputV1["argumentGraph"],
      draftText: "Companies affect wider society, so they should consider social costs as well as profit.",
    };
    const output = {
      schema_version: "guided-writing-paragraph-evaluation.v1",
      draft_id: paragraphInput.draftId,
      logic: {
        status: "clear", strength_en: "The paragraph stays focused.", issue_type: null,
        evidence_span: null, feedback_en: "The reasoning follows the saved argument chain.",
      },
      language: {
        status: "clear", strength_en: "The meaning is expressed naturally.", issue_type: null,
        severity: null, evidence_span: null, feedback_en: "No priority language problem blocks this paragraph.",
      },
      confidence: 0.91,
      needs_review: false,
    };
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-key");
      const serialized = String(init?.body);
      expect(serialized).not.toContain("test-key");
      const body = JSON.parse(serialized);
      expect(body.messages[0].content).toContain("Evaluate logic and language separately");
      expect(body.messages[0].content).toContain("Do not estimate an IELTS Band score");
      expect(body.messages[0].content).toContain("Do not write or rewrite the paragraph");
      expect(body.messages[1]).toEqual({ role: "user", content: JSON.stringify(paragraphInput) });
      return new Response(JSON.stringify({
        model: "deepseek-v4-flash",
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }],
        usage: { prompt_tokens: 280, completion_tokens: 80 },
      }), { status: 200 });
    });
    const result = await new DeepSeekGuidedWritingCoach({
      apiKey: "test-key", model: "deepseek-v4-flash", fetchImpl,
    }).evaluateParagraph(paragraphInput, new AbortController().signal);
    expect(result).toMatchObject({
      output,
      promptVersion: "guided-writing-paragraph-v1.0",
      schemaVersion: "guided-writing-paragraph-evaluation.v1",
    });
  });

  it("gives Task 2 classification the exact local topic vocabulary without sending the key in the body", async () => {
    const analysisId = "4d2335a7-850a-48d1-96bf-c6716070151f";
    const prompt = "More people are choosing to work remotely. Why is this happening? Is this a positive or negative development?";
    const output = {
      schema_version: "guided-writing-task2-prompt-analysis.v1",
      analysis_id: analysisId,
      is_task_2: true,
      question_type: "two_part_multi_part",
      topic: "work_economy_business_consumption",
      reason_zh: "题目要求分别回答原因及这是正面还是负面发展。",
      confidence: 0.95,
      needs_review: false,
    };
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-key");
      const serialized = String(init?.body);
      expect(serialized).not.toContain("test-key");
      const body = JSON.parse(serialized);
      expect(body.messages[0].content).toContain("can still be valid when the pasted text omits boilerplate");
      expect(body.messages[0].content).toContain(task2Topics.join(", "));
      expect(body.messages[0].content).toContain("copy its spelling exactly");
      expect(body.messages[1]).toEqual({ role: "user", content: JSON.stringify({ analysis_id: analysisId, prompt }) });
      return new Response(JSON.stringify({
        model: "deepseek-v4-flash",
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }],
        usage: { prompt_tokens: 180, completion_tokens: 55 },
      }), { status: 200 });
    });
    const result = await new DeepSeekGuidedWritingCoach({
      apiKey: "test-key", model: "deepseek-v4-flash", fetchImpl,
    }).analyzeTask2Prompt({ analysisId, prompt }, new AbortController().signal);
    expect(result).toMatchObject({ output, promptVersion: "guided-writing-task2-prompt-analysis-v1.1" });
  });
});
