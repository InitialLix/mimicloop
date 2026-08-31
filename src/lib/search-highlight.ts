export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitHighlightSegments(text: string, query: string): HighlightSegment[] {
  const needle = query.trim();
  if (!needle) return [{ text, highlighted: false }];

  const isSingleEnglishWord = /^[a-z]+$/iu.test(needle);
  const expression = isSingleEnglishWord
    ? `[a-z'’-]*${escapeRegExp(needle)}[a-z'’-]*`
    : escapeRegExp(needle);
  const matcher = new RegExp(`(${expression})`, "giu");
  return text.split(matcher).map((segment, index) => ({
    text: segment,
    highlighted: index % 2 === 1,
  }));
}
