import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FilePenLine,
  GitMerge,
  XCircle,
} from "lucide-react";
import { PageHeader } from "../../../components/page-header";
import { getCollocationCandidates } from "../../../lib/app-data";
import { loadCollocationUsePromptCandidates } from "../../../lib/collocation-use-prompt-candidates";
import type { CollocationWorkflowStatus } from "../../../lib/content-types";
import { isCompetitionMode } from "../../../lib/competition-mode";

export const dynamic = "force-dynamic";

const pageSize = 20;
const statusMeta = {
  candidate: { label: "待审核", icon: AlertCircle },
  needs_edit: { label: "待修改", icon: FilePenLine },
  approved: { label: "已收录", icon: CheckCircle2 },
  deferred: { label: "暂缓", icon: Clock3 },
  rejected: { label: "已驳回", icon: XCircle },
  merged: { label: "已合并", icon: GitMerge },
  archived: { label: "已归档", icon: Clock3 },
} as const;

const validStatuses = new Set<CollocationWorkflowStatus>(Object.keys(statusMeta) as CollocationWorkflowStatus[]);

export default async function CollocationCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; status?: string }>;
}) {
  if (isCompetitionMode()) notFound();
  const query = await searchParams;
  const [candidates, usePromptBatch] = await Promise.all([
    getCollocationCandidates(),
    loadCollocationUsePromptCandidates(),
  ]);
  const status = validStatuses.has(query.status as CollocationWorkflowStatus)
    ? query.status as CollocationWorkflowStatus
    : "candidate";
  const filtered = candidates.filter((item) => item.workflow_status === status);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number.parseInt(query.batch ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const approvedCount = candidates.filter((item) => item.workflow_status === "approved").length;
  const pendingCount = candidates.filter((item) => ["candidate", "needs_edit", "deferred"].includes(item.workflow_status)).length;
  const directSourceCount = candidates.filter((item) => item.source_links.some((link) => link.card_id === null)).length;

  const pageHref = (nextPage: number) => `/candidates/collocations?status=${status}&batch=${nextPage}`;

  return <div className="page page-wide">
    <PageHeader
      eyebrow="CONTENT REVIEW"
      title="搭配候选"
      description="每批 20 条逐项核对。来源覆盖完整范文正文；只有人工批准后才进入正式搭配库。"
    />
    <nav className="library-tabs candidate-kind-tabs" aria-label="候选类型">
      <Link href="/candidates">句子卡</Link>
      <Link className="active" href="/candidates/collocations">Collocation <span>{candidates.length}</span></Link>
      <Link href="/candidates/collocations/use-prompts">搭配应用题 <span>{usePromptBatch.items.length}</span></Link>
    </nav>
    <div className="review-summary">
      <div><AlertCircle size={19} /><span><strong>{pendingCount}</strong> 待处理</span></div>
      <div><CheckCircle2 size={19} /><span><strong>{approvedCount}</strong> 已收录</span></div>
      <div><FilePenLine size={19} /><span><strong>{directSourceCount}</strong> 含普通正文来源</span></div>
    </div>

    <div className="collocation-review-toolbar">
      <div className="collocation-status-filters">
        {(Object.entries(statusMeta) as Array<[CollocationWorkflowStatus, typeof statusMeta[CollocationWorkflowStatus]]>)
          .map(([value, meta]) => {
            const count = candidates.filter((item) => item.workflow_status === value).length;
            return <Link className={status === value ? "active" : ""} href={`/candidates/collocations?status=${value}&batch=1`} key={value}>
              {meta.label}<span>{count}</span>
            </Link>;
          })}
      </div>
      <span>第 {page} / {totalPages} 批</span>
    </div>

    <section className="candidate-review-list collocation-review-list">
      {visible.length ? visible.map((candidate) => {
        const meta = statusMeta[candidate.workflow_status];
        const StatusIcon = meta.icon;
        const hasDirectSource = candidate.source_links.some((link) => link.card_id === null);
        return <Link
          className={`candidate-review-row status-${candidate.workflow_status}`}
          href={`/candidates/collocations/${candidate.id}?status=${status}&batch=${page}`}
          key={candidate.id}
        >
          <StatusIcon size={18} />
          <div>
            <span>{meta.label} · {candidate.expression_type === "sentence_frame" ? "句型" : candidate.expression_type === "fixed_phrase" ? "固定短语" : "搭配"} · {hasDirectSource ? "含普通正文来源" : "已有关联句子卡"}</span>
            <p>{candidate.canonical_text}</p>
            <small>{candidate.translation_prompt} · {candidate.source_links.length} 处来源</small>
          </div>
          <ChevronRight size={18} />
        </Link>;
      }) : <p className="candidate-empty">当前筛选下没有候选搭配。</p>}
    </section>

    <nav className="collocation-pagination" aria-label="候选批次">
      {page > 1 ? <Link className="button quiet" href={pageHref(page - 1)}><ChevronLeft size={15} /> 上一批</Link> : <span />}
      <span>每批 {pageSize} 条，共 {filtered.length} 条</span>
      {page < totalPages ? <Link className="button quiet" href={pageHref(page + 1)}>下一批 <ChevronRight size={15} /></Link> : <span />}
    </nav>
  </div>;
}
