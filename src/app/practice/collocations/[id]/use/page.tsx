import { notFound } from "next/navigation";
import { CollocationUseExercise } from "../../../../../components/collocation-use-exercise";
import { buildCollocationUseTask } from "../../../../../domain/practice/collocation-use-task";
import { buildCollocationUseExerciseRef } from "../../../../../domain/practice/use-exercise-ref";
import { buildCollocationUseNavigation } from "../../../../../domain/review/study-navigation";
import { getLibraryData, getTodayStudyData } from "../../../../../lib/app-data";
import { isUseEvaluatorEnabled } from "../../../../../lib/ai/config";

export const dynamic = "force-dynamic";

export default async function CollocationUsePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queue?: string; index?: string; from?: string }>;
}) {
  const { id } = await params;
  const flow = await searchParams;
  const { collocations } = await getLibraryData();
  const study = await getTodayStudyData();
  const collocation = collocations.find((item) => item.id === id);
  if (!collocation?.exercise_seed.guided_application) notFound();
  const currentIndex = collocations.findIndex((item) => item.id === id);
  const navigation = buildCollocationUseNavigation({
    currentId: id,
    queue: flow.queue?.split(",") ?? [],
    index: Number(flow.index ?? -1),
    tasks: study.taskDescriptors,
    manualNextId: collocations[currentIndex + 1]?.id,
  });
  const fromProgress = flow.from === "progress";
  const flowQuery = fromProgress
    ? "?from=progress"
    : flow.queue
      ? `?queue=${encodeURIComponent(flow.queue)}&index=${Number(flow.index ?? -1)}`
      : "";
  return <div className="page recall-page use-page">
    <CollocationUseExercise
      collocation={collocation}
      task={buildCollocationUseTask(collocation)}
      exerciseRef={buildCollocationUseExerciseRef(collocation)}
      evaluatorEnabled={isUseEvaluatorEnabled()}
      returnHref={fromProgress ? `/progress/collocation/${id}` : navigation.returnHref}
      returnLabel={fromProgress ? "返回学习记录" : undefined}
      nextHref={fromProgress ? `/progress/collocation/${id}` : navigation.nextHref}
      nextLabel={fromProgress ? "返回学习记录" : navigation.nextLabel}
      sourceHref={`/library/collocations/${id}`}
      retryHref={`/practice/collocations/${id}/use${flowQuery}`}
    />
  </div>;
}
