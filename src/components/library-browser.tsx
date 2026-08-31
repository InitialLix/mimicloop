"use client";

import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { SentenceCardData, SourceEssayData } from "../lib/content-types";
import { focusLabels, functionLabels, sourceDisplayLabel, topicLabels } from "../lib/labels";
import { HighlightedText } from "./highlighted-text";

export function LibraryBrowser({ cards, sources }: { cards: SentenceCardData[]; sources: SourceEssayData[] }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [focus, setFocus] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);
  const topics = useMemo(() => Array.from(new Set(cards.flatMap((card) => card.topics))).sort(), [cards]);
  const sourceOptions = useMemo(() => Array.from(new Set(
    sources.map((source) => sourceDisplayLabel(source.answer_origin, source.author, source.source_name)),
  )).sort((left, right) => left.localeCompare(right, "zh-CN")), [sources]);
  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return cards.filter((card) => {
      const matchesQuery = !normalizedQuery || `${card.learning_sentence} ${card.translation_zh}`.toLocaleLowerCase().includes(normalizedQuery);
      const cardSource = sourceMap.get(card.source_essay_id);
      const sourceLabel = cardSource ? sourceDisplayLabel(cardSource.answer_origin, cardSource.author, cardSource.source_name) : "来源待确认";
      return matchesQuery
        && (topic === "all" || card.topics.includes(topic))
        && (focus === "all" || card.primary_focus === focus)
        && (sourceFilter === "all" || sourceLabel === sourceFilter);
    });
  }, [cards, focus, query, sourceFilter, sourceMap, topic]);

  return (
    <>
      <div className="library-tools">
        <label className="search-box">
          <Search size={18} />
          <span className="sr-only">搜索中英文句子</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索英文或中文表达…" />
        </label>
        <label className="select-box"><span className="sr-only">按主题筛选</span><select value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">全部主题</option>{topics.map((item) => <option key={item} value={item}>{topicLabels[item] ?? item}</option>)}</select></label>
        <label className="select-box"><span className="sr-only">按训练类型筛选</span><select value={focus} onChange={(event) => setFocus(event.target.value)}><option value="all">全部类型</option><option value="mixed">综合型</option><option value="vocabulary">词汇型</option><option value="structure">结构型</option></select></label>
        <label className="select-box"><span className="sr-only">按文章来源筛选</span><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">全部来源</option>{sourceOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <span className="filter-count"><SlidersHorizontal size={15} /> {visible.length} 条</span>
      </div>

      <div className="sentence-list">
        {visible.map((card, index) => {
          const source = sourceMap.get(card.source_essay_id);
          return (
            <Link href={`/library/${card.id}`} className="sentence-row" key={card.id}>
              <span className="sentence-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="sentence-row-main">
                <span className="sentence-en"><HighlightedText text={card.learning_sentence} query={query} /></span>
                <span className="sentence-zh"><HighlightedText text={card.translation_zh} query={query} /></span>
                <span className="sentence-meta">
                  <span>{focusLabels[card.primary_focus]}</span>
                  <span>{functionLabels[card.argument_functions[0]] ?? card.argument_functions[0]}</span>
                  <span>{source ? sourceDisplayLabel(source.answer_origin, source.author, source.source_name) : "来源待确认"}</span>
                </span>
              </span>
              <ArrowUpRight className="sentence-open" size={18} />
            </Link>
          );
        })}
        {visible.length === 0 ? <div className="empty-state"><strong>没有匹配的句子</strong><span>换一个关键词或清除筛选条件。</span></div> : null}
      </div>
    </>
  );
}
