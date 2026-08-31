import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, CheckCircle2, ChevronRight, Clock3, FilePenLine, XCircle } from "lucide-react";
import { PageHeader } from "../../components/page-header";
import { getCandidates } from "../../lib/app-data";
import { isCompetitionMode } from "../../lib/competition-mode";

export const dynamic = "force-dynamic";

const statusMeta = {
  candidate: { label: "待审核", icon: AlertCircle },
  needs_edit: { label: "待修改", icon: FilePenLine },
  approved: { label: "已收录", icon: CheckCircle2 },
  deferred: { label: "暂缓", icon: Clock3 },
  rejected: { label: "已驳回", icon: XCircle },
} as const;

export default async function CandidatesPage() {
  if (isCompetitionMode()) notFound();
  const candidates = await getCandidates();
  const pending = candidates.filter((item) => item.workflow_status !== "approved" && item.workflow_status !== "rejected");
  const processed = candidates.filter((item) => item.workflow_status === "approved" || item.workflow_status === "rejected");
  const approvedCount = candidates.filter((item) => item.workflow_status === "approved").length;
  const rejectedCount = candidates.filter((item) => item.workflow_status === "rejected").length;

  const renderCandidate = (candidate: typeof candidates[number]) => {
    const meta = statusMeta[candidate.workflow_status];
    const StatusIcon = meta.icon;
    return <Link className={`candidate-review-row status-${candidate.workflow_status}`} href={`/candidates/${candidate.candidate_id}`} key={candidate.candidate_id}>
      <StatusIcon size={18} />
      <div>
        <span>{meta.label} · {candidate.card.primary_focus === "vocabulary" ? "词块" : candidate.card.primary_focus === "structure" ? "结构" : "混合"}</span>
        <p>{candidate.card.learning_sentence}</p>
        <small>{candidate.recommendation_reasons[0] ?? candidate.uncertainties[0] ?? "查看候选字段与来源。"}</small>
      </div>
      <ChevronRight size={18} />
    </Link>;
  };

  return (
    <div className="page page-wide">
      <PageHeader eyebrow="CONTENT REVIEW" title="候选卡片" description="逐字段检查候选内容；只有点击批准后，修改才会发布到正式学习卡。" />
      <nav className="library-tabs candidate-kind-tabs" aria-label="候选类型">
        <Link className="active" href="/candidates">句子卡 <span>{candidates.length}</span></Link>
        <Link href="/candidates/collocations">Collocation</Link>
      </nav>
      <div className="review-summary">
        <div><AlertCircle size={19} /><span><strong>{pending.length}</strong> 待处理</span></div>
        <div><CheckCircle2 size={19} /><span><strong>{approvedCount}</strong> 已收录</span></div>
        <div><XCircle size={19} /><span><strong>{rejectedCount}</strong> 已驳回</span></div>
      </div>
      <section className="candidate-review-list">
        <div className="candidate-list-heading"><h2>待处理</h2><span>{pending.length}</span></div>
        {pending.length ? pending.map(renderCandidate) : <p className="candidate-empty">当前没有待处理候选。</p>}
      </section>
      <section className="candidate-review-list processed-list">
        <div className="candidate-list-heading"><h2>已处理</h2><span>{processed.length}</span></div>
        {processed.map(renderCandidate)}
      </section>
    </div>
  );
}
