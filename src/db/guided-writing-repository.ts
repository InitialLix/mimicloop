import { randomUUID } from "node:crypto";
import {
  argumentNodeOrder,
  emptyArgumentGraph,
  questionForNode,
  type ArgumentGraph,
  type ArgumentNodeKey,
  type GuidedWritingCoachAction,
  type GuidedWritingCoachEvaluationV1,
  type GuidedWritingSessionView,
  type GuidedWritingParagraphKey,
  type GuidedWritingTurnView,
} from "../domain/writing/guided-writing-coach";
import type { EssayQuestionType } from "../domain/writing/task-analysis";
import type { TraceStatus, TraceStep } from "./use-evaluation-repository";
import type { SqliteConnection } from "./client";

type StoredSession = Omit<GuidedWritingSessionView, "currentQuestionEn" | "developmentRelation" | "chainReview" | "turns"> & {
  learnerId: string;
  taskAnalysisVersion: string;
  promptSnapshot: string;
  questionType: EssayQuestionType;
  createdAt: string;
};

type StoredTurn = Omit<GuidedWritingTurnView, "model"> & {
  sessionId: string;
  inputHash: string;
  traceId: string;
  errorCode: string | null;
  completedAt: string | null;
  updatedAt: string;
};

export class GuidedWritingConflictError extends Error {}

function parseJson<T>(value: string | null): T | null {
  return value ? JSON.parse(value) as T : null;
}

export class GuidedWritingRepository {
  constructor(private readonly connection: SqliteConnection) {}

  createSession(input: {
    id: string;
    learnerId: string;
    sourceEssayId: string;
    paragraphKey: GuidedWritingParagraphKey;
    taskAnalysisVersion: string;
    promptSnapshot: string;
    questionType: EssayQuestionType;
    createdAt: string;
    initialGraph?: ArgumentGraph;
    initialNode?: ArgumentNodeKey;
  }) {
    const existing = this.getSession(input.id);
    if (existing) {
      if (existing.sourceEssayId !== input.sourceEssayId || existing.paragraphKey !== input.paragraphKey) {
        throw new GuidedWritingConflictError("Session ID was already used for another writing task");
      }
      return { created: false as const, session: existing };
    }
    this.connection.sqlite.prepare(
      `INSERT INTO guided_writing_sessions
       (id, learner_id, source_essay_id, paragraph_key, task_analysis_version, prompt_snapshot,
        question_type, status, current_node, argument_graph_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'building_argument', ?, ?, ?, ?)`,
    ).run(
      input.id,
      input.learnerId,
      input.sourceEssayId,
      input.paragraphKey,
      input.taskAnalysisVersion,
      input.promptSnapshot,
      input.questionType,
      input.initialNode ?? "stance",
      JSON.stringify(input.initialGraph ?? emptyArgumentGraph()),
      input.createdAt,
      input.createdAt,
    );
    return { created: true as const, session: this.getSession(input.id)! };
  }

  getSession(id: string): StoredSession | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id, learner_id AS learnerId, source_essay_id AS sourceEssayId,
              paragraph_key AS paragraphKey, task_analysis_version AS taskAnalysisVersion,
              prompt_snapshot AS promptSnapshot, question_type AS questionType, status,
              current_node AS currentNode, argument_graph_json AS argumentGraphJson,
              created_at AS createdAt, updated_at AS updatedAt
       FROM guided_writing_sessions WHERE id = ?`,
    ).get(id) as (Omit<StoredSession, "graph"> & { argumentGraphJson: string }) | undefined;
    if (!row) return null;
    const { argumentGraphJson, ...rest } = row;
    return { ...rest, graph: JSON.parse(argumentGraphJson) as ArgumentGraph };
  }

  getLatestActive(learnerId: string, sourceEssayId: string, paragraphKey?: GuidedWritingParagraphKey): StoredSession | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id FROM guided_writing_sessions
       WHERE learner_id = ? AND source_essay_id = ?
         AND (? IS NULL OR paragraph_key = ?)
         AND status IN ('building_argument', 'ready_to_draft')
       ORDER BY updated_at DESC, id DESC LIMIT 1`,
    ).get(learnerId, sourceEssayId, paragraphKey ?? null, paragraphKey ?? null) as { id: string } | undefined;
    return row ? this.getSession(row.id) : null;
  }

  reopenNode(input: { sessionId: string; node: ArgumentNodeKey; updatedAt: string }) {
    return this.connection.sqlite.transaction(() => {
      const session = this.getSession(input.sessionId);
      if (!session) throw new Error(`Unknown Guided Writing session: ${input.sessionId}`);
      if (!session.graph[input.node]) {
        throw new GuidedWritingConflictError("Only a saved argument step can be edited");
      }
      const activeRevisionIndex = session.currentNode && session.graph[session.currentNode]
        ? argumentNodeOrder.indexOf(session.currentNode)
        : -1;
      if (activeRevisionIndex >= 0 && argumentNodeOrder.indexOf(input.node) > activeRevisionIndex) {
        throw new GuidedWritingConflictError("Finish rechecking the earlier step before moving further down the argument");
      }
      const pending = this.connection.sqlite.prepare(
        "SELECT id FROM guided_writing_turns WHERE session_id = ? AND status = 'pending' LIMIT 1",
      ).get(session.id) as { id: string } | undefined;
      if (pending) throw new GuidedWritingConflictError("Wait for the current answer check to finish before editing another step");
      this.connection.sqlite.prepare(
        `UPDATE guided_writing_sessions
         SET status = 'building_argument', current_node = ?, updated_at = ?
         WHERE id = ?`,
      ).run(input.node, input.updatedAt, session.id);
      return this.view(session.id)!;
    })();
  }

  cancelUnchangedRevision(input: { sessionId: string; updatedAt: string }) {
    return this.connection.sqlite.transaction(() => {
      const session = this.getSession(input.sessionId);
      if (!session) throw new Error(`Unknown Guided Writing session: ${input.sessionId}`);
      if (session.status !== "building_argument" || !session.currentNode || !session.graph[session.currentNode]) {
        throw new GuidedWritingConflictError("There is no unchanged argument edit to cancel");
      }
      if (argumentNodeOrder.some((node) => !session.graph[node])) {
        throw new GuidedWritingConflictError("The argument chain is not complete");
      }
      const pending = this.connection.sqlite.prepare(
        "SELECT id FROM guided_writing_turns WHERE session_id = ? AND status = 'pending' LIMIT 1",
      ).get(session.id) as { id: string } | undefined;
      if (pending) throw new GuidedWritingConflictError("Wait for the current answer check to finish");
      const lastTurn = this.listTurns(session.id).at(-1);
      if (lastTurn?.action?.chainReview?.verdict !== "ready") {
        throw new GuidedWritingConflictError("This argument has changed or still needs rechecking");
      }
      this.connection.sqlite.prepare(
        `UPDATE guided_writing_sessions
         SET status = 'ready_to_draft', current_node = NULL, updated_at = ?
         WHERE id = ?`,
      ).run(input.updatedAt, session.id);
      return this.view(session.id)!;
    })();
  }

  getTurn(id: string): StoredTurn | null {
    const row = this.connection.sqlite.prepare(
      `SELECT id, session_id AS sessionId, node, question_en AS questionEn,
              learner_answer AS learnerAnswer, origin, input_hash AS inputHash, status,
              evaluation_json AS evaluationJson, action_json AS actionJson, trace_id AS traceId,
              error_code AS errorCode, created_at AS createdAt, completed_at AS completedAt,
              updated_at AS updatedAt
       FROM guided_writing_turns WHERE id = ?`,
    ).get(id) as (Omit<StoredTurn, "evaluation" | "action"> & {
      evaluationJson: string | null;
      actionJson: string | null;
    }) | undefined;
    if (!row) return null;
    const { evaluationJson, actionJson, ...rest } = row;
    return {
      ...rest,
      evaluation: parseJson<GuidedWritingCoachEvaluationV1>(evaluationJson),
      action: parseJson<GuidedWritingCoachAction>(actionJson),
    };
  }

  listTurns(sessionId: string): GuidedWritingTurnView[] {
    const ids = this.connection.sqlite.prepare(
      `SELECT id FROM guided_writing_turns WHERE session_id = ? ORDER BY created_at, id`,
    ).all(sessionId) as Array<{ id: string }>;
    return ids.map(({ id }) => {
      const turn = this.getTurn(id)!;
      const trace = this.connection.sqlite.prepare("SELECT model FROM agent_traces WHERE id = ?")
        .get(turn.traceId) as { model: string | null } | undefined;
      return {
        id: turn.id,
        node: turn.node,
        questionEn: turn.questionEn,
        learnerAnswer: turn.learnerAnswer,
        origin: turn.origin,
        status: turn.status,
        evaluation: turn.evaluation,
        action: turn.action,
        model: trace?.model ?? null,
        createdAt: turn.createdAt,
      };
    });
  }

  view(sessionId: string): GuidedWritingSessionView | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    const turns = this.listTurns(session.id);
    const lastTurn = turns.at(-1);
    const retryIssue = lastTurn?.evaluation?.verdict !== "accept" ? lastTurn?.evaluation?.issue_type : undefined;
    const developmentRelation = turns.slice().reverse()
      .find((turn) => turn.action?.developmentRelation)?.action?.developmentRelation ?? null;
    const latestChainReview = turns.slice().reverse()
      .find((turn) => turn.action?.chainReview)?.action?.chainReview ?? null;
    const chainReview = session.status === "ready_to_draft"
      || (lastTurn?.action?.chainReview?.verdict === "return_to_node"
        && lastTurn.action.nextNode === session.currentNode)
      ? latestChainReview
      : null;
    const actionQuestion = lastTurn?.action?.nextNode === session.currentNode
      ? lastTurn.action.nextQuestionEn
      : null;
    const reuseSuggestion = lastTurn?.action?.reuseSuggestion?.targetNode === session.currentNode
      ? lastTurn.action.reuseSuggestion
      : null;
    return {
      id: session.id,
      sourceEssayId: session.sourceEssayId,
      paragraphKey: session.paragraphKey,
      status: session.status,
      currentNode: session.currentNode,
      currentQuestionEn: session.currentNode
        ? actionQuestion ?? questionForNode(session.currentNode, retryIssue, {
            questionType: session.questionType,
            paragraphKey: session.paragraphKey,
            developmentRelation,
          })
        : null,
      developmentRelation,
      chainReview,
      reuseSuggestion,
      graph: session.graph,
      turns,
      updatedAt: session.updatedAt,
    };
  }

  beginTurn(input: {
    id: string;
    sessionId: string;
    inputHash: string;
    questionEn: string;
    learnerAnswer: string;
    learnerIdHash: string;
    provider: string | null;
    model: string | null;
    promptVersion: string;
    schemaVersion: string;
    startedAt: string;
  }) {
    return this.connection.sqlite.transaction(() => {
      const existing = this.getTurn(input.id);
      if (existing) {
        if (existing.sessionId !== input.sessionId || existing.inputHash !== input.inputHash) {
          throw new GuidedWritingConflictError("Turn ID was already used with different input");
        }
        return { created: false as const, turn: existing };
      }
      const session = this.getSession(input.sessionId);
      if (!session || session.status !== "building_argument" || !session.currentNode) {
        throw new GuidedWritingConflictError("This writing session is not accepting another planning answer");
      }
      const traceId = randomUUID();
      this.connection.sqlite.prepare(
        `INSERT INTO agent_traces
         (id, learner_id_hash, feature, status, started_at, completed_at, steps_json,
          provider, model, prompt_version, schema_version, input_tokens, output_tokens,
          error_codes_json, created_at, updated_at)
         VALUES (?, ?, 'guided_writing_coach', 'pending', ?, NULL, '[]', ?, ?, ?, ?, NULL, NULL, '[]', ?, ?)`,
      ).run(
        traceId, input.learnerIdHash, input.startedAt, input.provider, input.model,
        input.promptVersion, input.schemaVersion, input.startedAt, input.startedAt,
      );
      this.connection.sqlite.prepare(
        `INSERT INTO guided_writing_turns
         (id, session_id, node, question_en, learner_answer, origin, input_hash, status,
          evaluation_json, action_json, trace_id, error_code, created_at, completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'user_after_question', ?, 'pending', NULL, NULL, ?, NULL, ?, NULL, ?)`,
      ).run(
        input.id, input.sessionId, session.currentNode, input.questionEn, input.learnerAnswer,
        input.inputHash, traceId, input.startedAt, input.startedAt,
      );
      return { created: true as const, turn: this.getTurn(input.id)! };
    })();
  }

  finalizeTurn(input: {
    turnId: string;
    status: TraceStatus;
    evaluation: GuidedWritingCoachEvaluationV1 | null;
    action: GuidedWritingCoachAction | null;
    errorCode: string | null;
    steps: TraceStep[];
    provider?: string | null;
    model?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    completedAt: string;
  }) {
    this.connection.sqlite.transaction(() => {
      const turn = this.getTurn(input.turnId);
      if (!turn) throw new Error(`Unknown Guided Writing turn: ${input.turnId}`);
      const session = this.getSession(turn.sessionId);
      if (!session) throw new Error(`Unknown Guided Writing session: ${turn.sessionId}`);
      if (input.status === "success" && input.evaluation?.verdict === "accept" && input.action) {
        if (session.currentNode !== turn.node) throw new GuidedWritingConflictError("Writing session advanced concurrently");
        const graph = { ...session.graph, [turn.node]: {
          content: input.evaluation.accepted_span ?? turn.learnerAnswer,
          origin: turn.origin,
          turnId: turn.id,
        } };
        this.connection.sqlite.prepare(
          `UPDATE guided_writing_sessions SET status = ?, current_node = ?, argument_graph_json = ?, updated_at = ?
           WHERE id = ?`,
        ).run(
          input.action.type === "READY_TO_DRAFT" ? "ready_to_draft" : "building_argument",
          input.action.nextNode,
          JSON.stringify(graph),
          input.completedAt,
          session.id,
        );
      } else {
        this.connection.sqlite.prepare(
          "UPDATE guided_writing_sessions SET updated_at = ? WHERE id = ?",
        ).run(input.completedAt, session.id);
      }
      this.connection.sqlite.prepare(
        `UPDATE guided_writing_turns SET status = ?, evaluation_json = ?, action_json = ?,
         error_code = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
      ).run(
        input.status,
        input.evaluation ? JSON.stringify(input.evaluation) : null,
        input.action ? JSON.stringify(input.action) : null,
        input.errorCode,
        input.completedAt,
        input.completedAt,
        input.turnId,
      );
      this.connection.sqlite.prepare(
        `UPDATE agent_traces SET status = ?, completed_at = ?, steps_json = ?,
         provider = COALESCE(?, provider), model = COALESCE(?, model), input_tokens = ?,
         output_tokens = ?, error_codes_json = ?, updated_at = ? WHERE id = ?`,
      ).run(
        input.status,
        input.completedAt,
        JSON.stringify(input.steps),
        input.provider ?? null,
        input.model ?? null,
        input.inputTokens ?? null,
        input.outputTokens ?? null,
        JSON.stringify(input.errorCode ? [input.errorCode] : []),
        input.completedAt,
        turn.traceId,
      );
    })();
    return this.view(this.getTurn(input.turnId)!.sessionId)!;
  }
}
