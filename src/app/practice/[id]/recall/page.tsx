import { notFound } from "next/navigation";
import { RecallExercise } from "../../../../components/recall-exercise";
import { buildRecallNavigation } from "../../../../domain/review/study-navigation";
import { getLibraryData } from "../../../../lib/app-data";

export const dynamic = "force-dynamic";

export default async function RecallPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queue?: string; index?: string; from?: string }>;
}) {
  const { id } = await params;
  const flow = await searchParams;
  const { cards } = await getLibraryData();
  const card = cards.find((item) => item.id === id);
  if (!card) notFound();
  const navigation = buildRecallNavigation({
    cardIds: cards.map((item) => item.id),
    currentId: id,
    queue: flow.queue?.split(",") ?? [],
    index: Number(flow.index ?? -1),
  });
  const fromProgress = flow.from === "progress";
  return <div className="page recall-page"><RecallExercise
    card={card}
    returnHref={fromProgress ? `/progress/sentence/${id}` : navigation.returnHref}
    returnLabel={fromProgress ? "返回学习记录" : undefined}
    nextHref={fromProgress ? `/practice/${id}/use?from=progress` : navigation.nextHref}
    nextLabel={navigation.nextLabel}
  /></div>;
}
