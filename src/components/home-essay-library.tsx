"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { EssaySummary } from "../lib/essay-summaries";
import { topicLabels } from "../lib/labels";

export function HomeEssayLibrary({ essays }: { essays: EssaySummary[] }) {
  const [topic, setTopic] = useState("all");
  const topics = useMemo(
    () => Array.from(new Set(essays.flatMap((essay) => essay.topics)))
      .sort((left, right) => (topicLabels[left] ?? left).localeCompare(topicLabels[right] ?? right, "zh-CN")),
    [essays],
  );
  const visible = useMemo(
    () => topic === "all" ? essays : essays.filter((essay) => essay.topics.includes(topic)),
    [essays, topic],
  );
  const libraryHref = topic === "all" ? "/library/essays" : `/library/essays?topic=${encodeURIComponent(topic)}`;

  return (
    <section className="home-essay-library" aria-labelledby="home-essay-library-title">
      <div className="home-essay-library-head">
        <div className="home-essay-heading">
          <span className="home-essay-icon" aria-hidden="true"><BookOpen size={21} /></span>
          <div>
            <span>MODEL ESSAY LIBRARY</span>
            <h2 id="home-essay-library-title">从完整范文中理解好句</h2>
            <p>按雅思写作主题选文章，连同原题与完整论证一起阅读。</p>
          </div>
        </div>
        <label className="home-topic-select" htmlFor="home-essay-topic">
          <span>范文主题</span>
          <span className="home-topic-select-control">
            <select id="home-essay-topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option value="all">全部主题</option>
              {topics.map((item) => <option key={item} value={item}>{topicLabels[item] ?? item}</option>)}
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </span>
        </label>
      </div>

      <div className="home-essay-grid">
        {visible.slice(0, 3).map((essay) => (
          <Link className="home-essay-card" href={`/library/essays/${essay.id}`} key={essay.id}>
            <span className="home-essay-card-meta">
              <span>{essay.essayNumber ? `第 ${String(essay.essayNumber).padStart(2, "0")} 篇` : "完整范文"} · {essay.sourceLabel}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </span>
            <strong>{essay.title}</strong>
            <p>{essay.ieltsPrompt}</p>
            <span className="home-essay-card-foot">{essay.topics.map((item) => topicLabels[item] ?? item).join(" · ")} · 已收录 {essay.sentenceCount} 句</span>
          </Link>
        ))}
      </div>

      <div className="home-essay-library-foot">
        <span>{topic === "all" ? `共 ${essays.length} 篇完整范文` : `${topicLabels[topic] ?? topic} · ${visible.length} 篇`}</span>
        <Link href={libraryHref}>浏览{topic === "all" ? "全部" : "该主题"}范文 <ArrowRight size={16} /></Link>
      </div>
    </section>
  );
}
