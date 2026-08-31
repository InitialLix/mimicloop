import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuidedWritingConfig } from "../../../../lib/ai/config";
import { openAppDatabase } from "../../../../lib/app-database";
import {
  GuidedWritingConflictError,
  GuidedWritingRequestError,
  answerGuidedWritingTurn,
} from "../../../../lib/guided-writing-service";

const answerSchema = z.object({
  sessionId: z.string().uuid(),
  turnId: z.string().uuid(),
  learnerAnswer: z.string().min(1).max(1_200),
}).strict();

export async function POST(request: Request) {
  if (!getGuidedWritingConfig().enabled) {
    return NextResponse.json({ error: "Guided Writing Agent is disabled" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const connection = await openAppDatabase(request);
  try {
    const result = await answerGuidedWritingTurn({ connection, ...parsed.data });
    return NextResponse.json(result, { status: result.status === "pending" ? 202 : 200 });
  } catch (error) {
    if (error instanceof GuidedWritingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof GuidedWritingRequestError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check this idea" }, { status: 500 });
  } finally {
    connection.close();
  }
}
