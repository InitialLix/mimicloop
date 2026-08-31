import { NextResponse } from "next/server";
import { z } from "zod";
import { getUseEvaluatorConfig } from "../../../lib/ai/config";
import { openAppDatabase } from "../../../lib/app-database";
import {
  IdempotencyConflictError,
  UseEvaluationRequestError,
  evaluateUseAttempt,
} from "../../../lib/use-evaluation-service";

const inputSchema = z.object({
  attemptId: z.string().uuid(),
  exerciseRef: z.string().min(1).max(200),
  learnerAnswer: z.string().max(4_000),
  previousAttemptId: z.string().uuid().nullable().optional(),
}).strict();

export async function POST(request: Request) {
  const config = getUseEvaluatorConfig();
  if (!config.enabled) return NextResponse.json({ error: "Use Evaluator is disabled" }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const connection = await openAppDatabase(request);
  try {
    const result = await evaluateUseAttempt({ connection, ...parsed.data });
    return NextResponse.json(result, { status: result.status === "pending" ? 202 : 200 });
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof UseEvaluationRequestError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "评价失败" }, { status: 500 });
  } finally {
    connection.close();
  }
}
