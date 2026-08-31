import { describe, expect, it } from "vitest";
import { matchCollocationAnswer, normalizeCollocationAnswer } from "../../src/domain/review/collocation-recall";

describe("collocation recall matching", () => {
  it("only ignores case, repeated spaces, surrounding spaces, and terminal punctuation", () => {
    expect(normalizeCollocationAnswer("  Pose   a Threat to!  ")).toBe("pose a threat to");
    expect(matchCollocationAnswer({
      answer: "POSE  A THREAT TO.",
      canonical: "pose a threat to",
      acceptedAnswers: ["pose a threat to"],
    })).toBe("canonical");
  });

  it("distinguishes an approved variant from an unreviewed synonym", () => {
    expect(matchCollocationAnswer({
      answer: "make a contribution to",
      canonical: "contribute to",
      acceptedAnswers: ["contribute to", "make a contribution to"],
    })).toBe("accepted");
    expect(matchCollocationAnswer({
      answer: "help with",
      canonical: "contribute to",
      acceptedAnswers: ["contribute to"],
    })).toBe("unmatched");
  });
});
