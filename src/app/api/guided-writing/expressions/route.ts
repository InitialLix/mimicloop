import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuidedWritingConfig } from "../../../../lib/ai/config";
import { openAppDatabase } from "../../../../lib/app-database";
import { isWritingLanguageNode } from "../../../../domain/writing/learned-expression-retrieval";
import { retrieveSelectedWritingAssets } from "../../../../lib/guided-writing-expression-selection-service";
import { GuidedWritingRequestError } from "../../../../lib/guided-writing-service";

function unavailable() {
  return NextResponse.json({ error: "Guided Writing Agent is disabled" }, { status: 404 });
}

async function retrieve(request: Request, input: { sessionId: string; node: string; learnerDraft?: string }) {
  if (!z.string().uuid().safeParse(input.sessionId).success) {
    return NextResponse.json({ error: "A valid sessionId is required" }, { status: 400 });
  }
  if (!isWritingLanguageNode(input.node)) {
    return NextResponse.json({ error: "node must be claim, reason, mechanism or result" }, { status: 400 });
  }
  if ((input.learnerDraft?.length ?? 0) > 1_200) {
    return NextResponse.json({ error: "Keep the node draft under 1,200 characters" }, { status: 400 });
  }
  const connection = await openAppDatabase(request);
  try {
    return NextResponse.json({ retrieval: await retrieveSelectedWritingAssets({
      connection,
      sessionId: input.sessionId,
      node: input.node,
      learnerDraft: input.learnerDraft,
    }) });
  } catch (error) {
    if (error instanceof GuidedWritingRequestError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to retrieve corpus expressions" }, { status: 500 });
  } finally {
    connection.close();
  }
}

export async function GET(request: Request) {
  if (!getGuidedWritingConfig().enabled) {
    return unavailable();
  }
  const url = new URL(request.url);
  return await retrieve(request, {
    sessionId: url.searchParams.get("sessionId") ?? "",
    node: url.searchParams.get("node") ?? "",
  });
}

export async function POST(request: Request) {
  if (!getGuidedWritingConfig().enabled) return unavailable();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const parsed = z.object({
    sessionId: z.string(),
    node: z.string(),
    learnerDraft: z.string().max(1_200).optional(),
  }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "sessionId, node and an optional learnerDraft are required" }, { status: 400 });
  }
  return await retrieve(request, parsed.data);
}
