import { afterEach, describe, expect, it } from "vitest";
import {
  isCompetitionInternalPath,
  signCompetitionSession,
  verifyCompetitionSession,
} from "../../src/lib/competition-mode";

const previousSecret = process.env.MIMICLOOP_SESSION_SIGNING_SECRET;

afterEach(() => {
  if (previousSecret === undefined) delete process.env.MIMICLOOP_SESSION_SIGNING_SECRET;
  else process.env.MIMICLOOP_SESSION_SIGNING_SECRET = previousSecret;
});

describe("competition mode session boundary", () => {
  it("accepts only an untampered signed UUID", () => {
    process.env.MIMICLOOP_SESSION_SIGNING_SECRET = "test-only-signing-secret";
    const id = "b2a7b1d6-9cb5-4ee3-9a6a-b604c0dd47d9";
    const signed = signCompetitionSession(id);
    expect(verifyCompetitionSession(signed)).toBe(id);
    expect(verifyCompetitionSession(`${signed}x`)).toBeNull();
    expect(verifyCompetitionSession("../../data/mimicloop.db.invalid")).toBeNull();
  });

  it("recognizes every internal review surface", () => {
    expect(isCompetitionInternalPath("/candidates")).toBe(true);
    expect(isCompetitionInternalPath("/candidates/collocations/use-prompts")).toBe(true);
    expect(isCompetitionInternalPath("/api/candidates/123")).toBe(true);
    expect(isCompetitionInternalPath("/api/collocations/candidates/123")).toBe(true);
    expect(isCompetitionInternalPath("/settings")).toBe(true);
    expect(isCompetitionInternalPath("/library")).toBe(false);
  });
});
