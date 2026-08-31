import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("language-richness corpus guidelines", () => {
  it("keeps non-IELTS sources separate and traceable", () => {
    const rules = workspaceFile("AGENTS.md");
    const contentGuidelines = workspaceFile("docs/content-guidelines.md");

    expect(rules).toContain("统一作为 `language_richness_corpus`");
    expect(rules).toContain("不得冒充 IELTS model essay");
    expect(contentGuidelines).toContain("外刊文章等非 IELTS 内容只作为 `language_richness_corpus`");
    expect(contentGuidelines).toContain("按教材、刊物或出版方单列");
  });

  it("requires high-recall extraction and Core/Appreciation routing", () => {
    const rules = workspaceFile("AGENTS.md");
    const collocationGuidelines = workspaceFile("docs/collocation-guidelines.md");

    expect(rules).toContain("表达与完整句子均采用高召回候选策略");
    expect(rules).toContain("只有 Core 进入 Recall → Use");
    expect(collocationGuidelines).toContain("不设“每课 3～5 条”或任何类似配额");
    expect(collocationGuidelines).toContain("Core / Appreciation 分层");
  });

  it("allows more sentence cards without weakening quality gates", () => {
    const rules = workspaceFile("AGENTS.md");
    const contentGuidelines = workspaceFile("docs/content-guidelines.md");

    expect(rules).toContain("句子卡可比 IELTS 范文收录得更充分");
    expect(contentGuidelines).toContain("可以明显超过以往每篇 5–10 句的经验范围");
    expect(contentGuidelines).toContain("不得为了体现“高召回”而降低质量门槛");
    expect(contentGuidelines).toContain("现代英语自然度、脱离上下文后的完整性");
  });
});
