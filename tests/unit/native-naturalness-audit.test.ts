import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const audit = workspaceFile("sources/metadata/native-naturalness-audit-2026-08-18.md");
const [sentenceSection, collocationRemainder] = audit.split("## Collocation Use：建议退回修改");
const [collocationSection] = collocationRemainder.split("## 人工审核动作");

const sentenceIds = [...sentenceSection.matchAll(/\| `([0-9a-f-]{36})` \|/g)].map((match) => match[1]);
const collocationIds = [...collocationSection.matchAll(/\| `([0-9a-f-]{36})` \/ `/g)].map((match) => match[1]);

describe("native-naturalness audit baseline", () => {
  it("keeps the new review priority in the permanent project rules", () => {
    const rules = workspaceFile("AGENTS.md");
    const naturalness = rules.indexOf("现代英语自然度");
    const semantics = rules.indexOf("语义逻辑", naturalness);
    const formalWriting = rules.indexOf("IELTS/正式写作适用性", semantics);
    const structureFidelity = rules.indexOf("原结构保留程度", formalWriting);

    expect(naturalness).toBeGreaterThan(-1);
    expect(semantics).toBeGreaterThan(naturalness);
    expect(formalWriting).toBeGreaterThan(semantics);
    expect(structureFidelity).toBeGreaterThan(formalWriting);
    expect(rules).toContain("语法正确但不够自然不得批准");
  });

  it("references unique approved sentence and collocation records", () => {
    const cards = JSON.parse(workspaceFile("data/approved_cards.seed.json")) as Array<{ id: string }>;
    const collocations = JSON.parse(workspaceFile("data/approved_collocations.seed.json")) as Array<{ id: string }>;
    const cardIds = new Set(cards.map(({ id }) => id));
    const approvedCollocationIds = new Set(collocations.map(({ id }) => id));

    expect(sentenceIds).toHaveLength(47);
    expect(new Set(sentenceIds).size).toBe(sentenceIds.length);
    expect(sentenceIds.every((id) => cardIds.has(id))).toBe(true);

    expect(collocationIds).toHaveLength(34);
    expect(new Set(collocationIds).size).toBe(collocationIds.length);
    expect(collocationIds.every((id) => approvedCollocationIds.has(id))).toBe(true);
  });

  it("records the user's approval and the deterministic application path", () => {
    expect(audit).toContain("状态：`approved_applied`");
    expect(audit).toContain("用户已于 2026-08-18 批准整批修改");
    expect(audit).toContain("scripts/apply-native-naturalness-audit.mjs");
  });

  it("keeps every approved revision synchronized with its review record", () => {
    const approvedCards = JSON.parse(workspaceFile("data/approved_cards.seed.json")) as Array<any>;
    const candidateCards = JSON.parse(workspaceFile("data/candidate_cards.json")) as Array<any>;
    const approvedCollocations = JSON.parse(workspaceFile("data/approved_collocations.seed.json")) as Array<any>;
    const collocationUseCandidates = JSON.parse(workspaceFile("data/collocation_use_prompt_candidates.json")) as {
      items: Array<any>;
    };

    for (const id of sentenceIds) {
      const approved = approvedCards.find((card) => card.id === id);
      const candidate = candidateCards.find((item) => item.card.id === id);
      const approvedSeed = approved.exercise_seed.slot_replacement?.[0]
        ?? approved.exercise_seed.guided_application;
      const candidateSeed = candidate.card.exercise_seed.slot_replacement?.[0]
        ?? candidate.card.exercise_seed.guided_application;

      expect(candidate.card.transfer_example).toBe(approved.transfer_example);
      expect(candidateSeed.prompt_zh).toBe(approvedSeed.prompt_zh);
      expect(candidateSeed.reference_answer).toBe(approvedSeed.reference_answer);
      expect(candidate.review_history.some((event: any) => (
        event.action === "approved" && event.reason.includes("native-naturalness")
      ))).toBe(true);
    }

    for (const id of collocationIds) {
      const approved = approvedCollocations.find((item) => item.id === id);
      const useCandidate = collocationUseCandidates.items.find((item) => item.collocation_id === id);

      expect(useCandidate.review_status).toBe("approved");
      if (approved.learning_mode === "appreciation") {
        expect(approved.exercise_seed.guided_application).toBeUndefined();
        expect(approved.review_history.some((event: any) => event.reason.includes("Core / Appreciation"))).toBe(true);
      } else {
        expect(useCandidate.prompt_zh).toBe(approved.exercise_seed.guided_application.prompt_zh);
        expect(useCandidate.reference_answer).toBe(approved.exercise_seed.guided_application.reference_answer);
      }
      expect(approved.review_history.some((event: any) => (
        event.action === "approved" && event.reason.includes("native-naturalness")
      ))).toBe(true);
    }

    const supportingIds = new Set([
      "d8a4022a-dfb6-5c10-8a1d-6b179050aa84",
      "209db801-8418-5d78-a879-fe21392161d4",
      "882ab567-ea8f-5aea-ba46-7aad575c4a97",
      "3f8d73c9-188a-55b9-92d1-f70d2e234081",
      "4862db08-4eb3-5dc1-a083-37fe05c544fd",
    ]);
    expect(approvedCollocations
      .filter((item) => supportingIds.has(item.id))
      .every((item) => item.priority === "supporting" && item.usage_note.length > 0)).toBe(true);
  });
});
