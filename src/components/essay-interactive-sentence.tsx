"use client";

import type { CollocationTextRange } from "../lib/essay-sentence-links";

interface SentenceCardTarget {
  href: string;
  ariaLabel: string;
  focus: "structure" | "vocabulary" | "mixed";
  typeLabel: string;
}

export function EssayInteractiveSentence({
  sentence,
  collocations,
  card,
}: {
  sentence: string;
  collocations: CollocationTextRange[];
  card: SentenceCardTarget | null;
}) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const range of collocations) {
    if (range.start > cursor) parts.push(sentence.slice(cursor, range.start));
    parts.push(range.learningMode === "appreciation" ? (
      <span
        className="essay-appreciation-expression"
        data-tooltip={range.translation}
        aria-label={`${range.label}：${range.translation}`}
        tabIndex={0}
        key={`${range.start}-${range.end}-${range.collocationId}`}
      >
        {sentence.slice(range.start, range.end)}
      </span>
    ) : (
      <a
        className="essay-collocation-link"
        data-tooltip={`查看搭配：${range.label}`}
        href={`/library/collocations/${range.collocationId}`}
        aria-label={`查看搭配：${range.label}`}
        key={`${range.start}-${range.end}-${range.collocationId}`}
        onClick={(event) => event.stopPropagation()}
      >
        {sentence.slice(range.start, range.end)}
      </a>
    ));
    cursor = range.end;
  }
  if (cursor < sentence.length) parts.push(sentence.slice(cursor));

  if (!card) return <>{parts}</>;

  const openCard = () => window.location.assign(card.href);

  return (
    <span
      className={`essay-card-sentence essay-card-sentence-${card.focus}`}
      role="link"
      tabIndex={0}
      aria-label={card.ariaLabel}
      onClick={openCard}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && event.key === "Enter") openCard();
      }}
    >
      <span className="essay-card-sentence-label">{card.typeLabel}</span>
      <span>{parts}</span>
    </span>
  );
}
