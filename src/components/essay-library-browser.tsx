"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, ChevronDown, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import type { EssaySummary } from "../lib/essay-summaries";
import { compactEssaySourceLine } from "../lib/essay-summaries";
import { essayLibraryPath } from "../lib/essay-library-navigation";
import { topicLabels } from "../lib/labels";

export function EssayLibraryBrowser({ essays, initialTopic, initialSource }: { essays: EssaySummary[]; initialTopic: string; initialSource: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [topic, setTopic] = useState(initialTopic);
  const [sourceFilter, setSourceFilter] = useState(initialSource);
  const topics = useMemo(
    () => Array.from(new Set(essays.flatMap((essay) => essay.topics)))
      .sort((left, right) => (topicLabels[left] ?? left).localeCompare(topicLabels[right] ?? right, "zh-CN")),
    [essays],
  );
  const visible = useMemo(
    () => essays.filter((essay) => (
      (topic === "all" || essay.topics.includes(topic))
      && (sourceFilter === "all" || essay.sourceLabel === sourceFilter)
    )),
    [essays, sourceFilter, topic],
  );
  const sourceOptions = useMemo(
    () => Array.from(new Set(essays.map((essay) => essay.sourceLabel)))
      .sort((left, right) => left.localeCompare(right, "zh-CN")),
    [essays],
  );

  function changeTopic(nextTopic: string) {
    setTopic(nextTopic);
    router.replace(essayLibraryPath(pathname, nextTopic, sourceFilter), { scroll: false });
  }

  function changeSource(nextSource: string) {
    setSourceFilter(nextSource);
    router.replace(essayLibraryPath(pathname, topic, nextSource), { scroll: false });
  }

  return (
    <>
      <div className="essay-library-tools">
        <div>
          <BookOpen size={18} />
          <span><strong>{visible.length}</strong> 篇原文</span>
        </div>
        <div className="essay-library-filters">
          <label htmlFor="essay-library-topic">
            <span>按主题筛选</span>
            <span className="essay-topic-select-control">
              <select id="essay-library-topic" value={topic} onChange={(event) => changeTopic(event.target.value)}>
                <option value="all">全部主题</option>
                {topics.map((item) => <option key={item} value={item}>{topicLabels[item] ?? item}</option>)}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </label>
          <label htmlFor="essay-library-source">
            <span>按来源筛选</span>
            <span className="essay-topic-select-control">
              <select id="essay-library-source" value={sourceFilter} onChange={(event) => changeSource(event.target.value)}>
                <option value="all">全部来源</option>
                {sourceOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </label>
        </div>
      </div>

      <div className="essay-list">
        {visible.map((essay, index) => (
          <Link className="essay-row" href={`/library/essays/${essay.id}`} key={essay.id}>
            <span className="essay-icon"><FileText size={19} /></span>
            <span className="essay-row-main">
              <small>{compactEssaySourceLine(essay, index)}</small>
              <strong>{essay.title}</strong>
              {essay.ieltsPrompt ? <p>{essay.ieltsPrompt}</p> : null}
              <span>{essay.topics.map((item) => topicLabels[item] ?? item).join(" · ")} · 已收录 {essay.sentenceCount} 句</span>
            </span>
            <ArrowUpRight size={19} />
          </Link>
        ))}
      </div>
    </>
  );
}
