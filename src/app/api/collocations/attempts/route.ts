import { NextResponse } from "next/server";
import { z } from "zod";
import { LearningRepository } from "../../../../db/learning-repository";
import { openAppDatabase } from "../../../../lib/app-database";

const attemptSchema = z.object({
  collocationId: z.string().uuid(),
  promptSnapshot: z.string().min(1),
  userAnswer: z.string(),
  selfRating: z.enum(["forgot", "fuzzy", "recalled", "can_use"]),
  hintUsed: z.boolean(),
  durationMs: z.number().int().nonnegative().nullable(),
});

export async function POST(request: Request) {
  const parsed = attemptSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const connection = await openAppDatabase(request);
  try {
    return NextResponse.json(new LearningRepository(connection).recordCollocationRecall(parsed.data));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 500 });
  } finally {
    connection.close();
  }
}
