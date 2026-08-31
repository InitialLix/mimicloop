import { headers } from "next/headers";
import {
  COMPETITION_SESSION_HEADER,
  isCompetitionMode,
  isValidCompetitionSessionId,
} from "./competition-mode";

type Counter = { window: number; count: number };

const perSession = new Map<string, Counter>();
let globalCounter: Counter = { window: -1, count: 0 };

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export class CompetitionAiQuotaError extends Error {
  constructor() {
    super("本次体验的 AI 调用暂时达到上限，请稍后再试；已输入的内容不会丢失。");
    this.name = "CompetitionAiQuotaError";
  }
}

export async function assertCompetitionAiQuota() {
  if (!isCompetitionMode()) return;
  const sessionId = (await headers()).get(COMPETITION_SESSION_HEADER);
  if (!isValidCompetitionSessionId(sessionId)) throw new CompetitionAiQuotaError();

  const window = Math.floor(Date.now() / 3_600_000);
  const sessionLimit = positiveInteger(process.env.MIMICLOOP_AI_CALLS_PER_SESSION_HOUR, 100);
  const globalLimit = positiveInteger(process.env.MIMICLOOP_AI_CALLS_GLOBAL_HOUR, 500);
  const currentSession = perSession.get(sessionId);
  const sessionCounter = currentSession?.window === window
    ? currentSession
    : { window, count: 0 };
  if (globalCounter.window !== window) {
    globalCounter = { window, count: 0 };
    perSession.clear();
  }
  if (sessionCounter.count >= sessionLimit || globalCounter.count >= globalLimit) {
    throw new CompetitionAiQuotaError();
  }
  sessionCounter.count += 1;
  globalCounter.count += 1;
  perSession.set(sessionId, sessionCounter);
}
