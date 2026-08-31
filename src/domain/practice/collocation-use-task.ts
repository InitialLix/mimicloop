import type { CollocationData } from "../../lib/content-types";

export type CollocationUseTask = {
  exerciseType: "guided_application";
  guidedPrompt: {
    text: string;
    hints: Array<{ zh: string; en: string }>;
  };
  targetSurface: string;
  referenceAnswer: string;
  transferType: "slot_replacement" | "cross_topic";
};

export function buildCollocationUseTask(collocation: CollocationData): CollocationUseTask {
  const seed = collocation.exercise_seed.guided_application;
  if (!seed) throw new Error(`Collocation ${collocation.id} is missing a reviewed guided application exercise`);
  return {
    exerciseType: "guided_application",
    guidedPrompt: { text: seed.prompt_zh, hints: seed.hints },
    targetSurface: seed.target_surface,
    referenceAnswer: seed.reference_answer,
    transferType: seed.transfer_type,
  };
}
