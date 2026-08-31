import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../components/page-header";
import { getTodayStudyData } from "../../lib/app-data";
import { focusLabels } from "../../lib/labels";
import { taskStartHref } from "../../domain/review/study-navigation";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const study = await getTodayStudyData();
  const nextIndex = study.queue.findIndex((task) => !study.completedTaskKeys.includes(task.key));
  const nextTask = nextIndex >= 0 ? study.queue[nextIndex] : undefined;
  const queue = study.queue.map((task) => task.key);
  const nextHref = nextTask ? taskStartHref({ task: nextTask, queue, index: nextIndex }) : "/today/summary";
  return (
    <div className="page page-today">
      <PageHeader
        eyebrow="DAILY PRACTICE"
        title="今日学习"
        description="完成今天的新句学习、到期复习与仿写任务。"
      />

      <section className="today-overview" aria-label="今日学习概览">
        <div className="today-number"><strong>{study.queue.length}</strong><span>个今日任务</span></div>
        <div className="today-stat"><span>到期复习</span><strong>{study.dueCount}</strong><small>{study.dueSentenceCount} 句 · {study.dueCollocationCount} 搭配</small></div>
        <div className="today-stat"><span>新内容</span><strong>{study.newCount}</strong><small>{study.newSentenceCount} 句 · {study.newCollocationCount} 搭配</small></div>
        <div className="today-stat"><span>今日完成</span><strong>{study.completedCount} / {study.queue.length}</strong></div>
      </section>

      {nextTask ? (
        <section className="today-focus">
          <div className="section-kicker"><span>第 {nextIndex + 1} 项</span><span className="quiet-chip">{nextTask.kind === "sentence" ? focusLabels[nextTask.card.primary_focus] : "Collocation"}</span></div>
          <blockquote className={nextTask.kind === "collocation" ? "today-collocation" : undefined}>{nextTask.kind === "sentence" ? nextTask.card.learning_sentence : nextTask.collocation.canonical_text}</blockquote>
          <p>{nextTask.kind === "sentence" ? nextTask.card.translation_zh : nextTask.collocation.translation_prompt}</p>
          <div className="today-actions">
            <Link className="button primary" href={nextHref}>
              {study.completedCount ? "继续今日学习" : "开始今日学习"} <ArrowRight size={17} />
            </Link>
            <span className="time-hint"><CheckCircle2 size={15} /> 已完成 {study.completedCount} 项</span>
          </div>
        </section>
      ) : (
        <section className="today-focus today-finished"><CheckCircle2 size={30} /><div><strong>今天的任务已经完成。</strong><p>现在统一快速回看今天的句子与搭配，明天到期内容会再次进入任务。</p></div><Link className="button primary" href="/today/summary">查看今日总结 <ArrowRight size={17} /></Link></section>
      )}

    </div>
  );
}
