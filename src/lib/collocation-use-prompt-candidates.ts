import fs from "node:fs/promises";
import path from "node:path";

export type CollocationUsePromptCandidate = {
  collocation_id: string;
  prompt_zh: string;
  hints: Array<{ zh: string; en: string }>;
  target_surface: string;
  reference_answer: string;
  transfer_type: "slot_replacement" | "cross_topic";
  review_status: "candidate" | "approved" | "needs_edit" | "rejected";
  review_history: Array<{
    action: "created" | "approved" | "edited" | "rejected";
    reviewer: string;
    reason: string;
    reviewed_at: string;
  }>;
};

export async function loadCollocationUsePromptCandidates() {
  const filePath = path.join(process.cwd(), "data", "collocation_use_prompt_candidates.json");
  return JSON.parse(await fs.readFile(filePath, "utf8")) as {
    schema_version: "1.0.0";
    generated_at: string;
    items: CollocationUsePromptCandidate[];
  };
}
