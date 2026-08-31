import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdaptiveNextStepEnabled } from "../../src/lib/adaptive-config";

describe("adaptive next-step feature flag", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled when the flag is absent", () => {
    vi.stubEnv("MIMICLOOP_ADAPTIVE_NEXT_STEP_ENABLED", undefined);
    expect(isAdaptiveNextStepEnabled()).toBe(false);
  });

  it("is enabled only by the explicit true value", () => {
    vi.stubEnv("MIMICLOOP_ADAPTIVE_NEXT_STEP_ENABLED", "false");
    expect(isAdaptiveNextStepEnabled()).toBe(false);

    vi.stubEnv("MIMICLOOP_ADAPTIVE_NEXT_STEP_ENABLED", "true");
    expect(isAdaptiveNextStepEnabled()).toBe(true);
  });
});
