import { describe, expect, it } from "vitest";
import {
  buildCollocationUseExerciseRef,
  buildSentenceUseExerciseRef,
  parseCollocationUseExerciseRef,
  parseSentenceUseExerciseRef,
} from "../../src/domain/practice/use-exercise-ref";

describe("stable Collocation Use exercise references", () => {
  it("round-trips an asset id and content revision", () => {
    const value = buildCollocationUseExerciseRef({
      id: "421dc97f-3440-52a7-97a8-256046b4c319",
      content_revision: 5,
    });
    expect(value).toBe("collocation:421dc97f-3440-52a7-97a8-256046b4c319:guided_application:5");
    expect(parseCollocationUseExerciseRef(value)).toEqual({
      id: "421dc97f-3440-52a7-97a8-256046b4c319",
      revision: 5,
    });
  });

  it("rejects malformed and unversioned references", () => {
    expect(parseCollocationUseExerciseRef("collocation:item:guided_application:1")).toBeNull();
    expect(parseCollocationUseExerciseRef("collocation:421dc97f-3440-52a7-97a8-256046b4c319:guided_application:0")).toBeNull();
  });
});

describe("stable Sentence Use exercise references", () => {
  const card = {
    id: "2ea1508c-eda6-546a-8d3c-9ec6d3deda93",
    content_revision: 3,
  };

  it("round-trips both reviewed Sentence Use exercise types", () => {
    const structureRef = buildSentenceUseExerciseRef(card, "slot_replacement");
    const vocabularyRef = buildSentenceUseExerciseRef(card, "guided_application");

    expect(structureRef).toBe("sentence:2ea1508c-eda6-546a-8d3c-9ec6d3deda93:slot_replacement:3");
    expect(parseSentenceUseExerciseRef(structureRef)).toEqual({
      id: card.id,
      revision: 3,
      exerciseType: "slot_replacement",
    });
    expect(parseSentenceUseExerciseRef(vocabularyRef)).toEqual({
      id: card.id,
      revision: 3,
      exerciseType: "guided_application",
    });
  });

  it("rejects unknown exercise types and stale unversioned shapes", () => {
    expect(parseSentenceUseExerciseRef(`sentence:${card.id}:translation_recall:3`)).toBeNull();
    expect(parseSentenceUseExerciseRef(`sentence:${card.id}:slot_replacement:0`)).toBeNull();
    expect(parseSentenceUseExerciseRef(`sentence:${card.id}:slot_replacement`)).toBeNull();
  });
});
