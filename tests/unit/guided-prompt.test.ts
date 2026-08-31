import { describe, expect, it } from "vitest";
import { locateGuidedHints } from "../../src/lib/guided-prompt.js";

describe("locateGuidedHints", () => {
  it("locates a Chinese hint that has no embedded English annotation", () => {
    expect(locateGuidedHints("城市住房市场的压力很大。", [
      { zh: "城市住房市场", en: "urban housing markets" },
    ])).toEqual([{
      zh: "城市住房市场",
      en: "urban housing markets",
      index: 0,
      end: 6,
    }]);
  });

  it("consumes an existing English annotation so the UI does not render it twice", () => {
    const text = "城市住房市场（urban housing markets）的压力很大。";
    const [match] = locateGuidedHints(text, [
      { zh: "城市住房市场", en: "urban housing markets" },
    ]);
    expect(text.slice(match.end)).toBe("的压力很大。");
  });
});
