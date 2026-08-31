import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuidedWritingConfig } from "../../../../lib/ai/config";
import { openAppDatabase } from "../../../../lib/app-database";
import {
  cancelUnchangedGuidedWritingRevision,
  GuidedWritingConflictError,
  GuidedWritingRequestError,
  getLatestGuidedWritingSession,
  reopenGuidedWritingNode,
  startGuidedWritingSession,
} from "../../../../lib/guided-writing-service";

const startSchema = z.object({
  sessionId: z.string().uuid(),
  sourceEssayId: z.string().uuid(),
  paragraphKey: z.enum(["body_1", "body_2"]).optional(),
  fromSessionId: z.string().uuid().optional(),
}).strict();

const reviseSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reopen_node"),
    sessionId: z.string().uuid(),
    node: z.enum(["stance", "claim", "reason", "mechanism", "result"]),
  }).strict(),
  z.object({
    action: z.literal("cancel_unchanged_revision"),
    sessionId: z.string().uuid(),
  }).strict(),
]);

export async function GET(request: Request) {
  const sourceEssayId = new URL(request.url).searchParams.get("sourceEssayId");
  const paragraphKeyValue = new URL(request.url).searchParams.get("paragraphKey");
  if (!sourceEssayId || !z.string().uuid().safeParse(sourceEssayId).success) {
    return NextResponse.json({ error: "A valid sourceEssayId is required" }, { status: 400 });
  }
  const paragraphKey = paragraphKeyValue === null
    ? undefined
    : z.enum(["body_1", "body_2"]).safeParse(paragraphKeyValue);
  if (paragraphKey && !paragraphKey.success) {
    return NextResponse.json({ error: "paragraphKey must be body_1 or body_2" }, { status: 400 });
  }
  const connection = await openAppDatabase(request);
  try {
    return NextResponse.json({
      session: getLatestGuidedWritingSession(connection, sourceEssayId, paragraphKey?.data),
    });
  } finally {
    connection.close();
  }
}

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
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const connection = await openAppDatabase(request);
  try {
    return NextResponse.json({ session: startGuidedWritingSession({ connection, ...parsed.data }) });
  } catch (error) {
    if (error instanceof GuidedWritingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof GuidedWritingRequestError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start writing session" }, { status: 500 });
  } finally {
    connection.close();
  }
}

export async function PATCH(request: Request) {
  if (!getGuidedWritingConfig().enabled) {
    return NextResponse.json({ error: "Guided Writing Agent is disabled" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const parsed = reviseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const connection = await openAppDatabase(request);
  try {
    return NextResponse.json({
      session: parsed.data.action === "reopen_node"
        ? reopenGuidedWritingNode({ connection, sessionId: parsed.data.sessionId, node: parsed.data.node })
        : cancelUnchangedGuidedWritingRevision({ connection, sessionId: parsed.data.sessionId }),
    });
  } catch (error) {
    if (error instanceof GuidedWritingRequestError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to revise writing session" }, { status: 500 });
  } finally {
    connection.close();
  }
}
