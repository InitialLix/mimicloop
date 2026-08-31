import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ContentRepository, loadSeedBundle } from "../../src/db/content-repository";
import { exportFullBackup, restoreFullBackup } from "../../src/db/backup-service";
import { GuidedWritingRepository } from "../../src/db/guided-writing-repository";
import { GuidedWritingParagraphRepository } from "../../src/db/guided-writing-paragraph-repository";
import { GuidedWritingNodeLanguageRepository } from "../../src/db/guided-writing-node-language-repository";
import { GuidedWritingIntroductionRepository } from "../../src/db/guided-writing-introduction-repository";
import { GuidedWritingConclusionRepository } from "../../src/db/guided-writing-conclusion-repository";
import { GuidedWritingFullEssayRepository } from "../../src/db/guided-writing-full-essay-repository";
import { sha256 } from "../../src/db/json";
import { migrateDatabase, openDatabase } from "../../src/db/client";
import type { GuidedWritingCoachProvider, GuidedWritingConclusionProvider, GuidedWritingFullEssayProvider, GuidedWritingIntroductionProvider, GuidedWritingNodeLanguageProvider, GuidedWritingParagraphProvider, GuidedWritingTask2PromptProvider } from "../../src/lib/ai/guided-writing-provider";
import type { WritingAssetSelectorProvider } from "../../src/lib/ai/writing-asset-selector-provider";
import type {
  DevelopmentRelation,
  GuidedWritingChainReviewV1,
} from "../../src/domain/writing/guided-writing-coach";
import type { SentenceCardData, SourceEssayData } from "../../src/lib/content-types";
import {
  answerGuidedWritingTurn,
  cancelUnchangedGuidedWritingRevision,
  reopenGuidedWritingNode,
  startGuidedWritingSession,
} from "../../src/lib/guided-writing-service";
import { evaluateGuidedWritingParagraph } from "../../src/lib/guided-writing-paragraph-service";
import {
  prepareLearnedWritingAssetSelection,
  retrieveLearnedWritingAssets,
} from "../../src/lib/guided-writing-expression-service";
import { retrieveSelectedWritingAssets } from "../../src/lib/guided-writing-expression-selection-service";
import { evaluateGuidedWritingNodeLanguage } from "../../src/lib/guided-writing-node-language-service";
import {
  evaluateGuidedWritingIntroduction,
  getGuidedWritingIntroductionWorkspace,
} from "../../src/lib/guided-writing-introduction-service";
import {
  prepareIntroductionWritingAssetSelection,
  retrieveSelectedIntroductionWritingAssets,
} from "../../src/lib/guided-writing-introduction-expression-service";
import { evaluateConclusion, evaluateFullEssay, getConclusionWorkspace, getFullEssayWorkspace } from "../../src/lib/guided-writing-essay-closure-service";
import { analyzeImportedTask2Prompt, confirmImportedTask2Prompt } from "../../src/lib/guided-writing-prompt-import-service";

describe("Phase 2.5B Guided Writing persistence", () => {
  let temporaryDirectory: string;

  beforeAll(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "mimicloop-guided-writing-"));
    vi.stubEnv("MIMICLOOP_GUIDED_WRITING_ENABLED", "true");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("MIMICLOOP_DEEPSEEK_MODEL", "deepseek-v4-flash");
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    const resolved = path.resolve(temporaryDirectory);
    if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to remove a non-temporary path");
    await rm(resolved, { recursive: true, force: true });
  });

  async function seededConnection(name: string, questionType: SourceEssayData["question_type"] = "opinion") {
    const connection = openDatabase(path.join(temporaryDirectory, name));
    migrateDatabase(connection);
    const repository = new ContentRepository(connection);
    repository.importSeeds(await loadSeedBundle());
    const source = (repository.listSources() as unknown as SourceEssayData[])
      .find((item) => item.question_type === questionType && item.ielts_prompt)!;
    return { connection, source };
  }

  function acceptedProvider(
    turnId: string,
    developmentRelation: DevelopmentRelation | null = null,
    chainReview?: GuidedWritingChainReviewV1,
    forwardSpan?: { target_node: "claim" | "reason" | "mechanism" | "result"; text: string } | null,
  ): GuidedWritingCoachProvider {
    return {
      evaluate: vi.fn(async (coachInput) => ({
        output: {
          schema_version: "guided-writing-coach.v1.2",
          turn_id: turnId,
          verdict: "accept",
          dimensions: { relevance: "direct", logic: "clear", specificity: "sufficient" },
          issue_type: null,
          development_relation: developmentRelation,
          accepted_span: forwardSpan
            ? coachInput.learnerAnswer.replace(forwardSpan.text, "").trim()
            : coachInput.learnerAnswer,
          forward_span: forwardSpan ?? null,
          feedback_en: "This is clear enough to become part of the argument chain.",
          confidence: 0.94,
          needs_review: false,
        },
        provider: "fixture",
        model: "coach-fixture-v1",
        promptVersion: "guided-writing-coach-v1.7",
        schemaVersion: "guided-writing-coach.v1.2",
        inputTokens: 120,
        outputTokens: 50,
        latencyMs: 4,
      })),
      reviewChain: vi.fn(async () => ({
        output: chainReview ?? {
          schema_version: "guided-writing-chain-review.v1",
          turn_id: turnId,
          verdict: "ready",
          return_to_node: null,
          reason_code: null,
          feedback_en: "The saved nodes form one coherent paragraph argument.",
          confidence: 0.93,
          needs_review: false,
        },
        provider: "fixture",
        model: "coach-fixture-v1",
        promptVersion: "guided-writing-chain-review-v1.1",
        schemaVersion: "guided-writing-chain-review.v1",
        inputTokens: 90,
        outputTokens: 35,
        latencyMs: 3,
      })),
    };
  }

  function markReadyForDraft(connection: ReturnType<typeof openDatabase>, sessionId: string) {
    const graph = Object.fromEntries(["stance", "claim", "reason", "mechanism", "result"].map((node, index) => [node, {
      content: `Learner-owned ${node} content`,
      origin: "user_after_question",
      turnId: `00000000-0000-4000-8000-00000000000${index}`,
    }]));
    connection.sqlite.prepare(
      "UPDATE guided_writing_sessions SET status = 'ready_to_draft', current_node = NULL, argument_graph_json = ? WHERE id = ?",
    ).run(JSON.stringify(graph), sessionId);
  }

  function markParagraphClear(connection: ReturnType<typeof openDatabase>, sessionId: string) {
    const repository = new GuidedWritingParagraphRepository(connection);
    const draftId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    repository.beginDraft({
      id: draftId,
      sessionId,
      inputHash: sha256({ sessionId, draftId, kind: "clear-fixture" }),
      draftText: "This learner-owned paragraph is clear enough to continue.",
      learnerIdHash: "fixture-learner",
      provider: "fixture",
      model: "fixture-model",
      promptVersion: "guided-writing-paragraph-v1.0",
      schemaVersion: "guided-writing-paragraph-evaluation.v1",
      startedAt,
    });
    repository.finalizeDraft({
      draftId,
      status: "success",
      evaluation: {
        schema_version: "guided-writing-paragraph-evaluation.v1",
        draft_id: draftId,
        logic: {
          status: "clear", strength_en: "The reasoning is focused.", issue_type: null,
          evidence_span: null, feedback_en: "The paragraph performs its assigned role.",
        },
        language: {
          status: "clear", strength_en: "The language is usable.", issue_type: null,
          severity: null, evidence_span: null, feedback_en: "No priority issue remains.",
        },
        confidence: 0.93,
        needs_review: false,
      },
      errorCode: null,
      steps: [],
      provider: "fixture",
      model: "fixture-model",
      inputTokens: 1,
      outputTokens: 1,
      completedAt: startedAt,
    });
  }

  function markIntroductionClear(connection: ReturnType<typeof openDatabase>, sourceEssayId: string, bodyOneId: string, bodyTwoId: string) {
    const bodyOneDraft = new GuidedWritingParagraphRepository(connection).latestForSession(bodyOneId)!;
    const bodyTwoDraft = new GuidedWritingParagraphRepository(connection).latestForSession(bodyTwoId)!;
    const id = crypto.randomUUID(); const at = new Date().toISOString(); const repository = new GuidedWritingIntroductionRepository(connection);
    const components = { opening: "", taskFraming: "The proposal remains controversial.", thesis: "I disagree because it creates two wider problems." };
    repository.beginDraft({ id, learnerId: "local-default-learner", learnerIdHash: "fixture", sourceEssayId, bodyOneSessionId: bodyOneId, bodyTwoSessionId: bodyTwoId, components, draftText: `${components.taskFraming} ${components.thesis}`, inputHash: sha256({ id, components }), provider: "fixture", model: "fixture", promptVersion: "guided-writing-introduction-v1.0", schemaVersion: "guided-writing-introduction-evaluation.v1", startedAt: at });
    repository.finalizeDraft({ draftId: id, status: "success", evaluation: { schema_version: "guided-writing-introduction-evaluation.v1", draft_id: id, task_response: { status: "clear", strength_en: "The position is consistent.", issue_type: null, evidence_span: null, feedback_en: "The introduction matches the two body paragraphs." }, language: { status: "clear", strength_en: "The language is clear.", issue_type: null, severity: null, evidence_span: null, feedback_en: "No priority language issue remains." }, confidence: .93, needs_review: false }, errorCode: null, steps: [], completedAt: at });
    return { id, bodyOneDraft, bodyTwoDraft };
  }

  it("stores the learner answer with origin and advances exactly one node idempotently", async () => {
    const { connection, source } = await seededConnection("advance.db");
    try {
      const sessionId = "a74c9c18-4a60-4df4-84f5-87705df158ad";
      const turnId = "1fed4bf0-f3e2-48aa-bd55-799df0a2fc72";
      const answer = "I agree that businesses should contribute to society as well as make profits.";
      const started = startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      expect(started).toMatchObject({ currentNode: "stance", status: "building_argument" });
      const request = { connection, sessionId, turnId, learnerAnswer: answer, provider: acceptedProvider(turnId) };
      const first = await answerGuidedWritingTurn(request);
      const duplicate = await answerGuidedWritingTurn(request);
      expect(first.session).toMatchObject({
        currentNode: "claim",
        graph: { stance: { content: answer, origin: "user_after_question", turnId } },
      });
      expect(duplicate.session.currentNode).toBe("claim");
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM guided_writing_turns").get()).toEqual({ count: 1 });
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM agent_traces WHERE feature = 'guided_writing_coach'").get()).toEqual({ count: 1 });
      const turn = new GuidedWritingRepository(connection).getTurn(turnId);
      expect(turn).toMatchObject({ status: "success", node: "stance", learnerAnswer: answer });
      const trace = connection.sqlite.prepare("SELECT steps_json AS stepsJson FROM agent_traces WHERE id = ?")
        .get(turn!.traceId) as { stepsJson: string };
      expect(trace.stepsJson).not.toContain(answer);
    } finally {
      connection.close();
    }
  });

  it("recomputes a discussion essay's Claim question from the trusted paragraph role", async () => {
    const { connection, source } = await seededConnection("discussion-role.db", "discussion");
    try {
      const sessionId = "ed35051c-c837-425d-ab46-544fdd1fc4a2";
      const turnId = "1f1b7932-bb0a-41f8-a7f8-0ca8e560ff33";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      const result = await answerGuidedWritingTurn({
        connection,
        sessionId,
        turnId,
        learnerAnswer: "I support the latter view overall.",
        provider: acceptedProvider(turnId),
      });
      expect(result.session.currentQuestionEn).toContain("reasonable person hold the first view");
      expect(new GuidedWritingRepository(connection).view(sessionId)?.currentQuestionEn)
        .toContain("reasonable person hold the first view");
      expect(result.session.currentQuestionEn).not.toContain("support your overall position");
    } finally {
      connection.close();
    }
  });

  it("starts Body Paragraph 2 only from a completed Body Paragraph 1 and keeps both records separate", async () => {
    const { connection, source } = await seededConnection("guided-writing-body-two.db", "opinion");
    try {
      const bodyOneId = "1ca69a17-1cda-4fd1-93ef-628b22ec569e";
      const bodyTwoId = "97c3861e-dd87-4b5f-b982-43488f1433ee";
      startGuidedWritingSession({ connection, sessionId: bodyOneId, sourceEssayId: source.id });
      expect(() => startGuidedWritingSession({
        connection,
        sessionId: bodyTwoId,
        sourceEssayId: source.id,
        paragraphKey: "body_2",
        fromSessionId: bodyOneId,
      })).toThrowError(/尚未完成/u);

      markReadyForDraft(connection, bodyOneId);
      expect(() => startGuidedWritingSession({
        connection,
        sessionId: bodyTwoId,
        sourceEssayId: source.id,
        paragraphKey: "body_2",
        fromSessionId: bodyOneId,
      })).toThrowError(/逻辑与语言检查/u);
      markParagraphClear(connection, bodyOneId);
      const bodyOne = new GuidedWritingRepository(connection).getSession(bodyOneId)!;
      const bodyTwo = startGuidedWritingSession({
        connection,
        sessionId: bodyTwoId,
        sourceEssayId: source.id,
        paragraphKey: "body_2",
        fromSessionId: bodyOneId,
      });
      expect(bodyTwo).toMatchObject({
        paragraphKey: "body_2",
        currentNode: "claim",
        status: "building_argument",
        graph: {
          stance: bodyOne.graph.stance,
          claim: null,
          reason: null,
          mechanism: null,
          result: null,
        },
      });
      expect(bodyTwo.currentQuestionEn).toContain("second supporting reason");
      expect(connection.sqlite.prepare(
        "SELECT paragraph_key AS paragraphKey FROM guided_writing_sessions ORDER BY created_at, id",
      ).all()).toEqual([{ paragraphKey: "body_1" }, { paragraphKey: "body_2" }]);
    } finally {
      connection.close();
    }
  });

  it("persists the accepted Reason relation and restores its deterministic Development question", async () => {
    const { connection, source } = await seededConnection("development-relation.db");
    try {
      const sessionId = "85e886c6-05f9-48fc-8816-6db5bcab1d0b";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      const turns = [
        ["c29cb285-6ac7-486a-9eac-348c2ac27474", "I agree that businesses have responsibilities beyond profit.", null],
        ["fdcb7e14-5ac4-49f3-b3fb-ebc96981bb17", "Companies should be accountable for harm caused by their decisions.", null],
        ["68de8bb0-8ce1-4432-a7f6-ebdbfffe843f", "Their decisions affect people who did not choose to bear those risks.", "principle_application"],
      ] as const;
      for (const [turnId, learnerAnswer, relation] of turns) {
        await answerGuidedWritingTurn({
          connection,
          sessionId,
          turnId,
          learnerAnswer,
          provider: acceptedProvider(turnId, relation),
        });
      }
      const view = new GuidedWritingRepository(connection).view(sessionId);
      expect(view).toMatchObject({
        currentNode: "mechanism",
        developmentRelation: "principle_application",
      });
      expect(view?.currentQuestionEn).toContain("Why does the principle");
      expect(view?.turns.at(-1)?.action).toMatchObject({
        nextNode: "mechanism",
        developmentRelation: "principle_application",
      });
    } finally {
      connection.close();
    }
  });

  it("persists only the accepted Reason span and restores the learner-owned Development reuse offer", async () => {
    const { connection, source } = await seededConnection("guided-writing-forward-span.db");
    try {
      const sessionId = "11dbfd22-7b87-49c3-a369-fbb22e19a634";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      const setupTurns = [
        ["bb4f35ab-b59b-4da2-a73c-f43916b494dd", "I disagree with the view in the prompt."],
        ["9d111ec9-a4af-493e-93fc-47bc1ee03ff8", "Protecting animals also protects systems that people depend on."],
      ] as const;
      for (const [turnId, learnerAnswer] of setupTurns) {
        await answerGuidedWritingTurn({
          connection, sessionId, turnId, learnerAnswer, provider: acceptedProvider(turnId),
        });
      }
      const currentSpan = "Humans and animals depend on the same ecosystems.";
      const laterSpan = "Damaging animal populations can disrupt shared food chains.";
      const reasonTurnId = "2dcac692-54b8-49dd-b70f-07db60c8253d";
      const result = await answerGuidedWritingTurn({
        connection,
        sessionId,
        turnId: reasonTurnId,
        learnerAnswer: `${currentSpan} ${laterSpan}`,
        provider: acceptedProvider(
          reasonTurnId,
          "causal",
          undefined,
          { target_node: "mechanism", text: laterSpan },
        ),
      });
      expect(result.session).toMatchObject({
        currentNode: "mechanism",
        graph: { reason: { content: currentSpan, turnId: reasonTurnId } },
        reuseSuggestion: {
          sourceTurnId: reasonTurnId,
          targetNode: "mechanism",
          text: laterSpan,
        },
      });
      expect(new GuidedWritingRepository(connection).view(sessionId)?.reuseSuggestion?.text).toBe(laterSpan);
    } finally {
      connection.close();
    }
  });

  it("reopens a saved upstream node without deleting history and offers each saved downstream step for recheck", async () => {
    const { connection, source } = await seededConnection("guided-writing-manual-revision.db");
    try {
      const sessionId = "055ab1ee-3c01-483d-a05e-4d442eedbf0f";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      const originalTurns = [
        ["908ed531-129d-43d3-bd58-94a33b814560", "I agree that businesses have responsibilities beyond profit.", null],
        ["fbd46fd6-4dfb-49d3-a1c0-3e2baf665cca", "Businesses should account for the social effects of their decisions.", null],
        ["1fd2050d-bd22-42c9-aa62-0f05ab4c24da", "People outside a company can bear costs created by those decisions.", "causal"],
        ["b979a08b-483c-41c5-b575-1ffea61da0ed", "Those costs can reduce health, safety and access to shared resources.", "causal"],
        ["0d63e32b-9851-41af-819a-34dff7d63fee", "Businesses should therefore consider social harm as well as profit.", null],
      ] as const;
      for (const [turnId, learnerAnswer, relation] of originalTurns) {
        await answerGuidedWritingTurn({
          connection,
          sessionId,
          turnId,
          learnerAnswer,
          provider: acceptedProvider(turnId, relation),
        });
      }
      expect(new GuidedWritingRepository(connection).view(sessionId)?.status).toBe("ready_to_draft");
      const beforeCount = connection.sqlite.prepare(
        "SELECT COUNT(*) AS count FROM guided_writing_turns WHERE session_id = ?",
      ).get(sessionId) as { count: number };

      const reopened = reopenGuidedWritingNode({ connection, sessionId, node: "claim" });
      expect(reopened).toMatchObject({
        status: "building_argument",
        currentNode: "claim",
        graph: {
          claim: { turnId: originalTurns[1][0] },
          reason: { turnId: originalTurns[2][0] },
          result: { turnId: originalTurns[4][0] },
        },
        chainReview: null,
      });
      const afterReopenCount = connection.sqlite.prepare(
        "SELECT COUNT(*) AS count FROM guided_writing_turns WHERE session_id = ?",
      ).get(sessionId) as { count: number };
      expect(afterReopenCount).toEqual(beforeCount);

      const cancelled = cancelUnchangedGuidedWritingRevision({ connection, sessionId });
      expect(cancelled).toMatchObject({ status: "ready_to_draft", currentNode: null });
      expect(cancelled.graph.claim?.turnId).toBe(originalTurns[1][0]);
      expect(connection.sqlite.prepare(
        "SELECT COUNT(*) AS count FROM guided_writing_turns WHERE session_id = ?",
      ).get(sessionId)).toEqual(beforeCount);

      reopenGuidedWritingNode({ connection, sessionId, node: "claim" });
      expect(() => reopenGuidedWritingNode({ connection, sessionId, node: "reason" }))
        .toThrow("Finish rechecking the earlier step");

      const revisedClaimTurnId = "b99d4a54-5ac6-4bdb-afcd-f3f00f15ca14";
      const revised = await answerGuidedWritingTurn({
        connection,
        sessionId,
        turnId: revisedClaimTurnId,
        learnerAnswer: "Businesses should be accountable when their decisions impose avoidable costs on others.",
        provider: acceptedProvider(revisedClaimTurnId),
      });
      expect(revised.session).toMatchObject({
        currentNode: "reason",
        graph: { claim: { turnId: revisedClaimTurnId } },
        reuseSuggestion: {
          sourceTurnId: originalTurns[2][0],
          targetNode: "reason",
          text: originalTurns[2][1],
        },
      });
      expect(new GuidedWritingRepository(connection).getTurn(originalTurns[1][0])).not.toBeNull();
      expect(connection.sqlite.prepare(
        "SELECT COUNT(*) AS count FROM guided_writing_turns WHERE session_id = ?",
      ).get(sessionId)).toEqual({ count: beforeCount.count + 1 });
    } finally {
      connection.close();
    }
  });

  it("returns to the diagnosed node and becomes ready only after a second full-chain review", async () => {
    const { connection, source } = await seededConnection("full-chain-review.db");
    try {
      const sessionId = "d78068c5-00f9-460e-8fe2-73f166f1ebc6";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      const firstPass = [
        ["d523ff4a-14e2-45db-a1eb-b3e9ba810819", "I agree that businesses have responsibilities beyond profit.", null],
        ["12584271-74a7-4b31-8ead-914deaf1c438", "Companies should be accountable for the wider effects of their decisions.", null],
        ["47f36eef-4d53-4af2-b5bc-ac550ff42177", "Companies should be responsible for what their decisions cause.", "causal"],
        ["164516a2-a531-47e6-941c-31fa7b90ba02", "Their choices can expose local communities to costs they cannot avoid.", "causal"],
      ] as const;
      for (const [turnId, learnerAnswer, relation] of firstPass) {
        await answerGuidedWritingTurn({
          connection, sessionId, turnId, learnerAnswer, provider: acceptedProvider(turnId, relation),
        });
      }
      const firstResultTurn = "b78f211f-5de0-409d-84f1-e9c760424438";
      const returnReview: GuidedWritingChainReviewV1 = {
        schema_version: "guided-writing-chain-review.v1",
        turn_id: firstResultTurn,
        verdict: "return_to_node",
        return_to_node: "reason",
        reason_code: "reason_repeats_claim",
        feedback_en: "The reason repeats the claim instead of adding a distinct basis for it.",
        confidence: 0.92,
        needs_review: false,
      };
      const returned = await answerGuidedWritingTurn({
        connection,
        sessionId,
        turnId: firstResultTurn,
        learnerAnswer: "This shows that profit cannot be the only standard for business conduct.",
        provider: acceptedProvider(firstResultTurn, null, returnReview),
      });
      expect(returned.session).toMatchObject({
        status: "building_argument",
        currentNode: "reason",
        chainReview: returnReview,
      });
      expect(returned.session.currentQuestionEn).toContain("without repeating it");
      expect(returned.session.graph.result?.turnId).toBe(firstResultTurn);

      const secondPass = [
        ["240989fc-3ed8-41de-b38c-452de981e77d", "People outside a company may bear serious costs without sharing its profits.", "comparison"],
        ["3f734068-74a3-4cac-8f9b-b7846916c8b1", "Profit and social harm therefore need to be judged against the shared standard of who receives benefits and who bears costs.", "comparison"],
      ] as const;
      for (const [turnId, learnerAnswer, relation] of secondPass) {
        await answerGuidedWritingTurn({
          connection, sessionId, turnId, learnerAnswer, provider: acceptedProvider(turnId, relation),
        });
      }
      const finalTurnId = "47668f83-9323-4e52-a4f6-87689db9dbcb";
      const ready = await answerGuidedWritingTurn({
        connection,
        sessionId,
        turnId: finalTurnId,
        learnerAnswer: "Businesses must therefore consider social costs as well as financial returns.",
        provider: acceptedProvider(finalTurnId),
      });
      expect(ready.session).toMatchObject({
        status: "ready_to_draft",
        currentNode: null,
        chainReview: { verdict: "ready" },
        developmentRelation: "comparison",
      });
      const finalTurn = new GuidedWritingRepository(connection).getTurn(finalTurnId);
      const trace = connection.sqlite.prepare("SELECT steps_json AS stepsJson FROM agent_traces WHERE id = ?")
        .get(finalTurn!.traceId) as { stepsJson: string };
      expect(trace.stepsJson).toContain("review_argument_chain");
      expect(trace.stepsJson).not.toContain("People outside a company");
    } finally {
      connection.close();
    }
  });

  it("keeps a rejected answer and does not advance the argument graph", async () => {
    const { connection, source } = await seededConnection("retry.db");
    try {
      const sessionId = "401eb2dc-cafb-45ce-8588-75b5e33d18dd";
      const turnId = "dd41caec-57f1-4ea8-8831-803fb4eb1f7c";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      const provider: GuidedWritingCoachProvider = {
        evaluate: vi.fn(async () => ({
          output: {
            schema_version: "guided-writing-coach.v1.2",
            turn_id: turnId,
            verdict: "retry",
            dimensions: { relevance: "partial", logic: "incomplete", specificity: "vague" },
            issue_type: "vague",
            development_relation: null,
            accepted_span: null,
            forward_span: null,
            feedback_en: "This is related to the topic, but it does not state your position yet.",
            confidence: 0.92,
            needs_review: false,
          },
          provider: "fixture", model: "coach-fixture-v1", promptVersion: "guided-writing-coach-v1.7",
          schemaVersion: "guided-writing-coach.v1.2", inputTokens: 100, outputTokens: 45, latencyMs: 3,
        })),
        reviewChain: vi.fn(async () => { throw new Error("Chain review should not run for a retry"); }),
      };
      const result = await answerGuidedWritingTurn({
        connection, sessionId, turnId, learnerAnswer: "Businesses are important.", provider,
      });
      expect(result.session.currentNode).toBe("stance");
      expect(result.session.graph.stance).toBeNull();
      expect(result.session.currentQuestionEn).toContain("more precisely");
      expect(result.session.turns[0]).toMatchObject({ status: "success", evaluation: { verdict: "retry" } });
    } finally {
      connection.close();
    }
  });

  it("reports a provider network failure without losing or advancing the learner answer", async () => {
    const { connection, source } = await seededConnection("guided-writing-network.db");
    try {
      const sessionId = "7a238d0f-2929-4f49-8427-e235040a7a60";
      const turnId = "f59fc9c4-06ac-4521-9234-f86cdd9b01a5";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      const provider: GuidedWritingCoachProvider = {
        evaluate: vi.fn(async () => { throw new TypeError("fetch failed"); }),
        reviewChain: vi.fn(async () => { throw new Error("Chain review should not run"); }),
      };
      const result = await answerGuidedWritingTurn({
        connection,
        sessionId,
        turnId,
        learnerAnswer: "I largely agree that this policy should be introduced.",
        provider,
      });
      expect(result).toMatchObject({
        status: "fallback",
        session: { currentNode: "stance", graph: { stance: null } },
      });
      expect(result.message).toContain("Unable to reach DeepSeek");
      expect(new GuidedWritingRepository(connection).getTurn(turnId)).toMatchObject({
        status: "error",
        errorCode: "PROVIDER_NETWORK_ERROR",
      });
    } finally {
      connection.close();
    }
  });

  it("retrieves the approved corpus and preserves whether each asset was studied", async () => {
    const { connection, source } = await seededConnection("guided-writing-expressions.db");
    try {
      const sessionId = "059b6b61-fbe7-463e-93a5-bbe36f70857f";
      const cards = new ContentRepository(connection).listCards() as unknown as SentenceCardData[];
      const learned = cards.find((card) => card.pattern && card.argument_functions.includes("explain_mechanism"))!;
      connection.sqlite.prepare("UPDATE review_states SET learning_stage = 'use' WHERE card_id = ?").run(learned.id);
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      markReadyForDraft(connection, sessionId);

      const prepared = prepareLearnedWritingAssetSelection(connection, sessionId, "mechanism");
      const result = prepared.retrieval;

      expect(result.pool.approvedSentences).toBe(cards.length);
      expect(result.pool.studiedSentences).toBe(1);
      expect(prepared.candidates.some((asset) => asset.learningStage === "new")).toBe(true);
      expect(result).toMatchObject({
        node: "mechanism",
        nodeContent: "Learner-owned mechanism content",
      });
      if (result.primaryAsset) expect(result.primaryAsset.assetType).toBe("sentence");
      expect(result.supportingExpressions.every((asset) => asset.assetType === "collocation")).toBe(true);
      expect(result.supportingExpressions.length).toBeLessThanOrEqual(3);
    } finally {
      connection.close();
    }
  });

  it("lets the model select only from prepared approved candidates", async () => {
    const { connection, source } = await seededConnection("guided-writing-expression-selection.db");
    try {
      const sessionId = "8cbbf878-f31e-46ec-8c78-a305aff00279";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      markReadyForDraft(connection, sessionId);
      const prepared = prepareLearnedWritingAssetSelection(connection, sessionId, "mechanism");
      const sentence = prepared.candidates.find((candidate) => candidate.assetType === "sentence")!;
      const collocation = prepared.candidates.find((candidate) => candidate.assetType === "collocation");
      const provider: WritingAssetSelectorProvider = {
        select: vi.fn(async () => ({
          output: {
            schema_version: "guided-writing-asset-selection.v1",
            primary_asset_id: sentence.assetId,
            supporting_asset_ids: collocation ? [collocation.assetId] : [],
            reason_zh: "该结构能够承载当前节点的具体作用过程。",
            confidence: 0.92,
            needs_review: false,
          },
          provider: "deepseek",
          model: "deepseek-v4-flash",
          promptVersion: "guided-writing-asset-selection-v1.1",
          schemaVersion: "guided-writing-asset-selection.v1",
          inputTokens: 100,
          outputTokens: 30,
          latencyMs: 20,
        })),
      };
      const result = await retrieveSelectedWritingAssets({ connection, sessionId, node: "mechanism", provider });
      expect(result.primaryAsset?.assetId).toBe(sentence.assetId);
      expect(result.supportingExpressions.map((asset) => asset.assetId)).toEqual(collocation ? [collocation.assetId] : []);
      expect(result.selection).toEqual({ mode: "deepseek", model: "deepseek-v4-flash", errorCode: null });
    } finally {
      connection.close();
    }
  });

  it("stores and evaluates one node realization without changing the argument graph", async () => {
    const { connection, source } = await seededConnection("guided-writing-node-language.db");
    try {
      const sessionId = "2f614879-5cec-4acf-a357-2826fa997878";
      const attemptId = "4c6e9252-0834-4e67-af84-d198542139f0";
      const learnerText = "This process weakens the environment on which people depend.";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      markReadyForDraft(connection, sessionId);
      const graphBefore = new GuidedWritingRepository(connection).getSession(sessionId)!.graph;
      const provider: GuidedWritingNodeLanguageProvider = {
        evaluateNodeLanguage: vi.fn(async () => ({
          output: {
            schema_version: "guided-writing-node-language-evaluation.v1",
            attempt_id: attemptId,
            verdict: "pass",
            dimensions: {
              meaning: "complete",
              logic: "fits_node",
              target_usage: "not_required",
              naturalness: "natural",
            },
            errors: [],
            accepted_text: learnerText,
            feedback_en: "This expresses the planned mechanism clearly and naturally.",
            minimal_hint_en: null,
            confidence: 0.94,
            needs_review: false,
          },
          provider: "fixture",
          model: "node-language-fixture-v1",
          promptVersion: "guided-writing-node-language-v1.0",
          schemaVersion: "guided-writing-node-language-evaluation.v1",
          inputTokens: 130,
          outputTokens: 55,
          latencyMs: 3,
        })),
      };
      const result = await evaluateGuidedWritingNodeLanguage({
        connection,
        sessionId,
        attemptId,
        node: "mechanism",
        learnerText,
        assetType: null,
        assetId: null,
        hintLevel: 0,
        provider,
      });
      expect(result).toMatchObject({
        status: "evaluated",
        attempt: { id: attemptId, node: "mechanism", hintLevel: 0, evaluation: { verdict: "pass" } },
      });
      expect(new GuidedWritingRepository(connection).getSession(sessionId)!.graph).toEqual(graphBefore);
      expect(new GuidedWritingNodeLanguageRepository(connection).view(attemptId)).toMatchObject({ model: "node-language-fixture-v1" });
      const backup = exportFullBackup(connection);
      expect(backup).toMatchObject({
        schema_version: "1.11.0",
        guided_writing_node_language_attempts: [{ id: attemptId, learner_text: learnerText }],
      });
    } finally {
      connection.close();
    }
  });

  it("stores a learner-owned paragraph idempotently and keeps logic and language feedback separate", async () => {
    const { connection, source } = await seededConnection("guided-writing-paragraph.db");
    try {
      const sessionId = "f9f59b63-632e-47cb-bfbd-c05f35528159";
      const draftId = "53a969ee-f25e-49ab-bf8e-d47ee23905e3";
      const draftText = "Companies affect people beyond their shareholders. These effects can impose costs on communities, so businesses should consider social harm as well as profit.";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      markReadyForDraft(connection, sessionId);
      const provider: GuidedWritingParagraphProvider = {
        evaluateParagraph: vi.fn(async () => ({
          output: {
            schema_version: "guided-writing-paragraph-evaluation.v1",
            draft_id: draftId,
            logic: {
              status: "clear",
              strength_en: "The paragraph develops one focused line of reasoning.",
              issue_type: null,
              evidence_span: null,
              feedback_en: "The support leads to a proportionate takeaway.",
            },
            language: {
              status: "needs_revision",
              strength_en: "The intended meaning remains clear.",
              issue_type: "grammar",
              severity: "minor",
              evidence_span: "These effects can impose costs on communities",
              feedback_en: "Check one local agreement detail; the paragraph remains readable.",
            },
            confidence: 0.92,
            needs_review: false,
          },
          provider: "fixture",
          model: "paragraph-fixture-v1",
          promptVersion: "guided-writing-paragraph-v1.0",
          schemaVersion: "guided-writing-paragraph-evaluation.v1",
          inputTokens: 220,
          outputTokens: 75,
          latencyMs: 4,
        })),
      };
      const request = { connection, sessionId, draftId, draftText, provider };
      const first = await evaluateGuidedWritingParagraph(request);
      const duplicate = await evaluateGuidedWritingParagraph(request);
      expect(first).toMatchObject({
        status: "evaluated",
        nextAction: "REVISE_LANGUAGE",
        draft: { id: draftId, draftText, status: "success", model: "paragraph-fixture-v1" },
      });
      expect(duplicate.draft.id).toBe(draftId);
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM guided_writing_paragraph_drafts").get())
        .toEqual({ count: 1 });
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM agent_traces WHERE feature = 'guided_writing_paragraph'").get())
        .toEqual({ count: 1 });
      const stored = new GuidedWritingParagraphRepository(connection).getDraft(draftId)!;
      const trace = connection.sqlite.prepare("SELECT steps_json AS stepsJson FROM agent_traces WHERE id = ?")
        .get(stored.traceId) as { stepsJson: string };
      expect(trace.stepsJson).not.toContain(draftText);

      const backup = exportFullBackup(connection);
      expect(backup).toMatchObject({
        schema_version: "1.11.0",
        guided_writing_paragraph_drafts: [{ id: draftId, draft_text: draftText }],
      });
      const restored = openDatabase(path.join(temporaryDirectory, "guided-writing-paragraph-restored.db"));
      try {
        migrateDatabase(restored);
        await restoreFullBackup(restored, backup, { rollbackDirectory: path.join(temporaryDirectory, "rollback-paragraph") });
        expect(new GuidedWritingParagraphRepository(restored).view(draftId)).toMatchObject({
          id: draftId,
          draftText,
          evaluation: { logic: { status: "clear" }, language: { status: "needs_revision" } },
        });
      } finally {
        restored.close();
      }
    } finally {
      connection.close();
    }
  });

  it("evaluates and stores a Body Paragraph 2 draft under its own paragraph key", async () => {
    const { connection, source } = await seededConnection("guided-writing-body-two-paragraph.db");
    try {
      const bodyOneId = "7cbc88c7-4a69-4d12-8a88-b05361389786";
      const bodyTwoId = "e62dfa12-f5a8-4a8b-9a43-317fdd93aac9";
      const draftId = "bce514a4-6301-4d9d-923d-0fc65b2f0990";
      startGuidedWritingSession({ connection, sessionId: bodyOneId, sourceEssayId: source.id });
      markReadyForDraft(connection, bodyOneId);
      markParagraphClear(connection, bodyOneId);
      startGuidedWritingSession({
        connection,
        sessionId: bodyTwoId,
        sourceEssayId: source.id,
        paragraphKey: "body_2",
        fromSessionId: bodyOneId,
      });
      markReadyForDraft(connection, bodyTwoId);
      const provider: GuidedWritingParagraphProvider = {
        evaluateParagraph: vi.fn(async (paragraphInput) => {
          expect(paragraphInput.paragraph.key).toBe("body_2");
          return {
            output: {
              schema_version: "guided-writing-paragraph-evaluation.v1",
              draft_id: draftId,
              logic: {
                status: "clear", strength_en: "The second paragraph adds a distinct reason.", issue_type: null,
                evidence_span: null, feedback_en: "The paragraph performs its assigned role.",
              },
              language: {
                status: "clear", strength_en: "The wording is natural and controlled.", issue_type: null,
                severity: null, evidence_span: null, feedback_en: "No priority language issue remains.",
              },
              confidence: 0.93,
              needs_review: false,
            },
            provider: "fixture",
            model: "paragraph-fixture-v1",
            promptVersion: "guided-writing-paragraph-v1.0",
            schemaVersion: "guided-writing-paragraph-evaluation.v1",
            inputTokens: 180,
            outputTokens: 65,
            latencyMs: 3,
          };
        }),
      };
      const result = await evaluateGuidedWritingParagraph({
        connection,
        sessionId: bodyTwoId,
        draftId,
        draftText: "A second line of reasoning can qualify the position without repeating the first paragraph.",
        provider,
      });
      expect(result).toMatchObject({
        status: "evaluated",
        nextAction: "KEEP_DRAFT",
        draft: { paragraphKey: "body_2" },
      });
      expect(exportFullBackup(connection).guided_writing_paragraph_drafts)
        .toContainEqual(expect.objectContaining({ id: draftId, paragraph_key: "body_2" }));
    } finally {
      connection.close();
    }
  });

  it("requires two clear body paragraphs, then stores and restores a learner-owned introduction", async () => {
    const { connection, source } = await seededConnection("guided-writing-introduction.db", "opinion");
    try {
      const bodyOneId = "2206ee77-7798-4225-9f53-c4400a28ecad";
      const bodyTwoId = "d2af3d79-a671-45f5-b29c-d2ea93a6fc7a";
      const draftId = "4cc15df0-f5e9-41ea-93b5-89f5c27caf15";
      expect(() => getGuidedWritingIntroductionWorkspace(connection, source.id)).toThrowError(/both body paragraphs/u);

      startGuidedWritingSession({ connection, sessionId: bodyOneId, sourceEssayId: source.id });
      markReadyForDraft(connection, bodyOneId);
      markParagraphClear(connection, bodyOneId);
      startGuidedWritingSession({
        connection,
        sessionId: bodyTwoId,
        sourceEssayId: source.id,
        paragraphKey: "body_2",
        fromSessionId: bodyOneId,
      });
      markReadyForDraft(connection, bodyTwoId);
      markParagraphClear(connection, bodyTwoId);

      const workspace = getGuidedWritingIntroductionWorkspace(connection, source.id);
      expect(workspace).toMatchObject({
        context: {
          sourceEssayId: source.id,
          bodyPlan: [{ key: "body_1" }, { key: "body_2" }],
        },
        draft: null,
      });

      const components = {
        opening: "The issue remains widely debated.",
        taskFraming: "Some people believe companies should focus only on profit.",
        thesis: "I disagree because companies also affect the wider community in two important ways.",
      };
      const provider: GuidedWritingIntroductionProvider = {
        evaluateIntroduction: vi.fn(async (providerInput) => ({
          output: {
            schema_version: "guided-writing-introduction-evaluation.v1",
            draft_id: draftId,
            task_response: {
              status: "clear", strength_en: "The thesis matches the accepted position and body plan.", issue_type: null,
              evidence_span: null, feedback_en: "The task is introduced accurately and the position is clear.",
            },
            language: {
              status: "clear", strength_en: "The language is concise and formal.", issue_type: null,
              severity: null, evidence_span: null, feedback_en: "No priority language issue remains.",
            },
            confidence: 0.94,
            needs_review: false,
          },
          provider: "fixture",
          model: "introduction-fixture-v1",
          promptVersion: "guided-writing-introduction-v1.0",
          schemaVersion: "guided-writing-introduction-evaluation.v1",
          inputTokens: 210,
          outputTokens: 70,
          latencyMs: 4,
        })),
      };
      const request = { connection, sourceEssayId: source.id, draftId, components, provider };
      const first = await evaluateGuidedWritingIntroduction(request);
      const duplicate = await evaluateGuidedWritingIntroduction(request);
      expect(first).toMatchObject({
        status: "evaluated",
        nextAction: "KEEP_INTRODUCTION",
        draft: { id: draftId, status: "success", components, model: "introduction-fixture-v1" },
      });
      expect(duplicate.draft.id).toBe(draftId);
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM guided_writing_introduction_drafts").get()).toEqual({ count: 1 });
      expect(connection.sqlite.prepare("SELECT COUNT(*) AS count FROM agent_traces WHERE feature = 'guided_writing_introduction'").get()).toEqual({ count: 1 });
      const stored = new GuidedWritingIntroductionRepository(connection).getDraft(draftId)!;
      const trace = connection.sqlite.prepare("SELECT steps_json AS stepsJson FROM agent_traces WHERE id = ?")
        .get(stored.traceId) as { stepsJson: string };
      expect(trace.stepsJson).not.toContain(components.thesis);

      const backup = exportFullBackup(connection);
      expect(backup).toMatchObject({
        schema_version: "1.11.0",
        guided_writing_introduction_drafts: [{ id: draftId, thesis_text: components.thesis }],
      });
      const restored = openDatabase(path.join(temporaryDirectory, "guided-writing-introduction-restored.db"));
      try {
        migrateDatabase(restored);
        await restoreFullBackup(restored, backup, { rollbackDirectory: path.join(temporaryDirectory, "rollback-introduction") });
        expect(new GuidedWritingIntroductionRepository(restored).view(draftId)).toMatchObject({
          id: draftId,
          components,
          evaluation: { task_response: { status: "clear" }, language: { status: "clear" } },
        });
      } finally {
        restored.close();
      }
    } finally {
      connection.close();
    }
  });

  it("selects one approved introduction structure and keeps collocations secondary", async () => {
    const { connection, source } = await seededConnection("guided-writing-introduction-language.db", "opinion");
    try {
      const bodyOneId = "cb0c440d-d668-435a-b8a5-5c5ff3bfd976";
      const bodyTwoId = "a9b47f7d-1f18-4c54-b7ba-cef5f7a5ccdf";
      startGuidedWritingSession({ connection, sessionId: bodyOneId, sourceEssayId: source.id });
      markReadyForDraft(connection, bodyOneId);
      markParagraphClear(connection, bodyOneId);
      startGuidedWritingSession({
        connection,
        sessionId: bodyTwoId,
        sourceEssayId: source.id,
        paragraphKey: "body_2",
        fromSessionId: bodyOneId,
      });
      markReadyForDraft(connection, bodyTwoId);
      markParagraphClear(connection, bodyTwoId);

      const prepared = prepareIntroductionWritingAssetSelection({
        connection,
        sourceEssayId: source.id,
        part: "thesis",
      });
      expect(prepared.retrieval.pool.approvedIntroductionSentences).toBeGreaterThan(0);
      expect(prepared.candidates.every((asset) => asset.assetType === "sentence" || asset.assetType === "collocation")).toBe(true);
      if (prepared.retrieval.primaryAsset) {
        expect(prepared.retrieval.primaryAsset.sourceRelation).toBe("same_prompt");
      }
      const cardsById = new Map((new ContentRepository(connection).listCards() as unknown as SentenceCardData[])
        .map((card) => [card.id, card]));
      const sourcesById = new Map((new ContentRepository(connection).listSources() as unknown as SourceEssayData[])
        .map((item) => [item.id, item]));
      expect(prepared.candidates.filter((asset) => asset.assetType === "sentence").every((asset) => {
        const card = cardsById.get(asset.assetId);
        const sourceRole = card ? sourcesById.get(card.source_essay_id)?.content_role : null;
        return card?.content_status === "approved"
          && card.paragraph_index === 0
          && sourceRole !== "language_richness_corpus";
      })).toBe(true);
      const sentence = prepared.candidates.find((asset) => asset.assetType === "sentence")!;
      const collocation = prepared.candidates.find((asset) => asset.assetType === "collocation");
      expect(sentence).toBeTruthy();
      const provider: WritingAssetSelectorProvider = {
        select: vi.fn(async () => ({
          output: {
            schema_version: "guided-writing-asset-selection.v1",
            primary_asset_id: sentence.assetId,
            supporting_asset_ids: collocation ? [collocation.assetId] : [],
            reason_zh: "该开头句式能够承载已保存的总体立场。",
            confidence: 0.93,
            needs_review: false,
          },
          provider: "deepseek",
          model: "deepseek-v4-flash",
          promptVersion: "guided-writing-asset-selection-v1.1",
          schemaVersion: "guided-writing-asset-selection.v1",
          inputTokens: 100,
          outputTokens: 30,
          latencyMs: 12,
        })),
      };
      const result = await retrieveSelectedIntroductionWritingAssets({
        connection,
        sourceEssayId: source.id,
        part: "thesis",
        provider,
      });
      expect(result).toMatchObject({
        part: "thesis",
        primaryAsset: { assetType: "sentence", assetId: sentence.assetId },
        selection: { mode: "deepseek", model: "deepseek-v4-flash", errorCode: null },
      });
      expect(result.supportingExpressions.every((asset) => asset.assetType === "collocation")).toBe(true);
    } finally {
      connection.close();
    }
  });

  it("preserves a paragraph when the provider is unavailable", async () => {
    const { connection, source } = await seededConnection("guided-writing-paragraph-fallback.db");
    try {
      const sessionId = "96c14219-b133-426f-b8cf-e3be665bb4ed";
      const draftId = "c13727fc-2ba2-4ff7-84a0-783947c61a2c";
      const draftText = "This paragraph remains learner-owned even when the provider cannot be reached.";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      markReadyForDraft(connection, sessionId);
      const result = await evaluateGuidedWritingParagraph({
        connection,
        sessionId,
        draftId,
        draftText,
        provider: { evaluateParagraph: vi.fn(async () => { throw new TypeError("fetch failed"); }) },
      });
      expect(result).toMatchObject({
        status: "fallback",
        draft: { id: draftId, draftText, status: "error", evaluation: null },
      });
      expect(result.message).toContain("saved and remains editable");
    } finally {
      connection.close();
    }
  });

  it("round-trips sessions, turns and coach traces through backup v1.7", async () => {
    const { connection, source } = await seededConnection("backup-source.db");
    const restored = openDatabase(path.join(temporaryDirectory, "backup-restored.db"));
    try {
      migrateDatabase(restored);
      const sessionId = "208c8ac5-c06d-4f69-9e6b-108371703169";
      const turnId = "831585d2-3d73-4bdf-8ab6-f7cfe670a36c";
      startGuidedWritingSession({ connection, sessionId, sourceEssayId: source.id });
      await answerGuidedWritingTurn({
        connection,
        sessionId,
        turnId,
        learnerAnswer: "I agree that companies have responsibilities beyond earning money.",
        provider: acceptedProvider(turnId),
      });
      const backup = exportFullBackup(connection);
      expect(backup).toMatchObject({
        schema_version: "1.11.0",
        guided_writing_sessions: [{ id: sessionId }],
        guided_writing_turns: [{ id: turnId }],
      });
      await restoreFullBackup(restored, backup, { rollbackDirectory: path.join(temporaryDirectory, "rollback") });
      expect(new GuidedWritingRepository(restored).view(sessionId)).toMatchObject({
        currentNode: "claim",
        graph: { stance: { turnId } },
      });
    } finally {
      connection.close();
      restored.close();
    }
  });

  it("closes a learner-owned four-section essay and round-trips its exact references", async () => {
    const { connection, source } = await seededConnection("guided-writing-essay-closure.db", "opinion");
    const restored = openDatabase(path.join(temporaryDirectory, "guided-writing-essay-closure-restored.db"));
    try {
      migrateDatabase(restored);
      const bodyOneId = crypto.randomUUID(); const bodyTwoId = crypto.randomUUID();
      startGuidedWritingSession({ connection, sessionId: bodyOneId, sourceEssayId: source.id }); markReadyForDraft(connection, bodyOneId); markParagraphClear(connection, bodyOneId);
      startGuidedWritingSession({ connection, sessionId: bodyTwoId, sourceEssayId: source.id, paragraphKey: "body_2", fromSessionId: bodyOneId }); markReadyForDraft(connection, bodyTwoId); markParagraphClear(connection, bodyTwoId);
      const accepted = markIntroductionClear(connection, source.id, bodyOneId, bodyTwoId);
      expect(getConclusionWorkspace(connection, source.id).draft).toBeNull();
      const conclusionId = crypto.randomUUID(); const conclusionText = "Overall, these two effects show that the proposal should not be accepted.";
      const conclusionProvider: GuidedWritingConclusionProvider = { evaluateConclusion: vi.fn(async () => ({ output: { schema_version: "guided-writing-conclusion-evaluation.v1", draft_id: conclusionId, task_response: { status: "clear", strength_en: "The saved position is closed consistently.", issue_type: null, evidence_span: null, feedback_en: "The conclusion adds no new main idea." }, language: { status: "clear", strength_en: "The wording is concise.", issue_type: null, severity: null, evidence_span: null, feedback_en: "The conclusion is clear and natural." }, confidence: .94, needs_review: false }, provider: "fixture", model: "conclusion-fixture", promptVersion: "guided-writing-conclusion-v1.0", schemaVersion: "guided-writing-conclusion-evaluation.v1", inputTokens: 1, outputTokens: 1, latencyMs: 1 })) };
      const conclusion = await evaluateConclusion({ connection, sourceEssayId: source.id, draftId: conclusionId, conclusionText, provider: conclusionProvider });
      expect(conclusion).toMatchObject({ status: "evaluated", nextAction: "KEEP_CONCLUSION", draft: { conclusionText } });
      expect(getFullEssayWorkspace(connection, source.id).context.essayText).toBe([new GuidedWritingIntroductionRepository(connection).view(accepted.id)!.draftText, accepted.bodyOneDraft.draftText, accepted.bodyTwoDraft.draftText, conclusionText].join("\n\n"));
      const reviewId = crypto.randomUUID();
      const fullProvider: GuidedWritingFullEssayProvider = { evaluateFullEssay: vi.fn(async () => ({ output: { schema_version: "guided-writing-full-essay-evaluation.v1", review_id: reviewId, task_response: { status: "clear", strength_en: "The response keeps one position.", issue_type: null, evidence_span: null, feedback_en: "The task is answered consistently." }, coherence: { status: "clear", strength_en: "The four sections progress clearly.", issue_type: null, evidence_span: null, feedback_en: "The paragraph roles remain distinct." }, language: { status: "clear", strength_en: "The language remains readable.", issue_type: null, severity: null, evidence_span: null, feedback_en: "No blocking language issue remains." }, confidence: .92, needs_review: false }, provider: "fixture", model: "full-fixture", promptVersion: "guided-writing-full-essay-v1.0", schemaVersion: "guided-writing-full-essay-evaluation.v1", inputTokens: 1, outputTokens: 1, latencyMs: 1 })) };
      const review = await evaluateFullEssay({ connection, sourceEssayId: source.id, reviewId, provider: fullProvider });
      expect(review).toMatchObject({
        status: "evaluated",
        nextAction: "REVISE_TASK",
        review: {
          id: reviewId,
          evaluation: {
            task_response: {
              status: "needs_revision",
              issue_type: "incomplete_response",
            },
          },
        },
      });
      const backup = exportFullBackup(connection);
      expect(backup).toMatchObject({ schema_version: "1.11.0", guided_writing_conclusion_drafts: [{ id: conclusionId, conclusion_text: conclusionText }], guided_writing_full_essay_reviews: [{ id: reviewId, conclusion_draft_id: conclusionId }] });
      await restoreFullBackup(restored, backup, { rollbackDirectory: path.join(temporaryDirectory, "rollback-closure") });
      expect(new GuidedWritingConclusionRepository(restored).view(conclusionId)?.conclusionText).toBe(conclusionText);
      expect(new GuidedWritingFullEssayRepository(restored).view(reviewId)?.evaluation?.coherence.status).toBe("clear");
    } finally { connection.close(); restored.close(); }
  });

  it("imports a new Task 2 prompt only after learner confirmation and restores it from backup", async () => {
    const { connection } = await seededConnection("guided-writing-imported-prompt.db");
    const restored = openDatabase(path.join(temporaryDirectory, "guided-writing-imported-prompt-restored.db"));
    try {
      migrateDatabase(restored);
      const analysisId = crypto.randomUUID();
      const prompt = "Some people believe that animal experiments should be banned, while others think they are necessary for medical progress. Discuss both views and give your own opinion.";
      const provider: GuidedWritingTask2PromptProvider = { analyzeTask2Prompt: vi.fn(async () => ({
        output: { schema_version: "guided-writing-task2-prompt-analysis.v1", analysis_id: analysisId, is_task_2: true, question_type: "discussion", topic: "science_space_ethics", reason_zh: "题目明确要求讨论双方观点并给出自己的意见。", confidence: .96, needs_review: false },
        provider: "fixture", model: "task2-fixture", promptVersion: "guided-writing-task2-prompt-analysis-v1.1", schemaVersion: "guided-writing-task2-prompt-analysis.v1", inputTokens: 1, outputTokens: 1, latencyMs: 1,
      })) };
      const analyzed = await analyzeImportedTask2Prompt({ connection, analysisId, prompt, provider });
      expect(analyzed).toMatchObject({ status: "evaluated", analysis: { question_type: "discussion" } });
      const confirmed = confirmImportedTask2Prompt({ connection, analysisId, prompt, questionType: "opinion", topic: "environment_energy_animals" });
      expect(confirmed).toMatchObject({ created: true, prompt: { questionType: "opinion", prompt } });
      const session = startGuidedWritingSession({ connection, sessionId: crypto.randomUUID(), sourceEssayId: confirmed.prompt.sourceEssayId });
      expect(new GuidedWritingRepository(connection).getSession(session.id)).toMatchObject({ questionType: "opinion", promptSnapshot: prompt });
      const backup = exportFullBackup(connection);
      expect(backup).toMatchObject({ schema_version: "1.11.0", sources: expect.arrayContaining([expect.objectContaining({ id: confirmed.prompt.sourceEssayId, content_role: "guided_writing_prompt" })]), guided_writing_prompt_analyses: [expect.objectContaining({ id: analysisId })] });
      await restoreFullBackup(restored, backup, { rollbackDirectory: path.join(temporaryDirectory, "rollback-imported-prompt") });
      const restoredSource = new ContentRepository(restored).listSources().find((item) => item.id === confirmed.prompt.sourceEssayId);
      expect(restoredSource).toMatchObject({ ielts_prompt: prompt, question_type: "opinion", content_role: "guided_writing_prompt" });
    } finally { connection.close(); restored.close(); }
  });
});
