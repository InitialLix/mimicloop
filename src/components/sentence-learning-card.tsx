"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronDown, Copy, Eye, EyeOff, Info, Layers3, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Chunk, Gloss, SentenceCardData, SourceEssayData } from "../lib/content-types";
import { focusLabels, functionLabels, isLanguageRichnessSource, partOfSpeechLabels, sourceDisplayLabel, topicLabels } from "../lib/labels";
import { essaySentenceHref } from "../lib/essay-sentence-links";

type Mark = { start: number; end: number; type: "chunk" | "gloss"; item: Chunk | Gloss; gloss?: Gloss };

function occurrenceAt(text: string, needle: string, occurrence: number) {
  let cursor = 0;
  let found = -1;
  for (let index = 0; index <= occurrence; index += 1) {
    found = text.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase(), cursor);
    if (found < 0) return -1;
    cursor = found + needle.length;
  }
  return found;
}

function buildMarks(card: SentenceCardData): Mark[] {
  const sentence = card.learning_sentence;
  const chunks: Mark[] = card.chunks
    .map((chunk) => ({ start: occurrenceAt(sentence, chunk.text, 0), end: 0, type: "chunk" as const, item: chunk }))
    .filter((mark) => mark.start >= 0)
    .map((mark) => ({ ...mark, end: mark.start + mark.item.text.length }));
  const glosses: Mark[] = card.glosses
    .map((gloss) => ({ start: occurrenceAt(sentence, gloss.text, gloss.occurrence_index), end: 0, type: "gloss" as const, item: gloss }))
    .filter((mark) => mark.start >= 0)
    .map((mark) => ({ ...mark, end: mark.start + mark.item.text.length }));

  for (const chunk of chunks) {
    const inside = glosses.find((gloss) => gloss.start >= chunk.start && gloss.end <= chunk.end);
    if (inside) chunk.gloss = inside.item as Gloss;
  }
  return [...chunks, ...glosses.filter((gloss) => !chunks.some((chunk) => gloss.start < chunk.end && gloss.end > chunk.start))]
    .sort((left, right) => left.start - right.start || right.end - left.end);
}

export function SentenceLearningCard({ card, source, recallHref }: { card: SentenceCardData; source: SourceEssayData; recallHref?: string }) {
  const [translationVisible, setTranslationVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const marks = useMemo(() => buildMarks(card), [card]);
  const isLanguageSource = isLanguageRichnessSource(source);

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest(".word-popover-anchor")) setActiveIndex(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const sentenceParts: React.ReactNode[] = [];
  let cursor = 0;
  marks.forEach((mark, index) => {
    if (mark.start > cursor) sentenceParts.push(card.learning_sentence.slice(cursor, mark.start));
    const chunk = mark.type === "chunk" ? (mark.item as Chunk) : null;
    const gloss = mark.type === "gloss" ? (mark.item as Gloss) : mark.gloss;
    sentenceParts.push(
      <span className="word-popover-anchor" key={`${mark.start}-${mark.end}`}>
        <span
          role="button"
          tabIndex={0}
          className={mark.type === "chunk" ? "sentence-mark chunk-mark" : "sentence-mark gloss-mark"}
          aria-haspopup="dialog"
          aria-expanded={activeIndex === index}
          onClick={() => setActiveIndex((current) => current === index ? null : index)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setActiveIndex((current) => current === index ? null : index);
            }
          }}
        >
          {card.learning_sentence.slice(mark.start, mark.end)}
        </span>
        {activeIndex === index ? (
          <span className="word-popover" role="dialog" aria-label="句内注释">
            <button className="popover-close" type="button" onClick={() => setActiveIndex(null)} aria-label="关闭"><X size={14} /></button>
            {chunk ? <><span className="popover-label">核心词块</span><strong>{chunk.text}</strong><span>{chunk.meaning_zh}</span>{chunk.note ? <small>{chunk.note}</small> : null}</> : null}
            {gloss ? <><span className="popover-label gloss-label">生词</span><strong>{gloss.lemma} <em>{partOfSpeechLabels[gloss.part_of_speech] ?? gloss.part_of_speech}</em></strong><span>{gloss.meaning_zh}</span>{gloss.note ? <small>{gloss.note}</small> : null}</> : null}
          </span>
        ) : null}
      </span>,
    );
    cursor = mark.end;
  });
  if (cursor < card.learning_sentence.length) sentenceParts.push(card.learning_sentence.slice(cursor));

  const patternParts = card.pattern?.split(/(\{[a-z0-9_]+\})/g).filter(Boolean) ?? [];
  const sourceSentenceHref = essaySentenceHref(source.id, card.paragraph_index, card.sentence_index);
  const copyEssayLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${sourceSentenceHref}`);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1600);
  };

  return (
    <article className="learning-card">
      <header className="learning-card-head">
        <div className="learning-step"><span>LEARN</span><span className="step-line" /><span>01 / 03</span></div>
        <div className="tag-row"><span className="quiet-chip">{focusLabels[card.primary_focus]}</span>{card.argument_functions.slice(0, 2).map((item) => <span className="plain-tag" key={item}>{functionLabels[item] ?? item}</span>)}</div>
      </header>

      <section className="sentence-stage">
        <p className="sentence-instruction">点击高亮词块或带下划线的生词，查看当前句中的简短解释。</p>
        <h1 className="hero-sentence">{sentenceParts}</h1>
        <button className="translation-toggle" type="button" onClick={() => setTranslationVisible(!translationVisible)}>
          {translationVisible ? <EyeOff size={19} /> : <Eye size={19} />}{translationVisible ? "隐藏中文释义" : "显示中文释义"}
        </button>
        {translationVisible ? <p className="hero-translation">{card.translation_zh}</p> : <div className="translation-placeholder" aria-hidden="true" />}
      </section>

      <div className="learning-sections">
        <section className="learning-section">
          <div className="learning-section-title"><Layers3 size={18} /><div><span>可复用骨架</span><small>保留逻辑，替换内容</small></div></div>
          {card.pattern ? (
            <p className="pattern-line">
              {patternParts.map((part, index) => part.startsWith("{") ? (
                <span
                  className="pattern-blank"
                  aria-label={`可替换内容：${part.slice(1, -1).replaceAll("_", " ")}`}
                  key={`${part}-${index}`}
                  style={{ width: `${Math.min(112, Math.max(64, part.length * 6))}px` }}
                />
              ) : part)}
            </p>
          ) : <p className="muted">这是一张词汇型卡，重点放在词块而不是套用句式。</p>}
        </section>

        <section className="learning-section two-column-notes">
          {card.grammar_note ? <div><span className="note-label">结构说明</span><p>{card.grammar_note}</p></div> : null}
          {card.usage_note ? <div><span className="note-label">使用提醒</span><p>{card.usage_note}</p></div> : null}
        </section>

        <details className="source-details">
          <summary><span><BookOpen size={17} /> 来源与上下文</span><ChevronDown size={17} /></summary>
          <div className="source-content">
            <div className="source-warning"><Info size={17} /><span>{isLanguageSource ? <><strong>英语课文来源，不是 IELTS 范文。</strong> 本卡只学习其中的自然语言。</> : <><strong>教师范文，不是 IELTS 官方评分样本。</strong> 当前合集没有可核验的一手网页与考官评语，页面不会展示“Band 9”。</>}</span></div>
            {source.ielts_prompt ? <div className="source-prompt"><span>原作文题目</span><p>{source.ielts_prompt}</p></div> : null}
            <dl><div><dt>来源类型</dt><dd>{sourceDisplayLabel(source.answer_origin, source.author, source.source_name)}</dd></div><div><dt>文章</dt><dd>{source.title}</dd></div><div><dt>原始合集</dt><dd>{source.source_name}</dd></div><div><dt>原文位置</dt><dd>第 {card.paragraph_index + 1} 段，第 {card.sentence_index + 1} 句</dd></div><div><dt>本地文件</dt><dd>{source.local_raw_file}</dd></div></dl>
            <div className="context-block">{card.context_before ? <p><span>上文</span>{card.context_before}</p> : null}<p className="context-current"><span>原句</span>{card.original_sentence}</p>{card.context_after ? <p><span>下文</span>{card.context_after}</p> : null}</div>
            <div className="source-actions">
              <a className="button secondary" href={sourceSentenceHref}>定位到范文原句 <ArrowRight size={16} /></a>
              <button className="button quiet" type="button" onClick={copyEssayLink}>{linkCopied ? <Check size={16} /> : <Copy size={16} />}{linkCopied ? "已复制链接" : "复制范文链接"}</button>
            </div>
          </div>
        </details>
      </div>
      <footer className="learning-footer"><span>{card.topics.slice(0, 2).map((item) => topicLabels[item] ?? item).join(" · ")}</span><Link className="button primary" href={recallHref ?? `/practice/${card.id}/recall`}>进入回忆练习 <ArrowRight size={17} /></Link></footer>
    </article>
  );
}
