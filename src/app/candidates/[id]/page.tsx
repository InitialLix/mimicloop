import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { CandidateReviewEditor } from "../../../components/candidate-review-editor";
import { getCandidateReviewData } from "../../../lib/app-data";
import { isCompetitionMode } from "../../../lib/competition-mode";

export const dynamic = "force-dynamic";

export default async function CandidateReviewPage({ params }: { params: Promise<{ id: string }> }) {
  if (isCompetitionMode()) notFound();
  const { id } = await params;
  const data = await getCandidateReviewData(id);
  if (!data) notFound();

  return <div className="page candidate-review-page">
    <Link className="back-link" href="/candidates"><ArrowLeft size={16} /> 返回候选列表</Link>
    <CandidateReviewEditor candidate={data.candidate} source={data.source} />
  </div>;
}
