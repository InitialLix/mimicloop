export function resolveGuidedWritingPromptId(
  prompts: ReadonlyArray<{ sourceEssayId: string }>,
  requested: string | string[] | undefined,
): string {
  const requestedId = Array.isArray(requested) ? requested[0] : requested;
  return prompts.some((prompt) => prompt.sourceEssayId === requestedId)
    ? requestedId!
    : prompts[0]?.sourceEssayId ?? "";
}
