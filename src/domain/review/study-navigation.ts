export type StudyTaskDescriptor = {
  key: string;
  kind: "sentence" | "collocation";
  id: string;
  isNew: boolean;
  recallCompleted: boolean;
  requiresUse?: boolean;
};

export function sentenceTaskKey(id: string) {
  return `sentence:${id}`;
}

export function collocationTaskKey(id: string) {
  return `collocation:${id}`;
}

export function taskStartHref({
  task,
  queue,
  index,
}: {
  task: StudyTaskDescriptor;
  queue: string[];
  index: number;
}) {
  const query = queue.length ? `?queue=${encodeURIComponent(queue.join(","))}&index=${index}` : "";
  if (task.kind === "sentence") {
    return task.recallCompleted
      ? `/practice/${task.id}/use${query}`
      : `/library/${task.id}${query}`;
  }
  if (task.recallCompleted && task.requiresUse) return `/practice/collocations/${task.id}/use${query}`;
  return task.isNew
    ? `/library/collocations/${task.id}${query}`
    : `/practice/collocations/${task.id}/recall${query}`;
}

export function buildRecallNavigation({
  cardIds,
  currentId,
  queue,
  index,
}: {
  cardIds: string[];
  currentId: string;
  queue: string[];
  index: number;
}) {
  const validQueue = queue.filter((id) => cardIds.includes(id) || (
    id.startsWith("sentence:") && cardIds.includes(id.slice("sentence:".length))
  ) || id.startsWith("collocation:"));
  const currentKey = validQueue.some((key) => key.startsWith("sentence:") || key.startsWith("collocation:"))
    ? sentenceTaskKey(currentId)
    : currentId;
  const inTodayFlow = validQueue[index] === currentKey;
  const queueQuery = inTodayFlow ? `?queue=${encodeURIComponent(validQueue.join(","))}` : "";

  return {
    returnHref: inTodayFlow
      ? `/library/${currentId}${queueQuery}&index=${index}`
      : `/library/${currentId}`,
    nextHref: inTodayFlow
      ? `/practice/${currentId}/use${queueQuery}&index=${index}`
      : `/practice/${currentId}/use`,
    nextLabel: "进入应用练习",
  };
}

export function buildUseNavigation({
  cardIds,
  currentId,
  queue,
  index,
  tasks = [],
}: {
  cardIds: string[];
  currentId: string;
  queue: string[];
  index: number;
  tasks?: StudyTaskDescriptor[];
}) {
  const typedQueue = queue.some((key) => key.startsWith("sentence:") || key.startsWith("collocation:"));
  const validTaskKeys = new Set(tasks.map((task) => task.key));
  const validQueue = queue.filter((id) => typedQueue ? validTaskKeys.has(id) : cardIds.includes(id));
  const currentKey = typedQueue ? sentenceTaskKey(currentId) : currentId;
  const inTodayFlow = validQueue[index] === currentKey;
  const queueQuery = inTodayFlow ? `?queue=${encodeURIComponent(validQueue.join(","))}` : "";
  const nextQueueId = inTodayFlow ? validQueue[index + 1] : undefined;
  const currentLibraryIndex = cardIds.indexOf(currentId);
  const manualNextId = !inTodayFlow ? cardIds[currentLibraryIndex + 1] : undefined;
  const nextTask = nextQueueId ? tasks.find((task) => task.key === nextQueueId) : undefined;
  const nextHref = nextTask
    ? taskStartHref({ task: nextTask, queue: validQueue, index: index + 1 })
    : nextQueueId
      ? `/library/${nextQueueId}${queueQuery}&index=${index + 1}`
    : inTodayFlow
      ? "/today/summary"
      : manualNextId
        ? `/library/${manualNextId}`
        : "/library";

  return {
    returnHref: inTodayFlow
      ? `/practice/${currentId}/recall${queueQuery}&index=${index}`
      : `/practice/${currentId}/recall`,
    nextHref,
    nextLabel: inTodayFlow && !nextQueueId
      ? "完成今日学习"
      : manualNextId || nextQueueId
        ? "学习下一句"
        : "返回语料库",
    inTodayFlow,
    validQueue,
  };
}

export function buildCollocationRecallNavigation({
  currentId,
  queue,
  index,
  tasks,
  manualNextId,
  requiresUse = false,
}: {
  currentId: string;
  queue: string[];
  index: number;
  tasks: StudyTaskDescriptor[];
  manualNextId?: string;
  requiresUse?: boolean;
}) {
  const validTaskKeys = new Set(tasks.map((task) => task.key));
  const validQueue = queue.filter((key) => validTaskKeys.has(key));
  const inTodayFlow = validQueue[index] === collocationTaskKey(currentId);
  const queueQuery = inTodayFlow ? `?queue=${encodeURIComponent(validQueue.join(","))}&index=${index}` : "";
  const nextTask = inTodayFlow ? tasks.find((task) => task.key === validQueue[index + 1]) : undefined;
  if (!requiresUse) return {
    returnHref: `/library/collocations/${currentId}${queueQuery}`,
    nextHref: nextTask
      ? taskStartHref({ task: nextTask, queue: validQueue, index: index + 1 })
      : inTodayFlow
        ? "/today/summary"
        : manualNextId
          ? `/library/collocations/${manualNextId}`
          : "/library/collocations",
    nextLabel: inTodayFlow && !nextTask
      ? "完成今日学习"
      : nextTask || manualNextId
        ? "学习下一项"
        : "返回搭配库",
  };
  return {
    returnHref: `/library/collocations/${currentId}${queueQuery}`,
    nextHref: `/practice/collocations/${currentId}/use${queueQuery}`,
    nextLabel: "进入应用练习",
  };
}

export function buildCollocationUseNavigation({
  currentId,
  queue,
  index,
  tasks,
  manualNextId,
}: {
  currentId: string;
  queue: string[];
  index: number;
  tasks: StudyTaskDescriptor[];
  manualNextId?: string;
}) {
  const validTaskKeys = new Set(tasks.map((task) => task.key));
  const validQueue = queue.filter((key) => validTaskKeys.has(key));
  const inTodayFlow = validQueue[index] === collocationTaskKey(currentId);
  const queueQuery = inTodayFlow ? `?queue=${encodeURIComponent(validQueue.join(","))}&index=${index}` : "";
  const nextTask = inTodayFlow ? tasks.find((task) => task.key === validQueue[index + 1]) : undefined;
  return {
    returnHref: `/practice/collocations/${currentId}/recall${queueQuery}`,
    nextHref: nextTask
      ? taskStartHref({ task: nextTask, queue: validQueue, index: index + 1 })
      : inTodayFlow
        ? "/today/summary"
        : manualNextId
          ? `/library/collocations/${manualNextId}`
          : "/library/collocations",
    nextLabel: inTodayFlow && !nextTask
      ? "完成今日学习"
      : nextTask || manualNextId
        ? "学习下一项"
        : "返回搭配库",
  };
}
