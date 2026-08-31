import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, PenLine, Sparkles } from "lucide-react";
import { OnboardingTourPrototype } from "../components/onboarding-tour-prototype";
import { PageHeader } from "../components/page-header";
import { getLibraryData, getTodayStudyData } from "../lib/app-data";
import { isLanguageRichnessSource } from "../lib/labels";
import { isCompetitionMode } from "../lib/competition-mode";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const competitionMode = isCompetitionMode();
  const [study, library] = await Promise.all([getTodayStudyData(), getLibraryData()]);
  const languageSourceCount = library.sources.filter(isLanguageRichnessSource).length;
  const modelEssayCount = library.sources.length - languageSourceCount;
  const todayFinished = study.queue.length === 0 || study.completedCount === study.queue.length;

  return (
    <div className="page page-home">
      <PageHeader
        eyebrow="IELTS ACADEMIC · WRITING TASK 2"
        title="把雅思范文里的好句，练成自己的表达"
        description={competitionMode
          ? "这是独立的评审体验环境。你的学习和写作进度不会与其他体验者混在一起。"
          : "从今日句子训练开始，或进入范文库阅读原题与完整文章。"}
        action={(
          <div className="home-brand-stack">
            <div className="home-product-brand">
              <Image
                className="home-product-logo"
                src="/mimicloop-logo.png"
                alt="MimicLoop — IELTS Writing · Learn by Mimicry"
                width={1254}
                height={1254}
                priority
              />
            </div>
            <OnboardingTourPrototype />
          </div>
        )}
      />

      <section className="home-entry-grid" aria-label="主要功能">
        <Link className="home-entry-card home-entry-study" href="/today">
          <span className="home-entry-topline">
            <span className="home-entry-icon" aria-hidden="true"><Sparkles size={22} /></span>
            <span>DAILY PRACTICE</span>
          </span>
          <h2>{todayFinished ? "今天的学习已经完成" : "开始今日学习"}</h2>
          <p>按今日队列学习新句、完成回忆与仿写练习。</p>
          <span className="home-entry-metrics">
            <span><strong>{study.queue.length}</strong> 个今日任务</span>
            <span><strong>{study.dueCount}</strong> 个到期复习</span>
            <span><strong>{study.completedCount}</strong> 个已完成</span>
          </span>
          <span className="home-entry-action">
            {todayFinished ? "查看今日总结" : study.completedCount ? "继续今日学习" : "进入今日学习"}
            <ArrowRight size={17} aria-hidden="true" />
          </span>
        </Link>

        <Link className="home-entry-card home-entry-reading" href="/library/essays">
          <span className="home-entry-topline">
            <span className="home-entry-icon" aria-hidden="true"><BookOpen size={22} /></span>
            <span>SOURCE READING</span>
          </span>
          <h2>阅读原文</h2>
          <p>分别浏览 IELTS 范文和其他英语原文，并从标记内容进入学习卡。</p>
          <span className="home-entry-metrics">
            <span><strong>{modelEssayCount}</strong> 篇 Task 2 范文</span>
            <span><strong>{languageSourceCount}</strong> 篇英语课文</span>
            <span><strong>{library.cards.length}</strong> 个已收录好句</span>
          </span>
          <span className="home-entry-action">
            进入原文库 <ArrowRight size={17} aria-hidden="true" />
          </span>
        </Link>
      </section>

      <Link className="home-writing-entry" href="/writing">
        <span className="home-writing-icon" aria-hidden="true"><PenLine size={22} /></span>
        <span className="home-writing-copy">
          <small>GUIDED WRITING · NEW</small>
          <strong>从审题开始，搭好整篇文章结构</strong>
          <p>先拆清题目要求与段落分工，为逐段写作做好准备。</p>
        </span>
        <span className="home-writing-action">进入写作练习 <ArrowRight size={17} aria-hidden="true" /></span>
      </Link>

      <p className="source-caveat">MimicLoop 是独立学习工具，与 IELTS 官方无隶属或合作关系。当前 IELTS 范文来自 Simon 教师范文；《新概念英语 3》作为英语课文单列，不作为 IELTS model essay。</p>
    </div>
  );
}
