import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { SentenceLearningCard } from "../../../components/sentence-learning-card";
import { HistoryBackButton } from "../../../components/history-back-button";
import { getLibraryData } from "../../../lib/app-data";
import { sentenceTaskKey } from "../../../domain/review/study-navigation";

export const dynamic = "force-dynamic";

export default async function SentencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queue?: string; index?: string }>;
}) {
  const { id } = await params;
  const flow = await searchParams;
  const { cards, sources } = await getLibraryData();
  const card = cards.find((item) => item.id === id);
  if (!card) notFound();
  const source = sources.find((item) => item.id === card.source_essay_id);
  if (!source) notFound();
  const queue = flow.queue?.split(",") ?? [];
  const index = Number(flow.index ?? -1);
  const inTodayFlow = queue[index] === id || queue[index] === sentenceTaskKey(id);
  const query = inTodayFlow ? `?queue=${encodeURIComponent(queue.join(","))}&index=${index}` : "";
  return (
    <div className="page sentence-page">
      {inTodayFlow
        ? <Link className="back-link" href="/today"><ArrowLeft size={16} /> 返回今日学习</Link>
        : <HistoryBackButton fallbackHref="/library" />}
      <SentenceLearningCard card={card} source={source} recallHref={`/practice/${card.id}/recall${query}`} />
    </div>
  );
}
