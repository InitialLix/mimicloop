import { splitHighlightSegments } from "../lib/search-highlight";

export function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitHighlightSegments(text, query).map((segment, index) => (
        segment.highlighted
          ? <mark className="search-highlight" key={`${index}-${segment.text}`}>{segment.text}</mark>
          : segment.text
      ))}
    </>
  );
}
