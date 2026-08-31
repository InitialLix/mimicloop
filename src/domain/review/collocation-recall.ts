export type CollocationMatchResult = "canonical" | "accepted" | "unmatched";

export function normalizeCollocationAnswer(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!?。！？]+$/u, "")
    .trim()
    .toLocaleLowerCase("en");
}

export function matchCollocationAnswer({
  answer,
  canonical,
  acceptedAnswers,
}: {
  answer: string;
  canonical: string;
  acceptedAnswers: string[];
}): CollocationMatchResult {
  const normalized = normalizeCollocationAnswer(answer);
  if (normalized === normalizeCollocationAnswer(canonical)) return "canonical";
  return acceptedAnswers.some((candidate) => normalizeCollocationAnswer(candidate) === normalized)
    ? "accepted"
    : "unmatched";
}

