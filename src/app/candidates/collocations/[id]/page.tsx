import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { CollocationReviewEditor } from "../../../../components/collocation-review-editor";
import { getCollocationCandidateReviewData } from "../../../../lib/app-data";
import { isCompetitionMode } from "../../../../lib/competition-mode";

export const dynamic = "force-dynamic";

export default async function CollocationCandidateReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ batch?: string; status?: string }>;
}) {
  if (isCompetitionMode()) notFound();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getCollocationCandidateReviewData(id);
  if (!data) notFound();
  const backHref = `/candidates/collocations?status=${query.status ?? "candidate"}&batch=${query.batch ?? "1"}`;

  return <div className="page candidate-review-page">
    <Link className="back-link" href={backHref}><ArrowLeft size={16} /> 返回当前审核批次</Link>
    <CollocationReviewEditor {...data} />
  </div>;
}
