import Link from "next/link";
import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { getTodayStudyData } from "../../../lib/app-data";
import { taskStartHref } from "../../../domain/review/study-navigation";

export const dynamic = "force-dynamic";

export default async function TodaySummaryPage() {
  const study = await getTodayStudyData();
  const queue = study.queue.map((task) => task.key);
  const unfinishedIndex = study.queue.findIndex((task) => !study.completedTaskKeys.includes(task.key));
  const unfinished = unfinishedIndex >= 0 ? study.queue[unfinishedIndex] : undefined;
  const continueHref = unfinished ? taskStartHref({ task: unfinished, queue, index: unfinishedIndex }) : "/today";
  return (
    <div className="page today-summary-page">
      <section className="today-summary-head">
        {unfinished ? <RotateCcw size={36} /> : <CheckCircle2 size={36} />}
        <p className="eyebrow">{unfinished ? "TODAY IN PROGRESS" : "TODAY COMPLETE"}</p>
        <h1>{unfinished ? "今天还有任务没有完成。" : "今天的任务完成了。"}</h1>
        <p>{unfinished ? `已完成 ${study.completedCount} / ${study.queue.length} 项，可以继续完成今日队列。` : "快速回看今天的句子与搭配，明天到期内容会再次进入复习任务。"}</p>
        {unfinished ? <Link className="button primary" href={continueHref}>继续今日学习 <ArrowRight size={17} /></Link> : null}
      </section>
      <section className="same-day-review">
        <div className="same-day-title"><RotateCcw size={18} /><div><strong>{unfinished ? "今日任务预览" : "今日结束复习"}</strong><span>{unfinished ? "完成剩余内容后，这里会统一提醒你快速回看。" : "只快速读一遍，确认还能看懂句子的逻辑和搭配含义。"}</span></div></div>
        <ol>{study.queue.map((task, index) => <li key={task.key}><span>{String(index + 1).padStart(2, "0")}</span><div><p>{task.kind === "sentence" ? task.card.learning_sentence : task.collocation.canonical_text}</p><small>{task.kind === "sentence" ? task.card.translation_zh : task.collocation.translation_prompt}</small></div>{study.completedTaskKeys.includes(task.key) ? <CheckCircle2 size={17} /> : null}</li>)}</ol>
      </section>
      {!unfinished ? <div className="summary-actions"><Link className="button secondary" href="/library">浏览语料库</Link><Link className="button primary" href="/today">回到今日学习</Link></div> : null}
    </div>
  );
}
