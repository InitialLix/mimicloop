import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed } from "lucide-react";
import { getLibraryData } from "../../../../lib/app-data";
import { loadCollocationUsePromptCandidates } from "../../../../lib/collocation-use-prompt-candidates";
import { isCompetitionMode } from "../../../../lib/competition-mode";

export const dynamic = "force-dynamic";

const pageSize = 20;

export default async function CollocationUsePromptCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; status?: string }>;
}) {
  if (isCompetitionMode()) notFound();
  const query = await searchParams;
  const [{ collocations }, batch] = await Promise.all([
    getLibraryData(),
    loadCollocationUsePromptCandidates(),
  ]);
  const collocationMap = new Map(collocations.map((item) => [item.id, item]));
  const status = query.status === "approved" || query.status === "candidate" ? query.status : "all";
  const filtered = status === "all" ? batch.items : batch.items.filter((item) => item.review_status === status);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number.parseInt(query.batch ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const approvedCount = batch.items.filter((item) => item.review_status === "approved").length;
  const pendingCount = batch.items.filter((item) => item.review_status === "candidate").length;
  const href = (nextPage: number, nextStatus = status) => `/candidates/collocations/use-prompts?status=${nextStatus}&batch=${nextPage}`;
  return <div className="page use-prompt-review-page">
    <Link className="back-link" href="/candidates/collocations"><ArrowLeft size={16} /> 返回搭配审核</Link>
    <header className="page-heading">
      <span>COLLOCATION USE REVIEW</span>
      <h1>搭配应用题候选</h1>
      <p>共 {batch.items.length} 条：{approvedCount} 条已发布，{pendingCount} 条待审核。重点检查中文句子是否自然、是否真的换了语境，以及提示是否泄露目标搭配。</p>
    </header>
    <nav className="collocation-status-filters use-prompt-status-filters" aria-label="应用题状态">
      <Link className={status === "all" ? "active" : ""} href={href(1, "all")}>全部<span>{batch.items.length}</span></Link>
      <Link className={status === "candidate" ? "active" : ""} href={href(1, "candidate")}>待审核<span>{pendingCount}</span></Link>
      <Link className={status === "approved" ? "active" : ""} href={href(1, "approved")}>已发布<span>{approvedCount}</span></Link>
    </nav>
    <section className="use-prompt-candidate-list">
      {visible.map((item, index) => {
        const collocation = collocationMap.get(item.collocation_id);
        return <article className="use-prompt-candidate" key={item.collocation_id}>
          <div className="use-prompt-candidate-index">{String((page - 1) * pageSize + index + 1).padStart(3, "0")}</div>
          <div>
            <div className="use-prompt-candidate-meta">
              <span>{item.transfer_type === "cross_topic" ? "跨话题" : "替换搭配对象"}</span>
              <span>{item.review_status === "approved" ? <CheckCircle2 size={14} /> : <CircleDashed size={14} />}{item.review_status === "approved" ? "已批准" : "待审核"}</span>
            </div>
            <h2>{collocation?.canonical_text ?? item.target_surface}</h2>
            <p className="use-prompt-candidate-zh">{item.prompt_zh}</p>
            {item.hints.length ? <p className="use-prompt-candidate-hints">提示：{item.hints.map((hint) => `${hint.zh}（${hint.en}）`).join("；")}</p> : null}
            <p className="use-prompt-candidate-answer">{item.reference_answer}</p>
          </div>
          {item.review_status === "approved" ? <Link aria-label="预览应用题" href={`/practice/collocations/${item.collocation_id}/use`}><ArrowRight size={18} /></Link> : <span />}
        </article>;
      })}
    </section>
    <nav className="collocation-pagination" aria-label="应用题批次">
      {page > 1 ? <Link className="button quiet" href={href(page - 1)}><ChevronLeft size={15} /> 上一批</Link> : <span />}
      <span>第 {page} / {totalPages} 批，每批 {pageSize} 条</span>
      {page < totalPages ? <Link className="button quiet" href={href(page + 1)}>下一批 <ChevronRight size={15} /></Link> : <span />}
    </nav>
  </div>;
}
