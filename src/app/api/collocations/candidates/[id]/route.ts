import { z } from "zod";
import { submitCollocationReview } from "../../../../../lib/app-data";
import type { CollocationReviewFields } from "../../../../../lib/content-types";
import { isCompetitionMode } from "../../../../../lib/competition-mode";

const nullableText = z.string().max(1000).nullable();
const reviewSchema = z.object({
  action: z.enum(["save", "approve", "defer", "reject", "merge"]),
  expectedRevision: z.number().int().positive(),
  reason: z.string().trim().min(1).max(1000),
  mergeTargetId: z.string().uuid().nullable().optional(),
  fields: z.object({
    canonicalText: z.string().trim().min(2).max(200),
    translationPrompt: z.string().trim().min(1).max(240),
    pattern: nullableText,
    slots: z.array(z.object({
      name: z.string().regex(/^[a-z][a-z0-9_]*$/),
      role_zh: z.string().min(1).max(120),
      replacement_examples: z.array(z.string().min(1).max(160)).min(2).max(8),
    })).max(6),
    expressionType: z.enum(["collocation", "fixed_phrase", "sentence_frame"]),
    grammarPattern: nullableText,
    usageNote: nullableText,
    commonError: nullableText,
    acceptedAnswers: z.array(z.string().trim().min(2).max(200)).min(1).max(12),
    topics: z.array(z.string().min(1).max(100)).min(1),
    argumentFunctions: z.array(z.string().min(1).max(100)),
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
    const candidate = await submitCollocationReview(id, {
      ...parsed.data,
      fields: parsed.data.fields as CollocationReviewFields,
    });
    return Response.json({ candidate });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "搭配审核失败。" }, { status: 400 });
  }
}
