import { describe, expect, it } from "vitest";
import { splitHighlightSegments } from "../../src/lib/search-highlight";

describe("splitHighlightSegments", () => {
  it("returns unhighlighted text for an empty query", () => {
    expect(splitHighlightSegments("A useful sentence.", "   ")).toEqual([
      { text: "A useful sentence.", highlighted: false },
    ]);
  });

  it("matches English without changing the original casing and marks every occurrence", () => {
    expect(splitHighlightSegments("Public transport can improve PUBLIC health.", "public"))
      .toEqual([
        { text: "", highlighted: false },
        { text: "Public", highlighted: true },
        { text: " transport can improve ", highlighted: false },
        { text: "PUBLIC", highlighted: true },
        { text: " health.", highlighted: false },
      ]);
  });

  it("extends a single English-word match to the complete word form", () => {
    expect(splitHighlightSegments("A job can create jobs and job-related skills.", "job"))
      .toEqual([
        { text: "A ", highlighted: false },
        { text: "job", highlighted: true },
        { text: " can create ", highlighted: false },
        { text: "jobs", highlighted: true },
        { text: " and ", highlighted: false },
        { text: "job-related", highlighted: true },
        { text: " skills.", highlighted: false },
      ]);
  });

  it("matches Chinese and treats regular-expression characters literally", () => {
    expect(splitHighlightSegments("住房成本上升，住房供应不足。", "住房"))
      .toEqual([
        { text: "", highlighted: false },
        { text: "住房", highlighted: true },
        { text: "成本上升，", highlighted: false },
        { text: "住房", highlighted: true },
        { text: "供应不足。", highlighted: false },
      ]);
    expect(splitHighlightSegments("Use (cost + time) as evidence.", "(cost + time)"))
      .toEqual([
        { text: "Use ", highlighted: false },
        { text: "(cost + time)", highlighted: true },
        { text: " as evidence.", highlighted: false },
      ]);
  });
});
