import { NextResponse } from "next/server";
import { z } from "zod";
import { AttemptIdConflictError, LearningRepository } from "../../../../db/learning-repository";
import { isAdaptiveNextStepEnabled } from "../../../../lib/adaptive-config";
import { selectAndRecordAdaptiveNextStep } from "../../../../lib/adaptive-training-service";
import { openAppDatabase } from "../../../../lib/app-database";

const attemptSchema = z.object({
  attemptId: z.string().uuid().optional(),
  exerciseType: z.literal("guided_application"),
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
    const result = new LearningRepository(connection).recordCollocationUse(parsed.data);
    if (!isAdaptiveNextStepEnabled()) return NextResponse.json(result);
    try {
      const decision = selectAndRecordAdaptiveNextStep(connection, {
        triggerKind: "collocation_attempt",
        attemptId: result.attemptId,
      });
      return NextResponse.json({ ...result, adaptiveNextStep: { action: decision.action, retest: decision.retest } });
    } catch {
      return NextResponse.json({ ...result, adaptiveNextStep: null });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存失败" },
      { status: error instanceof AttemptIdConflictError ? 409 : 500 },
    );
  } finally {
    connection.close();
  }
}
