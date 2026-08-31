"use client";

import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { CollocationData, CollocationProgressData, SourceEssayData } from "../lib/content-types";
import { collocationTypeLabels, sourceDisplayLabel, topicLabels } from "../lib/labels";
import { HighlightedText } from "./highlighted-text";

export function CollocationLibraryBrowser({
  collocations,
  sources,
  progress,
  nowIso,
}: {
  collocations: CollocationData[];
  sources: SourceEssayData[];
  progress: CollocationProgressData[];
  nowIso: string;
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [expressionType, setExpressionType] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [learningStatus, setLearningStatus] = useState("all");
  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);
  const progressMap = useMemo(() => new Map(progress.map((item) => [item.collocationId, item])), [progress]);
  const statusOf = (id: string) => {
    const item = progressMap.get(id);
    if (!item || item.learningStage === "new") return "new";
    if (new Date(item.dueAt) <= new Date(nowIso)) return "due";
    if (item.learningStage === "use") return "mastered";
    return "learning";
  };
  const topics = useMemo(() => Array.from(new Set(collocations.flatMap((item) => item.topics))).sort(), [collocations]);
  const sourceOptions = useMemo(() => Array.from(new Set(collocations.flatMap((item) => item.source_links.map((link) => {
    const source = sourceMap.get(link.source_essay_id);
    return source ? sourceDisplayLabel(source.answer_origin, source.author, source.source_name) : "来源待确认";
  })))).sort((left, right) => left.localeCompare(right, "zh-CN")), [collocations, sourceMap]);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return collocations.filter((item) => {
      const searchText = `${item.canonical_text} ${item.translation_prompt} ${item.accepted_answers.join(" ")}`.toLocaleLowerCase();
      const sourceLabels = item.source_links.map((link) => {
        const source = sourceMap.get(link.source_essay_id);
        return source ? sourceDisplayLabel(source.answer_origin, source.author, source.source_name) : "来源待确认";
      });
      return (!normalizedQuery || searchText.includes(normalizedQuery))
        && (topic === "all" || item.topics.includes(topic))
        && (expressionType === "all" || item.expression_type === expressionType)
        && (sourceFilter === "all" || sourceLabels.includes(sourceFilter))
        && (learningStatus === "all" || statusOf(item.id) === learningStatus);
    });
  }, [collocations, expressionType, learningStatus, query, sourceFilter, sourceMap, topic]);

  return <>
    <div className="library-tools collocation-library-tools">
      <label className="search-box">
        <Search size={18} />
        <span className="sr-only">搜索中英文搭配</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索英文或中文搭配…" />
      </label>
      <label className="select-box"><span className="sr-only">按主题筛选</span><select value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">全部主题</option>{topics.map((item) => <option value={item} key={item}>{topicLabels[item] ?? item}</option>)}</select></label>
      <label className="select-box"><span className="sr-only">按表达类型筛选</span><select value={expressionType} onChange={(event) => setExpressionType(event.target.value)}><option value="all">全部类型</option><option value="collocation">搭配</option><option value="fixed_phrase">固定短语</option><option value="sentence_frame">句型</option></select></label>
      <label className="select-box"><span className="sr-only">按文章来源筛选</span><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">全部来源</option>{sourceOptions.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <label className="select-box"><span className="sr-only">按掌握状态筛选</span><select value={learningStatus} onChange={(event) => setLearningStatus(event.target.value)}><option value="all">全部状态</option><option value="new">未学习</option><option value="learning">学习中</option><option value="due">今日到期</option><option value="mastered">已掌握</option></select></label>
      <span className="filter-count"><SlidersHorizontal size={15} /> {visible.length} 条</span>
    </div>

    <div className="sentence-list collocation-list">
      {visible.map((item, index) => {
        const primaryLink = item.source_links.find((link) => link.role === "primary") ?? item.source_links[0];
        const source = primaryLink ? sourceMap.get(primaryLink.source_essay_id) : null;
        const status = statusOf(item.id);
        const statusLabel = { new: "未学习", learning: "学习中", due: "今日到期", mastered: "已掌握" }[status];
        return <Link href={`/library/collocations/${item.id}`} className="sentence-row collocation-row" key={item.id}>
          <span className="sentence-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="sentence-row-main">
            <span className="sentence-en"><HighlightedText text={item.canonical_text} query={query} /></span>
            <span className="sentence-zh"><HighlightedText text={item.translation_prompt} query={query} /></span>
            <span className="sentence-meta">
              <span>{collocationTypeLabels[item.expression_type]}</span>
              <span>{topicLabels[item.topics[0]] ?? item.topics[0]}</span>
              <span>{source ? sourceDisplayLabel(source.answer_origin, source.author, source.source_name) : "来源待确认"}</span>
              <span className={`collocation-progress-tag status-${status}`}>{statusLabel}</span>
              {item.source_links.length > 1 ? <span>{item.source_links.length} 处语境</span> : null}
            </span>
          </span>
          <ArrowUpRight className="sentence-open" size={18} />
        </Link>;
      })}
      {visible.length === 0 ? <div className="empty-state"><strong>没有匹配的搭配</strong><span>换一个关键词或清除筛选条件。</span></div> : null}
    </div>
  </>;
}
