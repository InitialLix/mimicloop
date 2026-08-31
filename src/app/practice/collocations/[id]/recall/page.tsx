import { notFound } from "next/navigation";
import { CollocationRecallExercise } from "../../../../../components/collocation-recall-exercise";
import { getLibraryData, getTodayStudyData } from "../../../../../lib/app-data";
import { buildCollocationRecallNavigation } from "../../../../../domain/review/study-navigation";

export const dynamic = "force-dynamic";

export default async function CollocationRecallPage({
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
  if (!collocation) notFound();
  const currentIndex = collocations.findIndex((item) => item.id === id);
  const navigation = buildCollocationRecallNavigation({
    currentId: id,
    queue: flow.queue?.split(",") ?? [],
    index: Number(flow.index ?? -1),
    tasks: study.taskDescriptors,
    manualNextId: collocations[currentIndex + 1]?.id,
    requiresUse: Boolean(collocation.exercise_seed.guided_application),
  });
  const fromProgress = flow.from === "progress";
  const requiresUse = Boolean(collocation.exercise_seed.guided_application);
  return <div className="page recall-page">
    <CollocationRecallExercise
      collocation={collocation}
      returnHref={fromProgress ? `/progress/collocation/${id}` : navigation.returnHref}
      returnLabel={fromProgress ? "返回学习记录" : undefined}
      nextHref={fromProgress
        ? requiresUse ? `/practice/collocations/${id}/use?from=progress` : `/progress/collocation/${id}`
        : navigation.nextHref}
      nextLabel={fromProgress && !requiresUse ? "返回学习记录" : navigation.nextLabel}
      requiresUse={requiresUse}
    />
  </div>;
}
