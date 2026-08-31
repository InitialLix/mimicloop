import { NextResponse } from "next/server";
import { z } from "zod";
import { openAppDatabase } from "../../../../../lib/app-database";
import { analyzeImportedTask2Prompt } from "../../../../../lib/guided-writing-prompt-import-service";
import { GuidedWritingRequestError } from "../../../../../lib/guided-writing-service";

const schema = z.object({ analysisId: z.string().uuid(), prompt: z.string() }).strict();
export async function POST(request: Request) {
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const connection = await openAppDatabase(request);
  try { return NextResponse.json(await analyzeImportedTask2Prompt({ connection, ...parsed.data })); }
  catch (error) { if (error instanceof GuidedWritingRequestError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode }); return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to analyze prompt" }, { status: 500 }); }
  finally { connection.close(); }
}
