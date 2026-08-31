export type GuidedHint = { zh: string; en: string };

export type GuidedHintMatch = GuidedHint & {
  index: number;
  end: number;
};

export function locateGuidedHints(text: string, hints: GuidedHint[]): GuidedHintMatch[] {
  return hints
    .map((hint) => {
      const index = text.indexOf(hint.zh);
      let end = index + hint.zh.length;
      for (const suffix of [`（${hint.en}）`, ` (${hint.en})`]) {
        if (text.slice(end).startsWith(suffix)) {
          end += suffix.length;
          break;
        }
      }
      return { ...hint, index, end };
    })
    .filter((hint) => hint.index >= 0)
    .sort((left, right) => left.index - right.index);
}
