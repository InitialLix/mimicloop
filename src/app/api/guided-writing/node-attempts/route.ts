import { NextResponse } from "next/server";
import { z } from "zod";
import { GuidedWritingConflictError } from "../../../../db/guided-writing-repository";
import type { NodeHintLevel } from "../../../../domain/writing/node-language-activation";
import type { WritingLanguageNode } from "../../../../domain/writing/learned-expression-retrieval";
import { getGuidedWritingConfig } from "../../../../lib/ai/config";
import { openAppDatabase } from "../../../../lib/app-database";
import {
  evaluateGuidedWritingNodeLanguage,
  getGuidedWritingNodeLanguageAttempts,
} from "../../../../lib/guided-writing-node-language-service";
import { GuidedWritingRequestError } from "../../../../lib/guided-writing-service";

function errorResponse(error: unknown) {
  if (error instanceof GuidedWritingRequestError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
  }
  if (error instanceof GuidedWritingConflictError) {
    return NextResponse.json({ error: error.message, code: "CONFLICT" }, { status: 409 });
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process this node" }, { status: 500 });
}

export async function GET(request: Request) {
  if (!getGuidedWritingConfig().enabled) {
    return NextResponse.json({ error: "Guided Writing Agent is disabled" }, { status: 404 });
  }
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId || !z.string().uuid().safeParse(sessionId).success) {
    return NextResponse.json({ error: "A valid sessionId is required" }, { status: 400 });
  }
  const connection = await openAppDatabase(request);
  try {
    return NextResponse.json({ attempts: getGuidedWritingNodeLanguageAttempts(connection, sessionId) });
  } catch (error) {
    return errorResponse(error);
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
  const parsed = z.object({
    sessionId: z.string().uuid(),
    attemptId: z.string().uuid(),
    node: z.enum(["claim", "reason", "mechanism", "result"]),
    learnerText: z.string().min(1).max(1_200),
    assetType: z.enum(["sentence", "collocation"]).nullable(),
    assetId: z.string().uuid().nullable(),
    hintLevel: z.number().int().min(0).max(4),
  }).safeParse(body);
  if (!parsed.success || Boolean(parsed.data?.assetType) !== Boolean(parsed.data?.assetId)) {
    return NextResponse.json({ error: "Invalid node language attempt" }, { status: 400 });
  }
  const connection = await openAppDatabase(request);
  try {
    const result = await evaluateGuidedWritingNodeLanguage({
      connection,
      ...parsed.data,
      node: parsed.data.node as WritingLanguageNode,
      hintLevel: parsed.data.hintLevel as NodeHintLevel,
    });
    return NextResponse.json(result, { status: result.status === "pending" ? 202 : 200 });
  } catch (error) {
    return errorResponse(error);
  } finally {
    connection.close();
  }
}
