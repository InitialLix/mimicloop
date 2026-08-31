import { describe, expect, it } from "vitest";
import { essayLibraryPath } from "../../src/lib/essay-library-navigation";

describe("essay library filter navigation", () => {
  it("keeps topic and source filters in the URL", () => {
    expect(essayLibraryPath("/library/essays", "culture_art_language_media", "新概念英语 3"))
      .toBe("/library/essays?topic=culture_art_language_media&source=%E6%96%B0%E6%A6%82%E5%BF%B5%E8%8B%B1%E8%AF%AD+3");
  });

  it("removes default filters from the URL", () => {
    expect(essayLibraryPath("/library/essays", "all", "all")).toBe("/library/essays");
  });
});
