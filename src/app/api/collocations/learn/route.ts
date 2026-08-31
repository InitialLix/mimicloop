import { NextResponse } from "next/server";
import { z } from "zod";
import { LearningRepository } from "../../../../db/learning-repository";
import { openAppDatabase } from "../../../../lib/app-database";

const inputSchema = z.object({ collocationId: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const connection = await openAppDatabase(request);
  try {
    return NextResponse.json(new LearningRepository(connection).markCollocationLearned(parsed.data.collocationId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 500 });
  } finally {
    connection.close();
  }
}
