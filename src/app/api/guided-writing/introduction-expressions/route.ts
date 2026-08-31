import { NextResponse } from "next/server";
import { z } from "zod";
import { isIntroductionLanguagePart } from "../../../../domain/writing/introduction-language-activation";
import { getGuidedWritingConfig } from "../../../../lib/ai/config";
import { openAppDatabase } from "../../../../lib/app-database";
import { retrieveSelectedIntroductionWritingAssets } from "../../../../lib/guided-writing-introduction-expression-service";
import { GuidedWritingRequestError } from "../../../../lib/guided-writing-service";

async function retrieve(request: Request, input: { sourceEssayId: string; part: string; learnerDraft?: string }) {
  if (!z.string().min(1).max(200).safeParse(input.sourceEssayId).success) {
    return NextResponse.json({ error: "A valid sourceEssayId is required" }, { status: 400 });
  }
  if (!isIntroductionLanguagePart(input.part)) {
    return NextResponse.json({ error: "part must be opening, task_framing or thesis" }, { status: 400 });
  }
  if ((input.learnerDraft?.length ?? 0) > 1_500) {
    return NextResponse.json({ error: "Keep the introduction part under 1,500 characters" }, { status: 400 });
  }
  const connection = await openAppDatabase(request);
  try {
    return NextResponse.json({ retrieval: await retrieveSelectedIntroductionWritingAssets({
      connection,
      sourceEssayId: input.sourceEssayId,
      part: input.part,
      learnerDraft: input.learnerDraft,
    }) });
  } catch (error) {
    if (error instanceof GuidedWritingRequestError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to retrieve introduction language" }, { status: 500 });
  } finally {
    connection.close();
  }
}

export async function GET(request: Request) {
  if (!getGuidedWritingConfig().enabled) {
    return NextResponse.json({ error: "Guided Writing Agent is disabled" }, { status: 404 });
  }
  const url = new URL(request.url);
  return await retrieve(request, {
    sourceEssayId: url.searchParams.get("sourceEssayId") ?? "",
    part: url.searchParams.get("part") ?? "",
  });
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
    sourceEssayId: z.string(),
    part: z.string(),
    learnerDraft: z.string().max(1_500).optional(),
  }).strict().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "sourceEssayId, part and an optional learnerDraft are required" }, { status: 400 });
  return await retrieve(request, parsed.data);
}
