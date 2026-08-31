import { z } from "zod";
import { submitCandidateReview } from "../../../../lib/app-data";
import type { CandidateReviewFields } from "../../../../lib/content-types";
import { isCompetitionMode } from "../../../../lib/competition-mode";

const nullableText = z.string().max(4000).nullable();
const reviewSchema = z.object({
  action: z.enum(["save", "approve", "defer", "reject"]),
  expectedRevision: z.number().int().positive(),
  reason: z.string().trim().min(1).max(1000),
  fields: z.object({
    translationZh: z.string().trim().min(1).max(1000),
    chunks: z.array(z.object({
      text: z.string().min(1).max(200),
      meaning_zh: z.string().min(1).max(500),
      note: z.string().max(500),
    })),
    pattern: nullableText,
    slots: z.array(z.object({
      name: z.string().regex(/^[a-z][a-z0-9_]*$/),
      role_zh: z.string().min(1).max(200),
      original_value: z.string().min(1).max(500),
      replacement_examples: z.array(z.string().min(1).max(500)).min(1),
    })),
    grammarNote: nullableText,
    usageNote: nullableText,
    simplifiedVersion: nullableText,
    transferExample: nullableText,
    exerciseSeed: z.record(z.string(), z.unknown()),
    uncertainties: z.array(z.string().min(1).max(500)),
  }),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (isCompetitionMode()) return Response.json({ error: "Not Found" }, { status: 404 });
  try {
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "提交内容格式不正确。", details: parsed.error.flatten() }, { status: 400 });
    }
    const { id } = await context.params;
    const candidate = await submitCandidateReview(id, {
      ...parsed.data,
      fields: parsed.data.fields as CandidateReviewFields,
    });
    return Response.json({ candidate });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "候选审核失败。" }, { status: 400 });
  }
}
