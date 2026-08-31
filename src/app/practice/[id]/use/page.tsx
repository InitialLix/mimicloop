import { notFound } from "next/navigation";
import { UseExercise } from "../../../../components/use-exercise";
import { buildSentenceUseExerciseRef } from "../../../../domain/practice/use-exercise-ref";
import { buildUseTask } from "../../../../domain/practice/use-task";
import { buildUseNavigation } from "../../../../domain/review/study-navigation";
import { getLibraryData, getTodayStudyData } from "../../../../lib/app-data";
import { isUseEvaluatorEnabled } from "../../../../lib/ai/config";

export const dynamic = "force-dynamic";

export default async function UsePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queue?: string; index?: string; from?: string }>;
}) {
  const { id } = await params;
  const flow = await searchParams;
  const { cards } = await getLibraryData();
  const study = await getTodayStudyData();
  const card = cards.find((item) => item.id === id);
  if (!card) notFound();
  const index = Number(flow.index ?? -1);
  const navigation = buildUseNavigation({
    cardIds: cards.map((item) => item.id),
    currentId: id,
    queue: flow.queue?.split(",") ?? [],
    index,
    tasks: study.taskDescriptors,
  });
  const task = buildUseTask(card);
  const fromProgress = flow.from === "progress";
  const flowQuery = fromProgress
    ? "?from=progress"
    : flow.queue
      ? `?queue=${encodeURIComponent(flow.queue)}&index=${index}`
      : "";

  return <div className="page recall-page use-page"><UseExercise
    card={card}
    task={task}
    exerciseRef={buildSentenceUseExerciseRef(card, task.exerciseType)}
    evaluatorEnabled={isUseEvaluatorEnabled()}
    returnHref={fromProgress ? `/progress/sentence/${id}` : navigation.returnHref}
    returnLabel={fromProgress ? "返回学习记录" : undefined}
    nextHref={fromProgress ? `/progress/sentence/${id}` : navigation.nextHref}
    nextLabel={fromProgress ? "返回学习记录" : navigation.nextLabel}
    sourceHref={`/library/${id}`}
    retryHref={`/practice/${id}/use${flowQuery}`}
  /></div>;
}
