import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("onboarding tour prototype", () => {
  const component = workspaceFile("src/components/onboarding-tour-prototype.tsx");
  const essayInteractiveSentence = workspaceFile("src/components/essay-interactive-sentence.tsx");
  const styles = workspaceFile("src/app/globals.css");

  it("keeps the prototype optional and accessible", () => {
    expect(component).toContain('role="dialog"');
    expect(component).toContain('aria-modal="true"');
    expect(component).toContain('event.key === "Escape"');
    expect(component).toContain('document.body.style.overflow = "hidden"');
    expect(component).toContain("使用导览");
  });

  it("supports pause, replay, and reduced motion", () => {
    expect(component).toContain("is-paused");
    expect(component).toContain("重新播放");
    expect(styles).toContain("animation-play-state: paused");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain(".tour-reduced-motion-note { display: block; }");
  });

  it("presents all six guide pages in a continuous, directly navigable sequence", () => {
    expect(component).toContain("01 / 06 · 开始");
    expect(component).toContain("02 / 06 · 原文阅读");
    expect(component).toContain("03 / 06 · 句子学习");
    expect(component).toContain("04 / 06 · 回忆与运用");
    expect(component).toContain("05 / 06 · 搜索定位");
    expect(component).toContain("06 / 06 · 写作练习");
    expect(component).toContain("下一页");
    expect(component).toContain("上一页");
    expect(component).toContain("完成导览");
    expect(component).toContain("查看第${page}页：${tourLabels[page]}");
    expect(component).toContain('event.key === "ArrowRight"');
    expect(component).toContain('event.key === "ArrowLeft"');
  });

  it("explains the real learning path instead of generic feature slogans", () => {
    expect(component).toContain("新内容与到期复习放在同一天");
    expect(component).toContain("中文默认隐藏，需要时再展开");
    expect(component).toContain("根据中文提示换场景仿写");
    expect(component).toContain("DeepSeek 批改");
    expect(component).toContain("AI 反馈 · <b>DeepSeek</b>");
    expect(component).toContain("指出是否通过，或给一条优先修改建议");
    expect(component).toContain("不可用时仍保留答案与参考答案流程");
    expect(component).toContain("句子和搭配都支持中英文搜索");
    expect(component).toContain("目标句会短暂闪烁");
    expect(styles).toContain("@keyframes tour-search-located");
    expect(styles).toContain("@keyframes tour-practice-use");
    expect(styles).toContain("@keyframes tour-practice-feedback");
    expect(styles).toContain("@keyframes tour-practice-ai-cursor");
    expect(component).not.toContain("Band 分数");
  });

  it("animates real Core and Appreciation teaching states", () => {
    expect(component).toContain("live under the illusion that");
    expect(component).toContain("go into raptures");
    expect(component).toContain("at the mere mention of the country");
    expect(component).toContain("tour-core-cursor");
    expect(component).toContain("tour-appreciation-cursor");
    expect(styles).toContain("@keyframes tour-detail-peek");
    expect(styles).toContain("@keyframes tour-appreciation-tooltip");
    expect(styles).toContain(".tour-appreciation-tooltip { display: grid; opacity: 1;");
    expect(styles).not.toContain("@keyframes tour-cursor-path");
  });

  it("adds a sixth-page Guided Writing preview without pretending to explain the whole workflow", () => {
    expect(component).toContain("06 / 06 · 写作练习");
    expect(component).toContain("带着一道题，开始写自己的文章");
    expect(component).toContain("导入自己的题目");
    expect(component).toContain("粘贴完整的英文 Task 2 题目");
    expect(component).toContain('href="/writing"');
    expect(component).toContain("tour-writing-import-sheet");
    expect(styles).toContain("@keyframes tour-writing-sheet");
    expect(component).not.toContain("Band 分数");
  });

  it("shows only the Chinese meaning in Appreciation tooltips", () => {
    expect(component).not.toContain("表达欣赏");
    expect(essayInteractiveSentence).not.toContain("表达欣赏");
    expect(essayInteractiveSentence).toContain("data-tooltip={range.translation}");
  });

  it("uses only one visible close control", () => {
    expect(component).toContain('aria-label="关闭使用导览"');
    expect(component).not.toContain("关闭预览");
  });
});
