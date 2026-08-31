import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronDown, Clock3, PenLine, RotateCcw } from "lucide-react";
import { notFound } from "next/navigation";
import type { EvidenceDimension, EvidenceOutcome } from "../../../../domain/learner-model/learning-evidence";
import { getLearnerAssetDetail } from "../../../../lib/app-data";
import { summarizeLearnerAsset } from "../../../../lib/learner-summary";

export const dynamic = "force-dynamic";

const evidenceDimensionLabels: Record<EvidenceDimension, string> = {
  recall: "回忆",
  guided_use: "按提示运用",
  transfer_use: "换场景运用",
  spontaneous_use: "自发运用",
  delayed_retention: "延时保留",
};

const outcomeLabels: Record<EvidenceOutcome, string> = {
  success: "独立完成",
  partial: "部分证据",
  failure: "尚未完成",
  not_judged: "未纳入判断",
};

const selfRatingLabels: Record<string, string> = {
  forgot: "还不会",
  fuzzy: "不太稳",
  recalled: "基本能写",
  can_use: "能独立使用",
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export default async function LearnerAssetDetailPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  if (kind !== "sentence" && kind !== "collocation") notFound();
  const detail = await getLearnerAssetDetail(id);
  if (!detail || detail.kind !== kind) notFound();
  const summary = summarizeLearnerAsset(detail.state, detail.evidence);
  const latestEvidence = detail.evidence.find((entry) => entry.outcome !== "not_judged") ?? detail.evidence[0];
  const recallCount = detail.evidence.filter((entry) => entry.dimension === "recall").length;
  const useCount = detail.evidence.filter((entry) => entry.dimension === "guided_use" || entry.dimension === "transfer_use").length;
  const latestResult = latestEvidence
    ? latestEvidence.context.evaluatorVerdict === "pass"
      ? "Use 通过"
      : `${evidenceDimensionLabels[latestEvidence.dimension]} · ${outcomeLabels[latestEvidence.outcome]}`
    : "暂无记录";

  return <div className="page learner-detail-page">
    <Link className="back-link" href="/progress"><ArrowLeft size={16} /> 返回学习进度</Link>

    <header className="learner-detail-head">
      <span>{detail.kind === "sentence" ? "单句学习记录" : "搭配学习记录"}</span>
      <h1>{detail.label}</h1>
      <p>{detail.translation}</p>
      <div className="learner-training-target"><span>{detail.trainingTargetLabel}</span><strong>{detail.trainingTarget}</strong></div>
      <div className="learner-detail-actions">
        <Link className="button secondary" href={detail.learningHref}><BookOpen size={16} /> 查看学习内容</Link>
        <Link className="button secondary" href={detail.recallHref}><RotateCcw size={16} /> 再做 Recall</Link>
        {detail.useHref ? <Link className="button primary" href={detail.useHref}><PenLine size={16} /> 再做 Use</Link> : null}
      </div>
    </header>

    <section className="learner-current-summary" data-stage={summary.stage} aria-labelledby="current-stage-title">
      <div><span>学习状态</span><strong id="current-stage-title">{summary.label}</strong></div>
      <div><span>判定</span><p>{summary.reason}</p></div>
      <div><span>独立验证</span><p>{summary.upgradeCondition}</p></div>
      <div><span>最近记录</span><p>{latestResult}{latestEvidence
        ? ` · ${latestEvidence.independent ? "无提示" : latestEvidence.context.hintLevel ? "使用提示/参考答案" : "未独立通过"} · ${formatTime(latestEvidence.occurredAt)}`
        : ""}</p></div>
      <div><span>练习记录</span><p>Recall {recallCount} · Use {useCount}</p></div>
    </section>

    <details className="learner-history-disclosure">
      <summary>查看全部 {detail.evidence.length} 条学习记录 <ChevronDown size={16} /></summary>
      <p>这里只用于查看历次答案和判断来源，平时学习无需展开。</p>
      <div className="learner-evidence-list">
        {detail.evidence.map((entry) => (
          <article key={entry.id} data-outcome={entry.outcome}>
            <div className="learner-evidence-marker" aria-hidden="true" />
            <div className="learner-evidence-main">
              <header>
                <div><span>{evidenceDimensionLabels[entry.dimension]}</span><strong>{outcomeLabels[entry.outcome]}</strong></div>
                <time dateTime={entry.occurredAt}><Clock3 size={14} /> {formatTime(entry.occurredAt)}</time>
              </header>
              {entry.userAnswer ? <blockquote>{entry.userAnswer}</blockquote> : null}
              <div className="learner-evidence-meta">
                {entry.selfRating ? <span>自评：{selfRatingLabels[entry.selfRating] ?? entry.selfRating}</span> : null}
                <span>{entry.independent ? "无提示独立完成" : entry.context.hintLevel ? "使用过提示或参考答案" : "未形成独立成功"}</span>
                {entry.context.evaluatorVerdict && entry.context.evaluatorVerdict !== "legacy_self_rating"
                  ? <span>AI 判断：{entry.context.evaluatorVerdict}</span>
                  : null}
                {entry.evaluator.model !== "deterministic" && entry.evaluator.model !== "unknown"
                  ? <span>模型：{entry.evaluator.model}</span>
                  : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </details>
  </div>;
}
