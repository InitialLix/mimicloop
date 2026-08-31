import type { CollocationData } from "../../lib/content-types";
import type { SentenceCardData } from "../../lib/content-types";
import type { UseTask } from "./use-task";

const COLLOCATION_PREFIX = "collocation";
const COLLOCATION_EXERCISE = "guided_application";
const SENTENCE_PREFIX = "sentence";
const SENTENCE_EXERCISES = new Set<UseTask["exerciseType"]>(["slot_replacement", "guided_application"]);

export function buildCollocationUseExerciseRef(collocation: Pick<CollocationData, "id" | "content_revision">) {
  return `${COLLOCATION_PREFIX}:${collocation.id}:${COLLOCATION_EXERCISE}:${collocation.content_revision}`;
}

export function parseCollocationUseExerciseRef(value: string) {
  const [prefix, id, exercise, revisionText, ...rest] = value.split(":");
  const revision = Number(revisionText);
  if (
    prefix !== COLLOCATION_PREFIX
    || exercise !== COLLOCATION_EXERCISE
    || rest.length
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id ?? "")
    || !Number.isSafeInteger(revision)
    || revision < 1
  ) return null;
  return { id, revision };
}

export function buildSentenceUseExerciseRef(
  card: Pick<SentenceCardData, "id" | "content_revision">,
  exerciseType: UseTask["exerciseType"],
) {
  return `${SENTENCE_PREFIX}:${card.id}:${exerciseType}:${card.content_revision}`;
}

export function parseSentenceUseExerciseRef(value: string) {
  const [prefix, id, exercise, revisionText, ...rest] = value.split(":");
  const revision = Number(revisionText);
  if (
    prefix !== SENTENCE_PREFIX
    || !SENTENCE_EXERCISES.has(exercise as UseTask["exerciseType"])
    || rest.length
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id ?? "")
    || !Number.isSafeInteger(revision)
    || revision < 1
  ) return null;
  return { id, revision, exerciseType: exercise as UseTask["exerciseType"] };
}
