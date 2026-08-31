import { NextResponse } from "next/server";
import { z } from "zod";
import { GuidedWritingConflictError } from "../../../../db/guided-writing-repository";
import { getGuidedWritingConfig } from "../../../../lib/ai/config";
import { openAppDatabase } from "../../../../lib/app-database";
import {
  evaluateGuidedWritingIntroduction,
  getGuidedWritingIntroductionWorkspace,
} from "../../../../lib/guided-writing-introduction-service";
import { GuidedWritingRequestError } from "../../../../lib/guided-writing-service";

const submitSchema = z.object({
  sourceEssayId: z.string().min(1).max(200),
  draftId: z.string().uuid(),
  components: z.object({
    opening: z.string().max(1_500),
    taskFraming: z.string().min(1).max(1_500),
    thesis: z.string().min(1).max(1_500),
  }).strict(),
}).strict();

export async function GET(request: Request) {
  const sourceEssayId = new URL(request.url).searchParams.get("sourceEssayId");
  if (!sourceEssayId || !z.string().min(1).max(200).safeParse(sourceEssayId).success) {
    return NextResponse.json({ error: "A valid sourceEssayId is required" }, { status: 400 });
  }
  const connection = await openAppDatabase(request);
  try {
    return NextResponse.json(getGuidedWritingIntroductionWorkspace(connection, sourceEssayId));
  } catch (error) {
    if (error instanceof GuidedWritingRequestError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load introduction workspace" }, { status: 500 });
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
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const connection = await openAppDatabase(request);
  try {
    const result = await evaluateGuidedWritingIntroduction({ connection, ...parsed.data });
    return NextResponse.json(result, { status: result.status === "pending" ? 202 : 200 });
  } catch (error) {
    if (error instanceof GuidedWritingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof GuidedWritingRequestError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check introduction" }, { status: 500 });
  } finally {
    connection.close();
  }
}
