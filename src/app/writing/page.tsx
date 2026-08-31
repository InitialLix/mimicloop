import type { Metadata } from "next";
import { GuidedWritingStudio } from "../../components/guided-writing-studio";
import { PageHeader } from "../../components/page-header";
import { getGuidedWritingPrompts } from "../../lib/app-data";
import { getGuidedWritingConfig } from "../../lib/ai/config";
import { resolveGuidedWritingPromptId } from "../../domain/writing/prompt-selection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "写作练习 — MimicLoop",
  description: "分析 IELTS Task 2 题目要求，并建立逐段写作地图。",
};

export default async function GuidedWritingPage({
  searchParams,
}: {
  searchParams: Promise<{ essay?: string | string[] }>;
}) {
  const prompts = await getGuidedWritingPrompts();
  const query = await searchParams;
  const initialSourceEssayId = resolveGuidedWritingPromptId(prompts, query.essay);
  const coachConfig = getGuidedWritingConfig();
  return (
    <div className="page page-writing">
      <PageHeader
        eyebrow="GUIDED WRITING · PHASE 2.5H"
        title="先想清楚，再用英语写"
        description="从论证链和语料激活开始，完成两个主体段、开头与结论，再把四段原文组装成完整文章。Agent 分项检查，但不会替你提供观点、改写全文或预测分数。"
        action={<span className="writing-phase-chip">English coaching</span>}
      />
      <GuidedWritingStudio
        prompts={prompts}
        coachEnabled={coachConfig.enabled}
        initialSourceEssayId={initialSourceEssayId}
      />
    </div>
  );
}
