import { NextResponse } from "next/server";
import { z } from "zod";
import { task2Topics } from "../../../../domain/writing/imported-task2-prompt";
import { openAppDatabase } from "../../../../lib/app-database";
import { confirmImportedTask2Prompt } from "../../../../lib/guided-writing-prompt-import-service";
import { GuidedWritingRequestError } from "../../../../lib/guided-writing-service";

const schema = z.object({ analysisId: z.string().uuid(), prompt: z.string(), questionType: z.enum(["opinion", "discussion", "advantages_disadvantages", "causes_solutions", "positive_negative_development", "two_part_multi_part"]), topic: z.enum(task2Topics) }).strict();
export async function POST(request: Request) {
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const connection = await openAppDatabase(request);
  try { return NextResponse.json(confirmImportedTask2Prompt({ connection, analysisId: parsed.data.analysisId, prompt: parsed.data.prompt, questionType: parsed.data.questionType, topic: parsed.data.topic })); }
  catch (error) { if (error instanceof GuidedWritingRequestError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode }); return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save prompt" }, { status: 500 }); }
  finally { connection.close(); }
}
