export type UseTaskChunk = {
  text: string;
  meaning_zh: string;
};

export type UseTaskHint = {
  zh: string;
  en: string;
};

export type GuidedPrompt = {
  text: string;
  hints: UseTaskHint[];
};

export type UseTaskSlot = {
  name: string;
  role_zh: string;
};

export type UseTaskCard = {
  id: string;
  learning_sentence: string;
  primary_focus: "vocabulary" | "structure" | "mixed";
  chunks: UseTaskChunk[];
  pattern: string | null;
  slots: UseTaskSlot[];
  simplified_version: string | null;
  transfer_example: string | null;
  exercise_seed: {
    chunk_cloze?: Array<{
      chunk_text: string;
      prompt_sentence: string;
      reference_answer: string;
    }>;
    slot_replacement?: Array<{
      prompt_zh: string;
      hints?: UseTaskHint[];
      feedback_pattern?: string;
      slot_values: Array<{ slot_name: string; value: string }>;
      reference_answer: string;
    }>;
    guided_application?: {
      prompt_zh: string;
      hints: UseTaskHint[];
      target_chunk: string;
      reference_answer: string;
    };
  };
};

export type UseTask =
  | {
      mode: "structure";
      exerciseType: "slot_replacement";
      guidedPrompt: GuidedPrompt | null;
      referenceAnswer: string;
      pattern: string;
      slotValues: Array<{ name: string; roleZh: string; value: string }>;
      targetChunks: UseTaskChunk[];
    }
  | {
      mode: "vocabulary";
      exerciseType: "guided_application";
      guidedPrompt: GuidedPrompt | null;
      referenceAnswer: string;
      targetChunks: UseTaskChunk[];
    };

export function buildUseTask(card: UseTaskCard): UseTask {
  if (card.primary_focus !== "vocabulary") {
    const seed = card.exercise_seed.slot_replacement?.[0];
    if (!card.pattern || !seed) throw new Error(`Card ${card.id} is missing a reviewed slot replacement exercise`);
    return {
      mode: "structure",
      exerciseType: "slot_replacement",
      guidedPrompt: seed.hints?.length ? { text: seed.prompt_zh, hints: seed.hints } : null,
      referenceAnswer: seed.reference_answer,
      pattern: seed.feedback_pattern ?? card.pattern,
      slotValues: seed.slot_values.map((slotValue) => ({
        name: slotValue.slot_name,
        roleZh: card.slots.find((slot) => slot.name === slotValue.slot_name)?.role_zh ?? slotValue.slot_name,
        value: slotValue.value,
      })),
      targetChunks: card.primary_focus === "mixed" ? card.chunks : [],
    };
  }

  const guidedSeed = card.exercise_seed.guided_application;
  const targetText = guidedSeed?.target_chunk ?? card.exercise_seed.chunk_cloze?.[0]?.chunk_text ?? card.chunks[0]?.text;
  if (!targetText) throw new Error(`Card ${card.id} is missing a reviewed vocabulary target`);
  const targetChunk = card.chunks.find((chunk) => chunk.text === targetText) ?? card.chunks[0];
  return {
    mode: "vocabulary",
    exerciseType: "guided_application",
    guidedPrompt: guidedSeed ? { text: guidedSeed.prompt_zh, hints: guidedSeed.hints } : null,
    referenceAnswer: guidedSeed?.reference_answer ?? card.transfer_example ?? card.simplified_version ?? card.learning_sentence,
    targetChunks: targetChunk ? [targetChunk] : [],
  };
}
