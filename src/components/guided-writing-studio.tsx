"use client";

import { ArrowRight, BookOpen, Check, ChevronDown, Circle, Compass, FileText, Loader2, Lock, PenLine, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EssayTaskAnalysisV1 } from "../domain/writing/task-analysis";
import {
  task2QuestionTypeLabels,
  task2QuestionTypes,
  task2Topics,
  type ImportedTask2PromptAnalysisResult,
  type Task2Topic,
} from "../domain/writing/imported-task2-prompt";
import type { EssayQuestionType } from "../domain/writing/task-analysis";
import {
  argumentNodeOrder,
  guidanceForNode,
  isGuidedWritingEvaluationActionable,
  type ArgumentNodeKey,
  type GuidedWritingSessionView,
} from "../domain/writing/guided-writing-coach";
import {
  paragraphNextAction,
  type GuidedWritingParagraphDraftView,
} from "../domain/writing/paragraph-evaluation";
import {
  introductionNextAction,
  type GuidedWritingIntroductionContext,
  type GuidedWritingIntroductionDraftView,
  type IntroductionComponents,
} from "../domain/writing/introduction-evaluation";
import type {
  IntroductionLanguagePart,
  IntroductionLanguageRetrievalView,
} from "../domain/writing/introduction-language-activation";
import {
  conclusionNextAction,
  type GuidedWritingConclusionContext,
  type GuidedWritingConclusionDraftView,
} from "../domain/writing/conclusion-evaluation";
import {
  fullEssayNextAction,
  type GuidedWritingFullEssayContext,
  type GuidedWritingFullEssayReviewView,
} from "../domain/writing/full-essay-evaluation";
import {
  restoreNodeLanguageWork,
  type GuidedWritingNodeLanguageAttemptView,
} from "../domain/writing/node-language-activation";
import type {
  LearnedWritingAsset,
  LearnedWritingRetrievalView,
  WritingLanguageNode,
} from "../domain/writing/learned-expression-retrieval";
import { modelDisplayName, topicLabels } from "../lib/labels";

const nodeLabels: Record<ArgumentNodeKey, string> = {
  stance: "Position",
  claim: "Main point",
  reason: "Reason",
  mechanism: "Development",
  result: "Takeaway",
};

function apiError(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const error = (value as { error?: unknown }).error;
  return typeof error === "string" ? error : fallback;
}

export function GuidedWritingStudio({
  prompts,
  coachEnabled,
  initialSourceEssayId,
}: {
  prompts: EssayTaskAnalysisV1[];
  coachEnabled: boolean;
  initialSourceEssayId: string;
}) {
  const [availablePrompts, setAvailablePrompts] = useState(prompts);
  const [selectedId, setSelectedId] = useState(initialSourceEssayId);
  const [promptImportOpen, setPromptImportOpen] = useState(false);
  const [importedPromptText, setImportedPromptText] = useState("");
  const [promptAnalysis, setPromptAnalysis] = useState<ImportedTask2PromptAnalysisResult | null>(null);
  const [confirmedQuestionType, setConfirmedQuestionType] = useState<EssayQuestionType | "">("");
  const [confirmedTopic, setConfirmedTopic] = useState<Task2Topic | "">("");
  const [promptImportBusy, setPromptImportBusy] = useState(false);
  const [promptImportMessage, setPromptImportMessage] = useState<string | null>(null);
  const [session, setSession] = useState<GuidedWritingSessionView | null>(null);
  const [answer, setAnswer] = useState("");
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [dismissedReuse, setDismissedReuse] = useState<string | null>(null);
  const [paragraphDraft, setParagraphDraft] = useState<GuidedWritingParagraphDraftView | null>(null);
  const [paragraphText, setParagraphText] = useState("");
  const [paragraphBusy, setParagraphBusy] = useState(false);
  const [paragraphMessage, setParagraphMessage] = useState<string | null>(null);
  const [expressionRetrieval, setExpressionRetrieval] = useState<LearnedWritingRetrievalView | null>(null);
  const [expressionBusy, setExpressionBusy] = useState(false);
  const [expressionMessage, setExpressionMessage] = useState<string | null>(null);
  const [activeLanguageNode, setActiveLanguageNode] = useState<WritingLanguageNode>("claim");
  const [nodeDrafts, setNodeDrafts] = useState<Partial<Record<WritingLanguageNode, string>>>({});
  const [nodeHintLevels, setNodeHintLevels] = useState<Partial<Record<WritingLanguageNode, number>>>({});
  const [nodeAttempts, setNodeAttempts] = useState<GuidedWritingNodeLanguageAttemptView[]>([]);
  const [nodeAttemptBusy, setNodeAttemptBusy] = useState(false);
  const [nodeAttemptMessages, setNodeAttemptMessages] = useState<Partial<Record<WritingLanguageNode, string>>>({});
  const [nodeAttemptRestoreMessage, setNodeAttemptRestoreMessage] = useState<string | null>(null);
  const [draftingStarted, setDraftingStarted] = useState(false);
  const [introductionStarted, setIntroductionStarted] = useState(false);
  const [introductionContext, setIntroductionContext] = useState<GuidedWritingIntroductionContext | null>(null);
  const [introductionDraft, setIntroductionDraft] = useState<GuidedWritingIntroductionDraftView | null>(null);
  const [introductionParts, setIntroductionParts] = useState<IntroductionComponents>({ opening: "", taskFraming: "", thesis: "" });
  const [introductionBusy, setIntroductionBusy] = useState(false);
  const [introductionMessage, setIntroductionMessage] = useState<string | null>(null);
  const [activeIntroductionPart, setActiveIntroductionPart] = useState<IntroductionLanguagePart>("opening");
  const [introductionExpressionRetrieval, setIntroductionExpressionRetrieval] = useState<IntroductionLanguageRetrievalView | null>(null);
  const [introductionExpressionBusy, setIntroductionExpressionBusy] = useState(false);
  const [introductionExpressionMessage, setIntroductionExpressionMessage] = useState<string | null>(null);
  const [introductionHintLevels, setIntroductionHintLevels] = useState<Partial<Record<IntroductionLanguagePart, number>>>({});
  const [conclusionStarted, setConclusionStarted] = useState(false);
  const [conclusionContext, setConclusionContext] = useState<GuidedWritingConclusionContext | null>(null);
  const [conclusionDraft, setConclusionDraft] = useState<GuidedWritingConclusionDraftView | null>(null);
  const [conclusionText, setConclusionText] = useState("");
  const [conclusionBusy, setConclusionBusy] = useState(false);
  const [conclusionMessage, setConclusionMessage] = useState<string | null>(null);
  const [fullEssayStarted, setFullEssayStarted] = useState(false);
  const [fullEssayContext, setFullEssayContext] = useState<GuidedWritingFullEssayContext | null>(null);
  const [fullEssayReview, setFullEssayReview] = useState<GuidedWritingFullEssayReviewView | null>(null);
  const [fullEssayBusy, setFullEssayBusy] = useState(false);
  const [fullEssayMessage, setFullEssayMessage] = useState<string | null>(null);
  const coachRef = useRef<HTMLElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const selected = useMemo(
    () => availablePrompts.find((item) => item.sourceEssayId === selectedId) ?? availablePrompts[0],
    [availablePrompts, selectedId],
  );

  function selectEssay(sourceEssayId: string) {
    setSelectedId(sourceEssayId);
    const url = new URL(window.location.href);
    url.searchParams.set("essay", sourceEssayId);
    window.history.replaceState(window.history.state, "", url);
  }

  function resetPromptImport() {
    setImportedPromptText(""); setPromptAnalysis(null); setConfirmedQuestionType(""); setConfirmedTopic(""); setPromptImportMessage(null);
  }

  async function analyzeNewPrompt() {
    if (promptImportBusy || importedPromptText.trim().length < 30) return;
    setPromptImportBusy(true); setPromptImportMessage(null); setPromptAnalysis(null);
    try {
      const response = await fetch("/api/guided-writing/prompts/analyze", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ analysisId: crypto.randomUUID(), prompt: importedPromptText }),
      });
      const payload = await response.json() as ImportedTask2PromptAnalysisResult & { error?: unknown };
      if (!response.ok || !payload.analysisId) throw new Error(apiError(payload, "暂时无法识别这道题。"));
      setImportedPromptText(payload.prompt); setPromptAnalysis(payload);
      setConfirmedQuestionType(payload.analysis?.question_type ?? "");
      setConfirmedTopic(payload.analysis?.topic ?? "");
      setPromptImportMessage(payload.message ?? null);
    } catch (error) {
      setPromptImportMessage(error instanceof Error ? error.message : "暂时无法识别这道题。");
    } finally { setPromptImportBusy(false); }
  }

  async function confirmNewPrompt() {
    if (!promptAnalysis || !confirmedQuestionType || !confirmedTopic || promptImportBusy) return;
    setPromptImportBusy(true); setPromptImportMessage(null);
    try {
      const response = await fetch("/api/guided-writing/prompts", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ analysisId: promptAnalysis.analysisId, prompt: promptAnalysis.prompt, questionType: confirmedQuestionType, topic: confirmedTopic }),
      });
      const payload = await response.json() as { prompt?: EssayTaskAnalysisV1; created?: boolean; error?: unknown };
      if (!response.ok || !payload.prompt) throw new Error(apiError(payload, "无法保存这道题。"));
      setAvailablePrompts((current) => current.some((item) => item.sourceEssayId === payload.prompt!.sourceEssayId) ? current : [payload.prompt!, ...current]);
      selectEssay(payload.prompt.sourceEssayId);
      setPromptImportOpen(false); resetPromptImport();
      requestAnimationFrame(() => document.querySelector(".writing-prompt-paper")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error) { setPromptImportMessage(error instanceof Error ? error.message : "无法保存这道题。"); }
    finally { setPromptImportBusy(false); }
  }

  useEffect(() => {
    setSession(null);
    setAnswer("");
    setCoachMessage(null);
    setDismissedReuse(null);
    setParagraphDraft(null);
    setParagraphText("");
    setParagraphMessage(null);
    setExpressionRetrieval(null);
    setExpressionMessage(null);
    setActiveLanguageNode("claim");
    setNodeDrafts({});
    setNodeHintLevels({});
    setNodeAttempts([]);
    setNodeAttemptMessages({});
    setNodeAttemptRestoreMessage(null);
    setDraftingStarted(false);
    setIntroductionStarted(false);
    setIntroductionContext(null);
    setIntroductionDraft(null);
    setIntroductionParts({ opening: "", taskFraming: "", thesis: "" });
    setIntroductionMessage(null);
    setActiveIntroductionPart("opening");
    setIntroductionExpressionRetrieval(null);
    setIntroductionExpressionMessage(null);
    setIntroductionHintLevels({});
    setConclusionStarted(false);
    setConclusionContext(null);
    setConclusionDraft(null);
    setConclusionText("");
    setConclusionMessage(null);
    setFullEssayStarted(false);
    setFullEssayContext(null);
    setFullEssayReview(null);
    setFullEssayMessage(null);
    if (!coachEnabled || !selectedId) return;
    const controller = new AbortController();
    void fetch(`/api/guided-writing/sessions?sourceEssayId=${encodeURIComponent(selectedId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { session?: GuidedWritingSessionView | null };
        if (response.ok) {
          const loadedSession = payload.session ?? null;
          setSession(loadedSession);
          const latest = loadedSession?.turns.at(-1);
          if (latest?.evaluation?.verdict !== "accept" && latest?.learnerAnswer) {
            setAnswer(latest.learnerAnswer);
          }
          if (latest?.evaluation && !isGuidedWritingEvaluationActionable(latest.node, latest.evaluation)) {
            setCoachMessage("上一条 AI 反馈与当前步骤不匹配，已忽略。原回答已保留，可直接重新检查。");
          }
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setCoachMessage("暂时无法读取写作会话。");
      });
    return () => controller.abort();
  }, [coachEnabled, selectedId]);

  useEffect(() => {
    if (!session || session.status !== "ready_to_draft") return;
    const controller = new AbortController();
    void fetch(`/api/guided-writing/drafts?sessionId=${encodeURIComponent(session.id)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { draft?: GuidedWritingParagraphDraftView | null };
        if (!response.ok) return;
        const loadedDraft = payload.draft ?? null;
        setParagraphDraft(loadedDraft);
        if (loadedDraft) {
          setParagraphText(loadedDraft.draftText);
          setDraftingStarted(true);
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setParagraphMessage("Unable to restore the latest paragraph draft.");
        }
      });
    return () => controller.abort();
  }, [session?.id, session?.status]);

  useEffect(() => {
    if (!coachEnabled || !introductionStarted || !selectedId) return;
    const controller = new AbortController();
    setIntroductionExpressionBusy(true);
    setIntroductionExpressionMessage(null);
    setIntroductionExpressionRetrieval(null);
    void fetch(`/api/guided-writing/introduction-expressions?sourceEssayId=${encodeURIComponent(selectedId)}&part=${activeIntroductionPart}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json() as { retrieval?: IntroductionLanguageRetrievalView; error?: unknown };
        if (!response.ok || !payload.retrieval) throw new Error(apiError(payload, "Unable to retrieve introduction language."));
        setIntroductionExpressionRetrieval(payload.retrieval);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setIntroductionExpressionMessage(error instanceof Error ? error.message : "Unable to retrieve introduction language.");
        }
      })
      .finally(() => setIntroductionExpressionBusy(false));
    return () => controller.abort();
  }, [activeIntroductionPart, coachEnabled, introductionStarted, selectedId]);

  useEffect(() => {
    if (!session || session.paragraphKey !== "body_2" || session.status !== "ready_to_draft") return;
    const controller = new AbortController();
    void fetch(`/api/guided-writing/introductions?sourceEssayId=${encodeURIComponent(session.sourceEssayId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as {
          context?: GuidedWritingIntroductionContext;
          draft?: GuidedWritingIntroductionDraftView | null;
        };
        if (!response.ok || !payload.context || !payload.draft) return;
        setIntroductionContext(payload.context);
        setIntroductionDraft(payload.draft);
        setIntroductionParts(payload.draft.components);
        setIntroductionStarted(true);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setIntroductionMessage("Unable to restore the latest introduction draft.");
        }
      });
    return () => controller.abort();
  }, [session?.id, session?.paragraphKey, session?.sourceEssayId, session?.status]);

  useEffect(() => {
    if (!selectedId || introductionDraft?.status !== "success" || introductionDraft.evaluation?.task_response.status !== "clear" || introductionDraft.evaluation.language.status !== "clear") return;
    const controller = new AbortController();
    void fetch(`/api/guided-writing/conclusions?sourceEssayId=${encodeURIComponent(selectedId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { context?: GuidedWritingConclusionContext; draft?: GuidedWritingConclusionDraftView | null };
        if (!response.ok || !payload.context || !payload.draft) return;
        setConclusionContext(payload.context); setConclusionDraft(payload.draft); setConclusionText(payload.draft.conclusionText); setConclusionStarted(true);
      })
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setConclusionMessage("Unable to restore the latest conclusion."); });
    return () => controller.abort();
  }, [introductionDraft, selectedId]);

  useEffect(() => {
    if (!selectedId || conclusionDraft?.status !== "success" || conclusionDraft.evaluation?.task_response.status !== "clear" || conclusionDraft.evaluation.language.status !== "clear") return;
    const controller = new AbortController();
    void fetch(`/api/guided-writing/full-essay?sourceEssayId=${encodeURIComponent(selectedId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { context?: GuidedWritingFullEssayContext; review?: GuidedWritingFullEssayReviewView | null };
        if (!response.ok || !payload.context || !payload.review) return;
        setFullEssayContext(payload.context); setFullEssayReview(payload.review); setFullEssayStarted(true);
      })
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setFullEssayMessage("Unable to restore the latest full-essay check."); });
    return () => controller.abort();
  }, [conclusionDraft, selectedId]);

  useEffect(() => {
    if (!session || session.status !== "ready_to_draft") return;
    const controller = new AbortController();
    setExpressionRetrieval(null);
    setExpressionBusy(true);
    setExpressionMessage(null);
    void fetch("/api/guided-writing/expressions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, node: activeLanguageNode }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json() as { retrieval?: LearnedWritingRetrievalView; error?: unknown };
        if (!response.ok || !payload.retrieval) throw new Error(apiError(payload, "Unable to retrieve expressions from the corpus."));
        setExpressionRetrieval(payload.retrieval);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setExpressionMessage(error instanceof Error ? error.message : "Unable to retrieve expressions from the corpus.");
        }
      })
      .finally(() => setExpressionBusy(false));
    return () => controller.abort();
  }, [session?.id, session?.status, activeLanguageNode]);

  useEffect(() => {
    if (!session || session.status !== "ready_to_draft") return;
    const controller = new AbortController();
    void fetch(`/api/guided-writing/node-attempts?sessionId=${encodeURIComponent(session.id)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { attempts?: GuidedWritingNodeLanguageAttemptView[]; error?: unknown };
        if (!response.ok || !payload.attempts) throw new Error(apiError(payload, "Unable to restore node language work."));
        setNodeAttempts(payload.attempts);
        const restored = restoreNodeLanguageWork(payload.attempts);
        const plannedDrafts = Object.fromEntries(
          argumentNodeOrder
            .filter((node): node is WritingLanguageNode => node !== "stance")
            .map((node) => [node, session.graph[node]?.content ?? ""]),
        ) as Partial<Record<WritingLanguageNode, string>>;
        setNodeDrafts((current) => ({
          ...plannedDrafts,
          ...current,
          ...restored.drafts,
        }));
        setNodeHintLevels((current) => ({ ...current, ...restored.hintLevels }));
        setNodeAttemptMessages(restored.messages);
        if (restored.nextNode) {
          setActiveLanguageNode(restored.nextNode);
        } else if (restored.allNodesPassed) {
          const accepted = new Map<WritingLanguageNode, GuidedWritingNodeLanguageAttemptView>();
          for (const attempt of payload.attempts) {
            if (attempt.evaluation?.verdict === "pass") accepted.set(attempt.node, attempt);
          }
          const wovenStart = paragraphNodes.map((node) => accepted.get(node)?.learnerText ?? "").filter(Boolean).join(" ");
          setParagraphText((current) => current.trim() ? current : wovenStart);
          setDraftingStarted(true);
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setNodeAttemptRestoreMessage(error instanceof Error ? error.message : "Unable to restore node language work.");
        }
      });
    return () => controller.abort();
  }, [session?.id, session?.status]);

  function assetKey(asset: Pick<LearnedWritingAsset, "assetType" | "assetId">) {
    return `${asset.assetType}:${asset.assetId}`;
  }

  function assetLearningHref(asset: Pick<LearnedWritingAsset, "assetType" | "assetId">) {
    return asset.assetType === "sentence" ? `/library/${asset.assetId}` : `/library/collocations/${asset.assetId}`;
  }

  async function refreshNodeLanguageMatch() {
    if (!session || expressionBusy) return false;
    setExpressionBusy(true);
    setExpressionMessage(null);
    try {
      const response = await fetch("/api/guided-writing/expressions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          node: activeLanguageNode,
          learnerDraft: nodeDrafts[activeLanguageNode] ?? "",
        }),
      });
      const payload = await response.json() as { retrieval?: LearnedWritingRetrievalView; error?: unknown };
      if (!response.ok || !payload.retrieval) throw new Error(apiError(payload, "Unable to refresh this language match."));
      setExpressionRetrieval(payload.retrieval);
      return true;
    } catch (error) {
      setExpressionMessage(error instanceof Error ? error.message : "Unable to refresh this language match.");
      return false;
    } finally {
      setExpressionBusy(false);
    }
  }

  async function revealNextNodeHint() {
    if (!session || expressionBusy) return;
    const currentLevel = nodeHintLevels[activeLanguageNode] ?? 0;
    if (currentLevel === 0 && nodeDrafts[activeLanguageNode]?.trim()) {
      await refreshNodeLanguageMatch();
    }
    setNodeHintLevels((current) => ({ ...current, [activeLanguageNode]: Math.min(4, currentLevel + 1) }));
  }

  function compactTargetForm(asset: LearnedWritingAsset) {
    return asset.kind === "sentence_frame"
      ? asset.englishForm.replace(/\{[^}]+\}/gu, "…")
      : asset.englishForm;
  }

  function localSkeleton(asset: LearnedWritingAsset) {
    return asset.kind === "sentence_frame" ? asset.englishForm : `… ${asset.englishForm} …`;
  }

  function introductionPartDraft(part: IntroductionLanguagePart) {
    if (part === "task_framing") return introductionParts.taskFraming;
    return introductionParts[part];
  }

  async function revealNextIntroductionHint() {
    if (!selected || introductionExpressionBusy) return;
    const currentLevel = introductionHintLevels[activeIntroductionPart] ?? 0;
    const learnerDraft = introductionPartDraft(activeIntroductionPart).trim();
    if (currentLevel === 0 && learnerDraft) {
      setIntroductionExpressionBusy(true);
      setIntroductionExpressionMessage(null);
      try {
        const response = await fetch("/api/guided-writing/introduction-expressions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sourceEssayId: selected.sourceEssayId, part: activeIntroductionPart, learnerDraft }),
        });
        const payload = await response.json() as { retrieval?: IntroductionLanguageRetrievalView; error?: unknown };
        if (!response.ok || !payload.retrieval) throw new Error(apiError(payload, "Unable to refine this introduction match."));
        setIntroductionExpressionRetrieval(payload.retrieval);
      } catch (error) {
        setIntroductionExpressionMessage(error instanceof Error ? error.message : "Unable to refine this introduction match.");
      } finally {
        setIntroductionExpressionBusy(false);
      }
    }
    setIntroductionHintLevels((current) => ({
      ...current,
      [activeIntroductionPart]: Math.min(4, currentLevel + 1),
    }));
  }

  function resetParagraphWorkspace() {
    setAnswer("");
    setCoachMessage(null);
    setDismissedReuse(null);
    setParagraphDraft(null);
    setParagraphText("");
    setParagraphMessage(null);
    setExpressionRetrieval(null);
    setExpressionMessage(null);
    setActiveLanguageNode("claim");
    setNodeDrafts({});
    setNodeHintLevels({});
    setNodeAttempts([]);
    setNodeAttemptMessages({});
    setNodeAttemptRestoreMessage(null);
    setDraftingStarted(false);
    setIntroductionStarted(false);
    setIntroductionContext(null);
    setIntroductionDraft(null);
    setIntroductionParts({ opening: "", taskFraming: "", thesis: "" });
    setIntroductionMessage(null);
    setActiveIntroductionPart("opening");
    setIntroductionExpressionRetrieval(null);
    setIntroductionExpressionMessage(null);
    setIntroductionHintLevels({});
    setConclusionStarted(false);
    setConclusionContext(null);
    setConclusionDraft(null);
    setConclusionText("");
    setConclusionMessage(null);
    setFullEssayStarted(false);
    setFullEssayContext(null);
    setFullEssayReview(null);
    setFullEssayMessage(null);
  }

  async function startCoach() {
    if (!selected || !coachEnabled || coachBusy) return;
    if (session) {
      coachRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setCoachBusy(true);
    setCoachMessage(null);
    try {
      const response = await fetch("/api/guided-writing/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: crypto.randomUUID(), sourceEssayId: selected.sourceEssayId }),
      });
      const payload = await response.json() as { session?: GuidedWritingSessionView; error?: unknown };
      if (!response.ok || !payload.session) throw new Error(apiError(payload, "无法开始英文引导。"));
      setSession(payload.session);
      requestAnimationFrame(() => coachRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error) {
      setCoachMessage(error instanceof Error ? error.message : "无法开始英文引导。");
    } finally {
      setCoachBusy(false);
    }
  }

  async function startBodyTwo() {
    if (!selected || !session || session.paragraphKey !== "body_1" || coachBusy) return;
    setCoachBusy(true);
    setCoachMessage(null);
    try {
      const response = await fetch("/api/guided-writing/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: crypto.randomUUID(),
          sourceEssayId: selected.sourceEssayId,
          paragraphKey: "body_2",
          fromSessionId: session.id,
        }),
      });
      const payload = await response.json() as { session?: GuidedWritingSessionView; error?: unknown };
      if (!response.ok || !payload.session) throw new Error(apiError(payload, "无法开始第二主体段。"));
      resetParagraphWorkspace();
      setSession(payload.session);
      requestAnimationFrame(() => coachRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error) {
      setCoachMessage(error instanceof Error ? error.message : "无法开始第二主体段。");
    } finally {
      setCoachBusy(false);
    }
  }

  async function startIntroduction() {
    if (!selected || !session || session.paragraphKey !== "body_2" || introductionBusy) return;
    setIntroductionBusy(true);
    setIntroductionMessage(null);
    try {
      const response = await fetch(`/api/guided-writing/introductions?sourceEssayId=${encodeURIComponent(selected.sourceEssayId)}`);
      const payload = await response.json() as {
        context?: GuidedWritingIntroductionContext;
        draft?: GuidedWritingIntroductionDraftView | null;
        error?: unknown;
      };
      if (!response.ok || !payload.context) throw new Error(apiError(payload, "Unable to start the introduction."));
      setIntroductionContext(payload.context);
      setIntroductionDraft(payload.draft ?? null);
      if (payload.draft) setIntroductionParts(payload.draft.components);
      setIntroductionStarted(true);
      setActiveIntroductionPart("opening");
      requestAnimationFrame(() => document.querySelector(".introduction-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error) {
      setIntroductionMessage(error instanceof Error ? error.message : "Unable to start the introduction.");
    } finally {
      setIntroductionBusy(false);
    }
  }

  async function submitIntroduction(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || introductionBusy || !introductionParts.taskFraming.trim() || !introductionParts.thesis.trim()) return;
    const submittedParts = introductionParts;
    setIntroductionBusy(true);
    setIntroductionMessage(null);
    try {
      const response = await fetch("/api/guided-writing/introductions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceEssayId: selected.sourceEssayId, draftId: crypto.randomUUID(), components: submittedParts }),
      });
      const payload = await response.json() as {
        context?: GuidedWritingIntroductionContext;
        draft?: GuidedWritingIntroductionDraftView;
        message?: string | null;
        error?: unknown;
      };
      if (!response.ok || !payload.context || !payload.draft) throw new Error(apiError(payload, "Unable to check the introduction."));
      setIntroductionContext(payload.context);
      setIntroductionDraft(payload.draft);
      setIntroductionParts(payload.draft.components);
      setIntroductionMessage(payload.message ?? null);
    } catch (error) {
      setIntroductionParts(submittedParts);
      setIntroductionMessage(error instanceof Error ? error.message : "Unable to check the introduction.");
    } finally {
      setIntroductionBusy(false);
    }
  }

  async function startConclusion() {
    if (!selected || conclusionBusy) return;
    setConclusionBusy(true); setConclusionMessage(null);
    try {
      const response = await fetch(`/api/guided-writing/conclusions?sourceEssayId=${encodeURIComponent(selected.sourceEssayId)}`);
      const payload = await response.json() as { context?: GuidedWritingConclusionContext; draft?: GuidedWritingConclusionDraftView | null; error?: unknown };
      if (!response.ok || !payload.context) throw new Error(apiError(payload, "Unable to start the conclusion."));
      setConclusionContext(payload.context); setConclusionDraft(payload.draft ?? null); if (payload.draft) setConclusionText(payload.draft.conclusionText); setConclusionStarted(true);
      requestAnimationFrame(() => document.querySelector(".conclusion-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error) { setConclusionMessage(error instanceof Error ? error.message : "Unable to start the conclusion."); }
    finally { setConclusionBusy(false); }
  }

  async function submitConclusion(event: React.FormEvent) {
    event.preventDefault(); if (!selected || conclusionBusy || !conclusionText.trim()) return;
    const submitted = conclusionText; setConclusionBusy(true); setConclusionMessage(null);
    try {
      const response = await fetch("/api/guided-writing/conclusions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceEssayId: selected.sourceEssayId, draftId: crypto.randomUUID(), conclusionText: submitted }) });
      const payload = await response.json() as { context?: GuidedWritingConclusionContext; draft?: GuidedWritingConclusionDraftView; message?: string | null; error?: unknown };
      if (!response.ok || !payload.context || !payload.draft) throw new Error(apiError(payload, "Unable to check the conclusion."));
      setConclusionContext(payload.context); setConclusionDraft(payload.draft); setConclusionText(payload.draft.conclusionText); setConclusionMessage(payload.message ?? null);
    } catch (error) { setConclusionText(submitted); setConclusionMessage(error instanceof Error ? error.message : "Unable to check the conclusion."); }
    finally { setConclusionBusy(false); }
  }

  async function startFullEssay() {
    if (!selected || fullEssayBusy) return;
    setFullEssayBusy(true); setFullEssayMessage(null);
    try {
      const response = await fetch(`/api/guided-writing/full-essay?sourceEssayId=${encodeURIComponent(selected.sourceEssayId)}`);
      const payload = await response.json() as { context?: GuidedWritingFullEssayContext; review?: GuidedWritingFullEssayReviewView | null; error?: unknown };
      if (!response.ok || !payload.context) throw new Error(apiError(payload, "Unable to assemble the full essay."));
      setFullEssayContext(payload.context); setFullEssayReview(payload.review ?? null); setFullEssayStarted(true);
      requestAnimationFrame(() => document.querySelector(".full-essay-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (error) { setFullEssayMessage(error instanceof Error ? error.message : "Unable to assemble the full essay."); }
    finally { setFullEssayBusy(false); }
  }

  async function submitFullEssayCheck() {
    if (!selected || fullEssayBusy) return;
    setFullEssayBusy(true); setFullEssayMessage(null);
    try {
      const response = await fetch("/api/guided-writing/full-essay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceEssayId: selected.sourceEssayId, reviewId: crypto.randomUUID() }) });
      const payload = await response.json() as { context?: GuidedWritingFullEssayContext; review?: GuidedWritingFullEssayReviewView; message?: string | null; error?: unknown };
      if (!response.ok || !payload.context || !payload.review) throw new Error(apiError(payload, "Unable to check the full essay."));
      setFullEssayContext(payload.context); setFullEssayReview(payload.review); setFullEssayMessage(payload.message ?? null);
    } catch (error) { setFullEssayMessage(error instanceof Error ? error.message : "Unable to check the full essay."); }
    finally { setFullEssayBusy(false); }
  }

  async function reviseNode(node: ArgumentNodeKey) {
    if (!session || !session.graph[node] || coachBusy) return;
    const activeSavedNodeIndex = session.currentNode && session.graph[session.currentNode]
      ? argumentNodeOrder.indexOf(session.currentNode)
      : -1;
    if (activeSavedNodeIndex >= 0 && argumentNodeOrder.indexOf(node) > activeSavedNodeIndex) {
      setCoachMessage("Finish rechecking the earlier step before moving further down the argument.");
      return;
    }
    if (answer.trim() && session.currentNode !== node) {
      setCoachMessage("Please submit or clear the current draft before editing an earlier step.");
      answerRef.current?.focus();
      return;
    }
    setCoachBusy(true);
    setCoachMessage(null);
    try {
      const response = await fetch("/api/guided-writing/sessions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reopen_node", sessionId: session.id, node }),
      });
      const payload = await response.json() as { session?: GuidedWritingSessionView; error?: unknown };
      if (!response.ok || !payload.session) throw new Error(apiError(payload, "Unable to reopen this step."));
      setSession(payload.session);
      setAnswer(payload.session.graph[node]?.content ?? "");
      setDismissedReuse(null);
      setCoachMessage(`Editing ${nodeLabels[node]}. Saved later steps will be checked again in order.`);
      requestAnimationFrame(() => answerRef.current?.focus());
    } catch (error) {
      setCoachMessage(error instanceof Error ? error.message : "Unable to reopen this step.");
    } finally {
      setCoachBusy(false);
    }
  }

  async function cancelUnchangedRevision() {
    if (!session || coachBusy) return;
    setCoachBusy(true);
    setCoachMessage(null);
    try {
      const response = await fetch("/api/guided-writing/sessions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "cancel_unchanged_revision", sessionId: session.id }),
      });
      const payload = await response.json() as { session?: GuidedWritingSessionView; error?: unknown };
      if (!response.ok || !payload.session) throw new Error(apiError(payload, "Unable to return to language activation."));
      setSession(payload.session);
      setAnswer("");
      setDismissedReuse(null);
      setCoachMessage("Saved argument kept. You can continue with node language activation.");
    } catch (error) {
      setCoachMessage(error instanceof Error ? error.message : "Unable to return to language activation.");
    } finally {
      setCoachBusy(false);
    }
  }

  async function checkCoachAnswer(submittedAnswer: string) {
    if (!session || !submittedAnswer.trim() || coachBusy) return;
    setCoachBusy(true);
    setCoachMessage(null);
    try {
      const response = await fetch("/api/guided-writing/turns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, turnId: crypto.randomUUID(), learnerAnswer: submittedAnswer }),
      });
      const payload = await response.json() as {
        session?: GuidedWritingSessionView;
        status?: "evaluated" | "fallback" | "pending";
        message?: string | null;
        error?: unknown;
      };
      if (!response.ok || !payload.session) throw new Error(apiError(payload, "Unable to check this idea."));
      setSession(payload.session);
      const latest = payload.session.turns.at(-1);
      setAnswer(latest?.evaluation?.verdict === "accept" ? "" : submittedAnswer);
      setCoachMessage(
        latest?.evaluation && !isGuidedWritingEvaluationActionable(latest.node, latest.evaluation)
          ? "上一条 AI 反馈与当前步骤不匹配，已忽略。原回答已保留，可直接重新检查。"
          : payload.message ?? null,
      );
    } catch (error) {
      setAnswer(submittedAnswer);
      setCoachMessage(error instanceof Error ? error.message : "Unable to check this idea.");
    } finally {
      setCoachBusy(false);
    }
  }

  async function submitCoachAnswer(event: React.FormEvent) {
    event.preventDefault();
    await checkCoachAnswer(answer);
  }

  async function submitParagraph(event: React.FormEvent) {
    event.preventDefault();
    if (!session || session.status !== "ready_to_draft" || !paragraphText.trim() || paragraphBusy) return;
    const submittedText = paragraphText;
    setParagraphBusy(true);
    setParagraphMessage(null);
    try {
      const response = await fetch("/api/guided-writing/drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, draftId: crypto.randomUUID(), draftText: submittedText }),
      });
      const payload = await response.json() as {
        draft?: GuidedWritingParagraphDraftView;
        message?: string | null;
        error?: unknown;
      };
      if (!response.ok || !payload.draft) throw new Error(apiError(payload, "Unable to check this paragraph."));
      setParagraphDraft(payload.draft);
      setParagraphText(payload.draft.draftText);
      setParagraphMessage(payload.message ?? null);
    } catch (error) {
      setParagraphText(submittedText);
      setParagraphMessage(error instanceof Error ? error.message : "Unable to check this paragraph.");
    } finally {
      setParagraphBusy(false);
    }
  }

  async function submitNodeLanguage() {
    if (!session || session.status !== "ready_to_draft" || nodeAttemptBusy) return;
    const submittedNode = activeLanguageNode;
    const learnerText = nodeDrafts[submittedNode]?.trim() ?? "";
    if (!learnerText) {
      setNodeAttemptMessages((current) => ({ ...current, [submittedNode]: "Write this node before checking it." }));
      return;
    }
    const hintedAsset = activeHintLevel > 0 ? activeLanguageAsset : null;
    setNodeAttemptBusy(true);
    setNodeAttemptMessages((current) => {
      const next = { ...current };
      delete next[submittedNode];
      return next;
    });
    try {
      const response = await fetch("/api/guided-writing/node-attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          attemptId: crypto.randomUUID(),
          node: submittedNode,
          learnerText,
          assetType: hintedAsset?.assetType ?? null,
          assetId: hintedAsset?.assetId ?? null,
          hintLevel: activeHintLevel,
        }),
      });
      const payload = await response.json() as {
        attempt?: GuidedWritingNodeLanguageAttemptView;
        message?: string | null;
        error?: unknown;
      };
      if (!response.ok || !payload.attempt) throw new Error(apiError(payload, "Unable to check this node."));
      const nextAttempts = [...nodeAttempts.filter((attempt) => attempt.id !== payload.attempt!.id), payload.attempt];
      setNodeAttempts(nextAttempts);
      setNodeDrafts((current) => ({ ...current, [submittedNode]: payload.attempt!.learnerText }));
      setNodeAttemptMessages((current) => {
        const next = { ...current };
        if (payload.message) next[submittedNode] = payload.message;
        else delete next[submittedNode];
        return next;
      });
      if (payload.attempt.evaluation?.verdict === "pass") {
        const accepted = new Map<WritingLanguageNode, GuidedWritingNodeLanguageAttemptView>();
        for (const attempt of nextAttempts) if (attempt.evaluation?.verdict === "pass") accepted.set(attempt.node, attempt);
        const nextNode = paragraphNodes.find((node) => !accepted.has(node));
        if (nextNode) {
          setActiveLanguageNode(nextNode);
        } else {
          const wovenStart = paragraphNodes.map((node) => accepted.get(node)?.learnerText ?? "").filter(Boolean).join(" ");
          setParagraphText((current) => current.trim() ? current : wovenStart);
          setDraftingStarted(true);
        }
      }
    } catch (error) {
      setNodeAttemptMessages((current) => ({
        ...current,
        [submittedNode]: error instanceof Error ? error.message : "Unable to check this node.",
      }));
    } finally {
      setNodeAttemptBusy(false);
    }
  }
  if (!selected) return <section className="writing-empty">目前没有可用于写作训练的 IELTS 题目。</section>;

  const latestTurn = session?.turns.at(-1);
  const canCancelUnchangedRevision = session?.status === "building_argument"
    && Boolean(session.currentNode && session.graph[session.currentNode])
    && latestTurn?.action?.chainReview?.verdict === "ready";
  const actionableEvaluation = latestTurn?.evaluation
    && isGuidedWritingEvaluationActionable(latestTurn.node, latestTurn.evaluation)
    ? latestTurn.evaluation
    : null;
  const chainReview = session?.chainReview ?? null;
  const returnedNodeIndex = chainReview?.verdict === "return_to_node" && chainReview.return_to_node
    ? argumentNodeOrder.indexOf(chainReview.return_to_node)
    : -1;
  const revisionNodeIndex = session?.currentNode && session.graph[session.currentNode]
    ? argumentNodeOrder.indexOf(session.currentNode)
    : -1;
  const activeRevisionIndex = revisionNodeIndex >= 0 ? revisionNodeIndex : returnedNodeIndex;
  const currentGuidance = session?.currentNode
    ? guidanceForNode(session.currentNode, {
        questionType: selected.questionType,
        paragraphKey: session.paragraphKey,
        developmentRelation: session.developmentRelation,
      })
    : null;
  const storedReason = session?.graph.reason;
  const storedReasonTurn = storedReason
    ? session?.turns.find((turn) => turn.id === storedReason.turnId)
    : null;
  const legacyReasonSentences = storedReason?.content
    .split(/(?<=[.!?])\s+/u)
    .map((part) => part.trim())
    .filter(Boolean) ?? [];
  const legacyReuseSuggestion = session?.currentNode === "mechanism"
    && storedReason
    && storedReasonTurn?.evaluation
    && !("accepted_span" in storedReasonTurn.evaluation)
    && legacyReasonSentences.length > 1
    ? {
        sourceTurnId: `${storedReason.turnId}:legacy-forward`,
        targetNode: "mechanism" as const,
        text: legacyReasonSentences.at(-1)!,
      }
    : null;
  const availableReuseSuggestion = session?.reuseSuggestion ?? legacyReuseSuggestion;
  const reuseSuggestion = availableReuseSuggestion
    && dismissedReuse !== availableReuseSuggestion.sourceTurnId
    ? availableReuseSuggestion
    : null;
  const paragraphNodes = argumentNodeOrder.filter((node): node is WritingLanguageNode => node !== "stance");
  const paragraphWordCount = paragraphText.trim() ? paragraphText.trim().split(/\s+/u).length : 0;
  const paragraphEvaluation = paragraphDraft?.evaluation ?? null;
  const paragraphAction = paragraphEvaluation ? paragraphNextAction(paragraphEvaluation) : null;
  const currentParagraphNumber = session?.paragraphKey === "body_2" ? 2 : 1;
  const currentParagraphPlan = selected.outline.find((item) => item.key === session?.paragraphKey);
  const bodyTwoPlan = selected.outline.find((item) => item.key === "body_2");
  const paragraphEvaluationStale = Boolean(
    paragraphDraft
    && (
      paragraphText.trim() !== paragraphDraft.draftText
      || new Date(paragraphDraft.createdAt).getTime() < new Date(session?.updatedAt ?? 0).getTime()
    ),
  );
  const introductionText = [introductionParts.opening, introductionParts.taskFraming, introductionParts.thesis]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  const introductionWordCount = introductionText ? introductionText.split(/\s+/u).length : 0;
  const introductionEvaluation = introductionDraft?.evaluation ?? null;
  const introductionAction = introductionEvaluation ? introductionNextAction(introductionEvaluation) : null;
  const introductionEvaluationStale = Boolean(
    introductionDraft
    && introductionText !== introductionDraft.draftText,
  );
  const conclusionEvaluation = conclusionDraft?.evaluation ?? null;
  const conclusionAction = conclusionEvaluation ? conclusionNextAction(conclusionEvaluation) : null;
  const conclusionEvaluationStale = Boolean(conclusionDraft && conclusionText.trim() !== conclusionDraft.conclusionText);
  const conclusionWordCount = conclusionText.trim() ? conclusionText.trim().split(/\s+/u).length : 0;
  const fullEssayEvaluation = fullEssayReview?.evaluation ?? null;
  const fullEssayAction = fullEssayEvaluation ? fullEssayNextAction(fullEssayEvaluation) : null;
  const fullEssayWordCount = fullEssayContext?.essayText.trim() ? fullEssayContext.essayText.trim().split(/\s+/u).length : 0;
  const activeLanguageAsset = expressionRetrieval?.primaryAsset ?? null;
  const activeHintLevel = nodeHintLevels[activeLanguageNode] ?? 0;
  const expressionRetrievalStale = Boolean(
    expressionRetrieval
    && (nodeDrafts[activeLanguageNode]?.trim() ?? "") !== expressionRetrieval.draftTextConsidered.trim(),
  );
  const activeIntroductionAsset = introductionExpressionRetrieval?.primaryAsset ?? null;
  const activeIntroductionHintLevel = introductionHintLevels[activeIntroductionPart] ?? 0;
  const latestNodeAttempt = [...nodeAttempts].reverse().find((attempt) => attempt.node === activeLanguageNode) ?? null;
  const acceptedNodeAttempts = new Map<WritingLanguageNode, GuidedWritingNodeLanguageAttemptView>();
  for (const attempt of nodeAttempts) {
    if (attempt.evaluation?.verdict === "pass") acceptedNodeAttempts.set(attempt.node, attempt);
  }

  return (
    <>
      <section id="task2-prompt-import" className={`task2-prompt-import ${promptImportOpen ? "open" : ""}`} aria-label="导入新的 IELTS Task 2 题目">
        <header>
          <div className="task2-prompt-import-icon"><Plus size={19} aria-hidden="true" /></div>
          <div>
            <small>YOUR OWN IELTS TASK 2 PROMPT</small>
            <strong>拿一道新题，进入同一套学写作流程</strong>
          </div>
          <button type="button" className="task2-prompt-import-toggle" onClick={() => { setPromptImportOpen((current) => !current); if (promptImportOpen) resetPromptImport(); }}>
            {promptImportOpen ? <><X size={15} aria-hidden="true" /> 收起</> : <><Plus size={15} aria-hidden="true" /> 导入新题</>}
          </button>
        </header>
        {promptImportOpen ? (
          <div className="task2-prompt-import-body">
            <label className="task2-prompt-textarea">
              <span>IELTS Writing Task 2 题目</span>
              <textarea
                value={importedPromptText}
                onChange={(event) => { setImportedPromptText(event.target.value); setPromptAnalysis(null); setConfirmedQuestionType(""); setConfirmedTopic(""); setPromptImportMessage(null); }}
                disabled={promptImportBusy}
                placeholder="Paste the complete English Task 2 prompt, including its final instruction."
              />
              <small>{importedPromptText.trim().length} / 2,000 characters</small>
            </label>
            {!promptAnalysis ? (
              <div className="task2-prompt-import-action">
                <p>不会从题目中生成观点或范文，只判断它要求你完成什么。</p>
                <button type="button" onClick={() => void analyzeNewPrompt()} disabled={promptImportBusy || importedPromptText.trim().length < 30 || importedPromptText.length > 2_000}>
                  {promptImportBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
                  识别这道题
                </button>
              </div>
            ) : (
              <section className="task2-prompt-confirmation" aria-label="确认题型">
                <header>
                  <strong>{promptAnalysis.analysis?.is_task_2 ? "看起来是 IELTS Task 2" : "没有可靠识别为 Task 2"}</strong>
                  <span className={promptAnalysis.analysis?.needs_review || !promptAnalysis.analysis ? "review" : "clear"}>{promptAnalysis.analysis?.needs_review || !promptAnalysis.analysis ? "请重点核对" : "等待你确认"}</span>
                </header>
                {promptAnalysis.analysis?.reason_zh ? <p>{promptAnalysis.analysis.reason_zh}</p> : <p>AI 暂时不可用，但题目已经保留。请手动选择题型和主题。</p>}
                <div className="task2-prompt-confirm-fields">
                  <label><span>这道题真正要求的题型</span><select value={confirmedQuestionType} onChange={(event) => setConfirmedQuestionType(event.target.value as EssayQuestionType)}><option value="">请选择</option>{task2QuestionTypes.map((type) => <option value={type} key={type}>{task2QuestionTypeLabels[type]}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></label>
                  <label><span>大致主题（用于检索语料）</span><select value={confirmedTopic} onChange={(event) => setConfirmedTopic(event.target.value as Task2Topic)}><option value="">请选择</option>{task2Topics.map((topic) => <option value={topic} key={topic}>{topicLabels[topic] ?? topic}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></label>
                </div>
                <footer>
                  <button type="button" className="secondary" onClick={() => { setPromptAnalysis(null); setConfirmedQuestionType(""); setConfirmedTopic(""); }}>修改题目</button>
                  <button type="button" onClick={() => void confirmNewPrompt()} disabled={promptImportBusy || !confirmedQuestionType || !confirmedTopic}>
                    {promptImportBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                    确认并建立文章地图
                  </button>
                </footer>
              </section>
            )}
            {promptImportMessage ? <p className="task2-prompt-import-message" role="status">{promptImportMessage}</p> : null}
          </div>
        ) : null}
      </section>

      <nav className="writing-stagebar" aria-label="Guided Writing 阶段">
        <span className="active"><b>01</b> 审题</span>
        <i />
        <span className="ready"><b>02</b> 文章地图</span>
        <i />
        <span className={session ? session.status === "ready_to_draft" ? "ready" : "active" : ""}><b>03</b> 英文构思 {!session ? <Lock size={12} aria-hidden="true" /> : null}</span>
        <i />
        <span className={session?.status === "ready_to_draft" ? draftingStarted ? "ready" : "active" : ""}><b>04</b> 逐节点表达 {session?.status !== "ready_to_draft" ? <Lock size={12} aria-hidden="true" /> : null}</span>
        <i />
        <span className={draftingStarted ? "active" : ""}><b>05</b> 段落编织 {!draftingStarted ? <Lock size={12} aria-hidden="true" /> : null}</span>
        <i />
        <span className={introductionStarted ? "active" : ""}><b>06</b> 开头 {!introductionStarted ? <Lock size={12} aria-hidden="true" /> : null}</span>
        <i />
        <span className={conclusionStarted ? "active" : ""}><b>07</b> 结论 {!conclusionStarted ? <Lock size={12} aria-hidden="true" /> : null}</span>
        <i />
        <span className={fullEssayStarted ? "active" : ""}><b>08</b> 全文 {!fullEssayStarted ? <Lock size={12} aria-hidden="true" /> : null}</span>
      </nav>

      <section className="writing-workbench">
        <article className="writing-prompt-paper">
          <header className="writing-prompt-toolbar">
            <div>
              <span><BookOpen size={16} aria-hidden="true" /> 练习题目</span>
              <small>{availablePrompts.length} 道 Task 2 练习题</small>
            </div>
            <div className="writing-prompt-toolbar-controls">
              <label>
                <span className="sr-only">选择写作题目</span>
                <select value={selected.sourceEssayId} onChange={(event) => selectEssay(event.target.value)}>
                  {availablePrompts.map((item) => <option value={item.sourceEssayId} key={item.sourceEssayId}>{item.title}</option>)}
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </label>
              <button
                type="button"
                className="writing-import-prompt-button"
                aria-controls="task2-prompt-import"
                onClick={() => {
                  setPromptImportOpen(true);
                  window.setTimeout(() => document.getElementById("task2-prompt-import")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                }}
              >
                <Plus size={15} aria-hidden="true" /> 导入新题
              </button>
            </div>
          </header>

          <div className="writing-prompt-copy">
            <div className="writing-prompt-meta">
              <span>{selected.questionTypeLabel}</span>
              {selected.topics.map((topic) => <small key={topic}>{topicLabels[topic] ?? topic}</small>)}
            </div>
            <blockquote>{selected.prompt}</blockquote>
            <div className="writing-instructions">
              <span>题目指令</span>
              {selected.instructionText.map((instruction) => <p key={instruction}>{instruction}</p>)}
            </div>
          </div>

          <section className="writing-task-checklist">
            <header>
              <span><Compass size={18} aria-hidden="true" /></span>
              <div>
                <h2>这篇文章必须完成什么</h2>
              </div>
            </header>
            <ol>
              {selected.requiredParts.map((part, index) => (
                <li key={part}><span>{String(index + 1).padStart(2, "0")}</span><p>{part}</p><Check size={15} aria-hidden="true" /></li>
              ))}
            </ol>
            <div className="writing-scope-row">
              <span>审题边界</span>
              {selected.scopeMarkers.length
                ? selected.scopeMarkers.map((marker) => <code key={marker}>{marker}</code>)
                : <small>没有额外的绝对化或比较限定词</small>}
            </div>
          </section>
        </article>

        <aside className="essay-map-panel">
          <header>
            <div>
              <h2>{selected.argumentMap.title}</h2>
            </div>
            <FileText size={22} aria-hidden="true" />
          </header>
          <section className={`essay-argument-map ${selected.argumentMap.kind}`} aria-label="题型论证关系">
            <small>论证关系</small>
            <strong>{selected.argumentMap.relation}</strong>
            <div>
              {selected.argumentMap.nodes.map((node, index) => (
                <span key={node}>
                  <b>{node}</b>
                  {index < selected.argumentMap.nodes.length - 1 ? <i aria-hidden="true">→</i> : null}
                </span>
              ))}
            </div>
            <p>{selected.argumentMap.structureNote}</p>
          </section>
          <div className="essay-outline-label"><span>推荐起始结构</span><small>不是固定模板</small></div>
          <ol className="essay-map-list">
            {selected.outline.map((paragraph, index) => (
              <li className={paragraph.key.startsWith("body") ? "body" : ""} key={paragraph.key}>
                <span className="essay-map-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <header><small>{paragraph.label}</small><strong>{paragraph.role}</strong></header>
                  <p>{paragraph.goal}</p>
                  <div><Circle size={8} fill="currentColor" aria-hidden="true" /><span>{paragraph.coachQuestion}</span></div>
                </div>
              </li>
            ))}
          </ol>
          <footer>
            <span><PenLine size={16} aria-hidden="true" /></span>
            <p><strong>{session?.paragraphKey === "body_2" ? "继续完成主体段二" : "下一步从主体段一开始"}</strong></p>
            {coachEnabled ? (
              <button type="button" onClick={startCoach} disabled={coachBusy}>
                {coachBusy ? <Loader2 className="spin" size={15} aria-hidden="true" /> : null}
                {session ? "Continue" : "Start in English"}
                {!coachBusy ? <ArrowRight size={14} aria-hidden="true" /> : null}
              </button>
            ) : <small className="coach-disabled">Agent 功能当前关闭</small>}
          </footer>
        </aside>
      </section>

      {coachMessage && !session ? <p className="coach-page-message" role="status">{coachMessage}</p> : null}
      {session ? (
        <section className="writing-coach" ref={coachRef}>
          <header className="writing-coach-header">
            <div>
              <h2>{session.status === "ready_to_draft"
                ? draftingStarted ? "Weave your four ideas into one paragraph" : "Activate language for one argument node"
                : "Build the argument before drafting"}</h2>
            </div>
            <span className="deepseek-model-badge">DeepSeek Agent</span>
          </header>

          <div className="writing-coach-grid">
            <aside className="argument-chain-panel" aria-label="Argument chain progress">
              <small>ESSAY POSITION</small>
              <div className={`essay-position-step ${session.currentNode === "stance" ? "current" : session.graph.stance ? "done" : ""}`}>
                <span>Context</span>
                <div>
                  <strong>Overall position</strong>
                  {session.graph.stance
                    ? <p>{session.graph.stance.content}</p>
                    : <small>{session.currentNode === "stance" ? "Current step" : "Not reached"}</small>}
                </div>
                {session.graph.stance && session.currentNode !== "stance" ? (
                  <button className="argument-revise-button" type="button" onClick={() => void reviseNode("stance")} disabled={coachBusy} aria-label="Edit overall position; later argument steps will be rechecked" title="修改构思内容；后续节点需要重新检查">
                    <PenLine size={15} aria-hidden="true" />
                    <span>改构思</span>
                  </button>
                ) : null}
              </div>
              <small className="paragraph-chain-label">BODY PARAGRAPH {currentParagraphNumber}</small>
              {currentParagraphPlan ? (
                <div className="paragraph-role-note">
                  <small>THIS PARAGRAPH'S JOB</small>
                  <strong>{currentParagraphPlan.role}</strong>
                  <p>{currentParagraphPlan.goal}</p>
                </div>
              ) : null}
              <ol>
                {paragraphNodes.map((node, index) => {
                  const saved = session.graph[node];
                  const current = session.currentNode === node;
                  const absoluteIndex = argumentNodeOrder.indexOf(node);
                  const pendingRecheck = activeRevisionIndex >= 0 && absoluteIndex >= activeRevisionIndex;
                  return (
                    <li className={[
                      current ? "current" : pendingRecheck ? "review-pending" : saved ? "done" : "",
                      session.status === "ready_to_draft" && node === activeLanguageNode ? "language-active" : "",
                    ].filter(Boolean).join(" ")} key={node}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div
                        className={session.status === "ready_to_draft" ? "language-node-selector" : ""}
                        role={session.status === "ready_to_draft" ? "button" : undefined}
                        tabIndex={session.status === "ready_to_draft" ? 0 : undefined}
                        onClick={session.status === "ready_to_draft" ? () => {
                          setActiveLanguageNode(node);
                        } : undefined}
                        onKeyDown={session.status === "ready_to_draft" ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setActiveLanguageNode(node);
                          }
                        } : undefined}
                      >
                        <strong>{nodeLabels[node]}</strong>
                        {saved ? <p>{saved.content}</p> : <small>{current ? "Current step" : "Not reached"}</small>}
                        {current && saved ? <small>Revise this node</small> : null}
                        {!current && pendingRecheck && saved ? <small>Will be rechecked</small> : null}
                        {session.status === "ready_to_draft" && acceptedNodeAttempts.get(node) ? (
                          <div className="node-realization">
                            <small>LANGUAGE READY · HINT {acceptedNodeAttempts.get(node)!.hintLevel}</small>
                            <p>{acceptedNodeAttempts.get(node)!.learnerText}</p>
                          </div>
                        ) : null}
                        {session.status === "ready_to_draft" && saved && !acceptedNodeAttempts.get(node) ? <small>{node === activeLanguageNode ? "Language activation open" : "Choose this node"}</small> : null}
                      </div>
                      {saved && !current ? (
                        <button
                          className="argument-revise-button"
                          type="button"
                          onClick={() => void reviseNode(node)}
                          disabled={coachBusy || (activeRevisionIndex >= 0 && absoluteIndex > activeRevisionIndex)}
                          aria-label={`Edit ${nodeLabels[node]}; later argument steps will be rechecked`}
                          title="修改构思内容；后续节点需要重新检查"
                        >
                          <PenLine size={15} aria-hidden="true" />
                          <span>改构思</span>
                        </button>
                      ) : saved && !pendingRecheck ? <Check size={15} aria-hidden="true" /> : null}
                    </li>
                  );
                })}
              </ol>
            </aside>

            <div className="coach-question-panel">
              {canCancelUnchangedRevision ? (
                <aside className="argument-revision-exit" aria-label="Return to language activation">
                  <div>
                    <strong>你现在进入的是“回改构思”，不是重新练语言。</strong>
                    <p>原来的四个节点没有改变。如果刚才只是点错了，可以直接保留它们并返回逐节点表达。</p>
                  </div>
                  <button type="button" onClick={() => void cancelUnchangedRevision()} disabled={coachBusy}>
                    {coachBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
                    保留原论证并返回
                  </button>
                </aside>
              ) : null}
              {chainReview?.verdict === "return_to_node" ? (
                <div className="coach-feedback retry">
                  <header>
                    <span>Full argument review{latestTurn?.model ? <> · <span className="deepseek-model">{modelDisplayName(latestTurn.model)}</span></> : null}</span>
                    <strong>Revisit {chainReview.return_to_node ? nodeLabels[chainReview.return_to_node] : "argument"}</strong>
                  </header>
                  <p>{chainReview.feedback_en}</p>
                </div>
              ) : actionableEvaluation ? (
                <div className={`coach-feedback ${actionableEvaluation.verdict}`}>
                  <header>
                    <span>Agent feedback{latestTurn?.model ? <> · <span className="deepseek-model">{modelDisplayName(latestTurn.model)}</span></> : null}</span>
                    <strong>{actionableEvaluation.verdict === "accept"
                      ? availableReuseSuggestion ? "Clear · later step found" : "Clear and ready"
                      : "Think again"}</strong>
                  </header>
                  <p>{actionableEvaluation.feedback_en}</p>
                </div>
              ) : null}
              {coachMessage ? <p className="coach-inline-message" role="status">{coachMessage}</p> : null}

              {reuseSuggestion ? (
                <aside className="coach-reuse-panel" aria-label="Reuse your earlier wording">
                  <small>YOU MAY ALREADY HAVE THIS</small>
                  <h3>Your earlier answer contains a possible {nodeLabels[reuseSuggestion.targetNode]}.</h3>
                  <blockquote>{reuseSuggestion.text}</blockquote>
                  <p>This is your exact wording. Nothing has been rewritten or saved into the next step yet.</p>
                  <div>
                    <button type="button" disabled={coachBusy} onClick={() => {
                      setDismissedReuse(reuseSuggestion.sourceTurnId);
                      void checkCoachAnswer(reuseSuggestion.text);
                    }}>Use this part</button>
                    <button type="button" disabled={coachBusy} onClick={() => {
                      setAnswer(reuseSuggestion.text);
                      setDismissedReuse(reuseSuggestion.sourceTurnId);
                      requestAnimationFrame(() => answerRef.current?.focus());
                    }}>Edit it first</button>
                    <button type="button" disabled={coachBusy} onClick={() => {
                      setAnswer("");
                      setDismissedReuse(reuseSuggestion.sourceTurnId);
                      requestAnimationFrame(() => answerRef.current?.focus());
                    }}>Answer separately</button>
                  </div>
                </aside>
              ) : null}

              {session.status === "ready_to_draft" ? (
                <div className="paragraph-draft-workspace">
                  <div className="paragraph-draft-ready corpus-ready">
                    <span><Check size={18} aria-hidden="true" /></span>
                    <div>
                      <small>ARGUMENT COMPLETE</small>
                      <strong>{draftingStarted ? "Now weave your completed language into a paragraph." : "Activate the language for one argument node at a time."}</strong>
                      <p>{draftingStarted
                        ? "Keep the learner-owned reasoning. Check repetition, progression, merging and connections."
                        : "Choose a node on the left. Try your own English first; reveal corpus help only when you need it."}</p>
                    </div>
                  </div>

                  {!draftingStarted ? <section className="node-language-workspace" aria-label="Language activation for one argument node">
                    <header>
                      <div>
                        <small>CURRENT NODE · {nodeLabels[activeLanguageNode].toUpperCase()}</small>
                        <h3>{expressionRetrieval?.nodeContent ?? session.graph[activeLanguageNode]?.content}</h3>
                        <p>{expressionRetrieval?.nodeNeed.purposeZh ?? "只处理当前节点，不同时改写整段。"}</p>
                      </div>
                      {expressionRetrieval ? (
                        <span>节点 {paragraphNodes.indexOf(activeLanguageNode) + 1} / {paragraphNodes.length}</span>
                      ) : null}
                    </header>

                    <div className="node-independent-attempt">
                      <h4>把这句话整理成可以直接进入段落的表达</h4>
                      <p>你刚才写的原句已经带入。可以直接沿用，也可以结合下面的点评和语料修改；不必重新写一遍。</p>
                      <label>
                        <span className="sr-only">Language draft for {nodeLabels[activeLanguageNode]}</span>
                        <textarea
                          value={nodeDrafts[activeLanguageNode] ?? ""}
                          onChange={(event) => setNodeDrafts((current) => ({ ...current, [activeLanguageNode]: event.target.value }))}
                          placeholder="Your saved argument will appear here."
                          maxLength={1200}
                        />
                      </label>
                    </div>

                    {expressionBusy ? <p className="expression-loading"><Loader2 className="spin" size={17} aria-hidden="true" /> 正在为这个节点匹配语料…</p> : null}
                    {expressionMessage ? <p className="coach-inline-message" role="status">{expressionMessage}</p> : null}
                    {nodeAttemptRestoreMessage ? <p className="coach-inline-message" role="status">{nodeAttemptRestoreMessage}</p> : null}
                    {nodeAttemptMessages[activeLanguageNode] ? <p className="coach-inline-message" role="status">{nodeAttemptMessages[activeLanguageNode]}</p> : null}

                    {!expressionBusy && expressionRetrieval && !expressionRetrievalStale ? (
                      <aside className="node-wording-guidance">
                        <p>{expressionRetrieval.wordingObservationZh}</p>
                        <p><strong>可以继续优化：</strong>{expressionRetrieval.revisionDirectionZh}</p>
                        {expressionRetrieval.selection.mode === "deepseek" ? <small><span className="deepseek-model">DeepSeek</span> 根据当前节点原句给出的诊断，不是替换答案。</small> : null}
                      </aside>
                    ) : null}

                    {!expressionBusy && expressionRetrievalStale ? (
                      <aside className="node-wording-guidance stale">
                        <p>输入内容已经修改，上一条点评和语料匹配不再代表当前版本。</p>
                        <button type="button" onClick={() => void refreshNodeLanguageMatch()}>重新匹配当前版本</button>
                      </aside>
                    ) : null}

                    {latestNodeAttempt?.evaluation && latestNodeAttempt.learnerText === (nodeDrafts[activeLanguageNode]?.trim() ?? "") ? (
                      <section className={`node-language-feedback ${latestNodeAttempt.evaluation.verdict}`}>
                        <header>
                          <div>
                            <small>AGENT FEEDBACK{latestNodeAttempt.model ? <> · <span className="deepseek-model">{modelDisplayName(latestNodeAttempt.model)}</span></> : null}</small>
                            <h4>{latestNodeAttempt.evaluation.verdict === "pass" ? "This node is ready" : "Revise this node"}</h4>
                          </div>
                          <span>{latestNodeAttempt.evaluation.verdict === "pass" ? "ACCEPTED" : "TRY AGAIN"}</span>
                        </header>
                        <div>
                          <span><small>MEANING</small><strong>{latestNodeAttempt.evaluation.dimensions.meaning.replaceAll("_", " ")}</strong></span>
                          <span><small>LOGIC</small><strong>{latestNodeAttempt.evaluation.dimensions.logic.replaceAll("_", " ")}</strong></span>
                          <span><small>TARGET USAGE</small><strong>{latestNodeAttempt.evaluation.dimensions.target_usage.replaceAll("_", " ")}</strong></span>
                          <span><small>NATURALNESS</small><strong>{latestNodeAttempt.evaluation.dimensions.naturalness.replaceAll("_", " ")}</strong></span>
                        </div>
                        <p>{latestNodeAttempt.evaluation.feedback_en}</p>
                        {latestNodeAttempt.evaluation.errors.map((error, index) => (
                          <p className="node-language-error" key={`${error.dimension}:${index}`}>
                            <strong>{error.dimension.replaceAll("_", " ")}</strong>
                            {error.span ? <q>{error.span}</q> : null}
                            {error.message_en}
                          </p>
                        ))}
                        {latestNodeAttempt.evaluation.minimal_hint_en ? <aside>{latestNodeAttempt.evaluation.minimal_hint_en}</aside> : null}
                      </section>
                    ) : latestNodeAttempt?.evaluation ? (
                      <p className="paragraph-stale-note">This node changed after the last feedback. Check the current version again.</p>
                    ) : null}

                    {!expressionBusy && !expressionRetrievalStale && expressionRetrieval?.noSuitableAsset ? (
                      <aside className="node-no-fit">
                        <h4>{expressionRetrieval.supportingExpressions.length ? "没有合适的完整句型" : "当前没有真正适合的语料"}</h4>
                        <p>{expressionRetrieval.noSuitableReasonZh}</p>
                        {expressionRetrieval.selection.mode === "deepseek" ? <p className="deepseek-note">DeepSeek 已核对现有正式候选。</p> : null}
                        {expressionRetrieval.supportingExpressions.length ? (
                          <button type="button" onClick={() => setNodeHintLevels((current) => ({
                            ...current,
                            [activeLanguageNode]: Math.max(2, current[activeLanguageNode] ?? 0),
                          }))}>
                            查看可用的局部表达
                          </button>
                        ) : null}
                      </aside>
                    ) : null}

                    {!expressionBusy && !expressionRetrievalStale && activeLanguageAsset ? (
                      <section className="node-primary-asset" aria-label="Primary corpus match">
                        <header>
                          <div>
                            <small>PRIMARY MATCH · {activeLanguageAsset.transferUnit === "collocation" ? "COLLOCATION" : activeLanguageAsset.transferUnit === "sentence_frame" ? "SENTENCE FRAME" : "RHETORICAL MOVE"}</small>
                            <h4>推荐依据与迁移边界</h4>
                          </div>
                          <span>{activeLanguageAsset.learningStage === "new" ? "库内新语料" : activeLanguageAsset.learningStage === "use" ? "已进入 Use" : activeLanguageAsset.learningStage === "recall" ? "已进入 Recall" : "已学习"}</span>
                        </header>
                        <p>{activeLanguageAsset.recommendationReasonZh}</p>
                        {expressionRetrieval?.selection.mode === "deepseek" ? <small className="deepseek-note">DeepSeek 已从现有正式语料中核对</small> : null}
                        <p className="node-transfer-guidance">{activeLanguageAsset.transferGuidanceZh}</p>

                        {activeHintLevel >= 1 ? (
                          <div className="node-hint-step">
                            <small>HINT 1 · 中文方向</small>
                            <p>{activeLanguageAsset.cueZh}</p>
                          </div>
                        ) : null}
                        {activeHintLevel >= 2 ? (
                          <div className="node-hint-step target">
                            <small>HINT 2 · 目标表达</small>
                            <strong>{compactTargetForm(activeLanguageAsset)}</strong>
                          </div>
                        ) : null}
                        {activeHintLevel >= 3 ? (
                          <div className="node-hint-step skeleton">
                            <small>HINT 3 · 局部骨架</small>
                            <strong>{localSkeleton(activeLanguageAsset)}</strong>
                          </div>
                        ) : null}
                        {activeHintLevel >= 4 ? (
                          <div className="node-hint-step reference">
                            <small>HINT 4 · 来源参考</small>
                            <blockquote>{activeLanguageAsset.originalSentence ?? activeLanguageAsset.englishForm}</blockquote>
                            <p>只观察表达怎样工作，不要照搬来源内容。</p>
                          </div>
                        ) : null}

                        <footer>
                          <div>
                            <small>{activeHintLevel === 0
                              ? `来源：${activeLanguageAsset.sourceTitle} · 目标英文在提示 Level 2 展示`
                              : `已使用第 ${activeHintLevel} 级帮助`}</small>
                            <span>{activeLanguageAsset.sourceRelation === "same_prompt" ? "同题来源" : "跨主题迁移"}</span>
                            {activeHintLevel < 2 && expressionRetrieval?.supportingExpressions.length ? (
                              <span>另有 {expressionRetrieval.supportingExpressions.length} 个可搭配表达，将在 Hint 2 显示</span>
                            ) : null}
                          </div>
                          <button type="button" disabled={expressionBusy || activeHintLevel >= 4} onClick={() => void revealNextNodeHint()}>
                            {activeHintLevel === 0 ? "我卡住了，给一点提示" : activeHintLevel >= 4 ? "已显示完整参考" : "再给一点提示"}
                          </button>
                        </footer>
                        {activeLanguageAsset.learningStage === "new" && activeHintLevel >= 2 ? (
                          <a className="node-learning-link" href={assetLearningHref(activeLanguageAsset)} target="_blank" rel="noreferrer">打开正式学习卡</a>
                        ) : null}
                      </section>
                    ) : null}

                    {!expressionRetrievalStale && activeHintLevel >= 2 && expressionRetrieval?.supportingExpressions.length ? (
                      <section className="node-supporting-expressions" aria-label="Optional supporting collocations">
                        <header>
                          <div>
                            <h4>可搭配使用的表达</h4>
                          </div>
                          <span>{expressionRetrieval.supportingExpressions.length}</span>
                        </header>
                        <div>
                          {expressionRetrieval.supportingExpressions.map((asset) => (
                            <article key={assetKey(asset)}>
                              <header>
                                <small>{asset.learningStage === "new" ? "库内新语料" : asset.learningStage === "use" ? "已进入 Use" : "已学"}</small>
                                <span>{asset.sourceRelation === "same_prompt" ? "同题来源" : "跨主题"}</span>
                              </header>
                              <strong>{asset.englishForm}</strong>
                              <p>{asset.cueZh}</p>
                              {asset.learningStage === "new" ? (
                                <a className="supporting-learning-link" href={assetLearningHref(asset)} target="_blank" rel="noreferrer">进入学习卡</a>
                              ) : null}
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    <footer className="node-language-actions">
                      <p>提交后将分别检查 meaning、logic、target usage 和 naturalness，再把通过的语言实现写回左侧节点。</p>
                      <button type="button" disabled={nodeAttemptBusy || !(nodeDrafts[activeLanguageNode]?.trim())} onClick={() => void submitNodeLanguage()}>
                        {nodeAttemptBusy ? <Loader2 className="spin" size={15} aria-hidden="true" /> : null}
                        {nodeAttemptBusy ? "Checking…" : latestNodeAttempt ? "Check revised node" : "Check this node"}
                      </button>
                    </footer>
                  </section> : null}

                  {draftingStarted ? (
                    <section className="paragraph-weaving-workspace" aria-label="Paragraph Weaving">
                      <header>
                        <div>
                          <small>PARAGRAPH WEAVING</small>
                          <h3>把已经完成的语言实现编织成一个主体段</h3>
                          <p>下面的初稿只拼接你的节点表达。你负责调整、合并和衔接，Agent 不会重写整段。</p>
                        </div>
                        {acceptedNodeAttempts.size === paragraphNodes.length ? (
                          <button type="button" onClick={() => setDraftingStarted(false)}>返回节点</button>
                        ) : null}
                      </header>
                      <div className="paragraph-weaving-source">
                        {paragraphNodes.map((node, index) => (
                          <article key={node}>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <div>
                              <small>{nodeLabels[node].toUpperCase()}</small>
                              <p>{acceptedNodeAttempts.get(node)?.learnerText ?? session.graph[node]?.content}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                      <ul className="paragraph-weaving-checks">
                        <li><Check size={14} aria-hidden="true" /> 删除 Main point、Reason 与 Development 之间的重复</li>
                        <li><Check size={14} aria-hidden="true" /> 合并适合放在同一句里的分句，避免机械的四句模板</li>
                        <li><Check size={14} aria-hidden="true" /> 检查每一步是否真正推进，以及是否需要自然衔接</li>
                        <li><Check size={14} aria-hidden="true" /> 确认 Takeaway 是有限结论，不是重新抄写 Main point</li>
                      </ul>
                    </section>
                  ) : null}

                  {draftingStarted && paragraphEvaluation && !paragraphEvaluationStale ? (
                    <section className="paragraph-evaluation" aria-label="Paragraph feedback">
                      <header>
                        <small>AGENT FEEDBACK{paragraphDraft?.model ? <> · <span className="deepseek-model">{modelDisplayName(paragraphDraft.model)}</span></> : null}</small>
                        <strong>{paragraphAction === "KEEP_DRAFT" ? "CLEAR AND READY" : "REVISE THE DRAFT"}</strong>
                      </header>
                      <div>
                        <article className={paragraphEvaluation.logic.status === "clear" ? "clear" : "revise"}>
                          <small>LOGIC</small>
                          <h4>{paragraphEvaluation.logic.status === "clear" ? "The reasoning works" : "One logical priority"}</h4>
                          {paragraphEvaluation.logic.strength_en ? <p>{paragraphEvaluation.logic.strength_en}</p> : null}
                          <p className="priority">{paragraphEvaluation.logic.feedback_en}</p>
                          {paragraphEvaluation.logic.evidence_span ? <blockquote>{paragraphEvaluation.logic.evidence_span}</blockquote> : null}
                        </article>
                        <article className={paragraphEvaluation.language.status === "clear" ? "clear" : "revise"}>
                          <small>LANGUAGE</small>
                          <h4>{paragraphEvaluation.language.status === "clear"
                            ? "The language is usable"
                            : paragraphEvaluation.language.severity === "minor" ? "A local surface fix" : "One language priority"}</h4>
                          {paragraphEvaluation.language.strength_en ? <p>{paragraphEvaluation.language.strength_en}</p> : null}
                          <p className="priority">{paragraphEvaluation.language.feedback_en}</p>
                          {paragraphEvaluation.language.evidence_span ? <blockquote>{paragraphEvaluation.language.evidence_span}</blockquote> : null}
                        </article>
                      </div>
                    </section>
                  ) : draftingStarted && paragraphEvaluationStale ? (
                    <p className="paragraph-stale-note">The paragraph or argument chain changed after this feedback. Check it again before relying on the earlier evaluation.</p>
                  ) : null}

                  {draftingStarted ? (
                    <>
                      {paragraphMessage ? <p className="coach-inline-message" role="status">{paragraphMessage}</p> : null}
                      <form className="paragraph-draft-form" onSubmit={submitParagraph}>
                        <small>YOUR WOVEN BODY PARAGRAPH {currentParagraphNumber}</small>
                        <h3>调整你自己的句子：合并、推进、衔接、收束。</h3>
                        <label>
                          <span className="sr-only">Body Paragraph {currentParagraphNumber} draft</span>
                          <textarea
                            value={paragraphText}
                            onChange={(event) => setParagraphText(event.target.value)}
                            placeholder="Write the paragraph in your own English. Use a corpus expression only when it naturally serves your reasoning."
                            maxLength={5000}
                            disabled={paragraphBusy}
                          />
                        </label>
                        <footer>
                          <span>{paragraphWordCount} words · no fixed quota</span>
                          <button type="submit" disabled={paragraphBusy || !paragraphText.trim()}>
                            {paragraphBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
                            {paragraphBusy ? "Checking…" : paragraphDraft ? "Check revised paragraph" : "Check logic and language"}
                          </button>
                        </footer>
                      </form>
                      {paragraphAction === "KEEP_DRAFT" && !paragraphEvaluationStale && session.paragraphKey === "body_1" && bodyTwoPlan ? (
                        <section className="next-body-paragraph-card" aria-label="Continue to Body Paragraph 2">
                          <small>NEXT · BODY PARAGRAPH 2</small>
                          <h3>{bodyTwoPlan.role}</h3>
                          <p>{bodyTwoPlan.goal}</p>
                          {selected.questionType === "opinion" ? (
                            <aside>
                              第二段不固定成“反方段”。你可以选择第二个支持理由、必要限定，或简短让步；Agent 会检查它是否和总体立场一致、是否与第一段重复。
                            </aside>
                          ) : null}
                          <button type="button" onClick={() => void startBodyTwo()} disabled={coachBusy}>
                            {coachBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
                            开始第二主体段
                            {!coachBusy ? <ArrowRight size={15} aria-hidden="true" /> : null}
                          </button>
                        </section>
                      ) : null}
                      {paragraphAction === "KEEP_DRAFT" && !paragraphEvaluationStale && session.paragraphKey === "body_2" ? (
                        <section className="next-body-paragraph-card complete" aria-label="Two body paragraphs complete">
                          <small>TWO BODY PARAGRAPHS READY</small>
                          <h3>两段主体段已经分别保存。</h3>
                          <p>现在可以反过来写开头：让题目引入、总体立场和你真正写出的两段正文保持一致。</p>
                          <button type="button" onClick={() => void startIntroduction()} disabled={introductionBusy}>
                            {introductionBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
                            {introductionStarted ? "回到开头" : "开始写开头"}
                            {!introductionBusy ? <ArrowRight size={15} aria-hidden="true" /> : null}
                          </button>
                        </section>
                      ) : null}

                      {introductionStarted && introductionContext ? (
                        <section className="introduction-workspace" aria-label="Introduction workshop">
                          <header>
                            <div>
                              <small>INTRODUCTION · LEARNER WRITES</small>
                              <h3>先准确，再漂亮</h3>
                              <p>开头不是新的论证段。它只负责把读者带到题目，并准确预告你已经完成的文章。</p>
                            </div>
                            <span>{introductionWordCount} words</span>
                          </header>

                          <div className="introduction-trusted-map">
                            <article>
                              <small>YOUR POSITION</small>
                              <p>{introductionContext.essayPosition}</p>
                            </article>
                            {introductionContext.bodyPlan.map((body, index) => (
                              <article key={body.key}>
                                <small>BODY {index + 1} · {body.role.toUpperCase()}</small>
                                <p>{body.mainPoint}</p>
                              </article>
                            ))}
                          </div>

                          <aside className="introduction-hook-note">
                            <small>ABOUT THE “HOOK”</small>
                            <strong>它是可选的相关开场，不是必须炫技的一句话。</strong>
                            <p>可以用一句直接相关的背景把读者带到争议；不要用名言、反问、故事、编造数据或空泛的 “Nowadays, with the rapid development…” 。</p>
                          </aside>

                          {introductionEvaluation && !introductionEvaluationStale ? (
                            <section className="introduction-feedback" aria-label="Introduction feedback">
                              <header>
                                <small>AGENT FEEDBACK{introductionDraft?.model ? <> · <span className="deepseek-model">{modelDisplayName(introductionDraft.model)}</span></> : null}</small>
                                <strong>{introductionAction === "KEEP_INTRODUCTION" ? "CLEAR AND READY" : "REVISE THE INTRODUCTION"}</strong>
                              </header>
                              <div>
                                <article className={introductionEvaluation.task_response.status === "clear" ? "clear" : "revise"}>
                                  <small>TASK RESPONSE</small>
                                  <h4>{introductionEvaluation.task_response.status === "clear" ? "The introduction matches the essay" : "One content priority"}</h4>
                                  {introductionEvaluation.task_response.strength_en ? <p>{introductionEvaluation.task_response.strength_en}</p> : null}
                                  <p className="priority">{introductionEvaluation.task_response.feedback_en}</p>
                                  {introductionEvaluation.task_response.evidence_span ? <blockquote>{introductionEvaluation.task_response.evidence_span}</blockquote> : null}
                                </article>
                                <article className={introductionEvaluation.language.status === "clear" ? "clear" : "revise"}>
                                  <small>LANGUAGE</small>
                                  <h4>{introductionEvaluation.language.status === "clear"
                                    ? "The language is usable"
                                    : introductionEvaluation.language.severity === "minor" ? "A local surface fix" : "One language priority"}</h4>
                                  {introductionEvaluation.language.strength_en ? <p>{introductionEvaluation.language.strength_en}</p> : null}
                                  <p className="priority">{introductionEvaluation.language.feedback_en}</p>
                                  {introductionEvaluation.language.evidence_span ? <blockquote>{introductionEvaluation.language.evidence_span}</blockquote> : null}
                                </article>
                              </div>
                            </section>
                          ) : introductionDraft && introductionEvaluationStale ? (
                            <p className="paragraph-stale-note">You changed the introduction after the last feedback. Check the current version again.</p>
                          ) : null}

                          {introductionMessage ? <p className="coach-inline-message" role="status">{introductionMessage}</p> : null}
                          <form className="introduction-form" onSubmit={submitIntroduction}>
                            <section className="introduction-language-workspace" aria-label="Introduction language activation">
                              <header>
                                <div>
                                  <small>LANGUAGE ACTIVATION · ONE PART AT A TIME</small>
                                  <h4>先自己写；卡住时再打开语料。</h4>
                                  <p>首选只会是一条来自已审核 IELTS 范文开头的句式或表达动作。局部搭配放在后面，不会代替你写完整句子。</p>
                                </div>
                                <span>{introductionExpressionRetrieval?.pool.approvedIntroductionSentences ?? 0} 条 IELTS 开头句式</span>
                              </header>
                              <nav aria-label="Choose one introduction part">
                                {([
                                  ["opening", "01", "Opening"],
                                  ["task_framing", "02", "Task framing"],
                                  ["thesis", "03", "Thesis"],
                                ] as const).map(([part, number, label]) => (
                                  <button
                                    type="button"
                                    className={activeIntroductionPart === part ? "active" : ""}
                                    onClick={() => setActiveIntroductionPart(part)}
                                    key={part}
                                  >
                                    <b>{number}</b>
                                    <span>{label}</span>
                                    {introductionPartDraft(part).trim() ? <Check size={14} aria-hidden="true" /> : null}
                                  </button>
                                ))}
                              </nav>

                              {introductionExpressionBusy ? (
                                <div className="introduction-language-loading"><Loader2 className="spin" size={17} aria-hidden="true" /> 正在核对正式语料…</div>
                              ) : null}
                              {introductionExpressionMessage ? <p className="coach-inline-message" role="status">{introductionExpressionMessage}</p> : null}

                              {!introductionExpressionBusy && introductionExpressionRetrieval ? (
                                <div className="introduction-language-current">
                                  <div className="introduction-language-purpose">
                                    <small>CURRENT PART · {introductionExpressionRetrieval.partNeed.label.toUpperCase()}</small>
                                    <p>{introductionExpressionRetrieval.partNeed.purposeZh}</p>
                                  </div>

                                  {introductionExpressionRetrieval.noSuitableAsset ? (
                                    <aside className="introduction-language-no-fit">
                                      <small>NO STRONG CORPUS FIT</small>
                                      <strong>这一部分不用硬套语料。</strong>
                                      <p>{introductionExpressionRetrieval.noSuitableReasonZh}</p>
                                      <div>
                                        {introductionExpressionRetrieval.supportingExpressions.length ? (
                                          <button type="button" onClick={() => setIntroductionHintLevels((current) => ({
                                            ...current,
                                            [activeIntroductionPart]: Math.max(2, current[activeIntroductionPart] ?? 0),
                                          }))}>查看可用的局部搭配</button>
                                        ) : null}
                                        {activeIntroductionPart === "opening" ? (
                                          <button type="button" onClick={() => setActiveIntroductionPart("task_framing")}>省略 Opening，继续 Task framing</button>
                                        ) : null}
                                      </div>
                                    </aside>
                                  ) : activeIntroductionAsset ? (
                                    <section className="introduction-primary-asset">
                                      <header>
                                        <div>
                                          <small>PRIMARY MATCH · {activeIntroductionAsset.transferUnit === "sentence_frame" ? "SENTENCE FRAME" : "RHETORICAL MOVE"}</small>
                                          <h5>为什么适合这一部分</h5>
                                        </div>
                                        <span>{activeIntroductionAsset.learningStage === "new" ? "库内新语料" : activeIntroductionAsset.learningStage === "use" ? "已进入 Use" : "已学习"}</span>
                                      </header>
                                      <p>{activeIntroductionAsset.recommendationReasonZh}</p>
                                      {introductionExpressionRetrieval.selection.mode === "deepseek" ? <small className="deepseek-note">DeepSeek 已从正式候选中核对</small> : null}
                                      <p className="node-transfer-guidance">{activeIntroductionAsset.transferGuidanceZh}</p>

                                      {activeIntroductionHintLevel >= 1 ? (
                                        <div className="node-hint-step">
                                          <small>HINT 1 · 中文方向</small>
                                          <p>{activeIntroductionAsset.cueZh}</p>
                                        </div>
                                      ) : null}
                                      {activeIntroductionHintLevel >= 2 ? (
                                        <div className="node-hint-step target">
                                          <small>HINT 2 · 目标句式</small>
                                          <strong>{compactTargetForm(activeIntroductionAsset)}</strong>
                                        </div>
                                      ) : null}
                                      {activeIntroductionHintLevel >= 3 ? (
                                        <div className="node-hint-step skeleton">
                                          <small>HINT 3 · 可填写骨架</small>
                                          <strong>{localSkeleton(activeIntroductionAsset)}</strong>
                                        </div>
                                      ) : null}
                                      {activeIntroductionHintLevel >= 4 ? (
                                        <div className="node-hint-step reference">
                                          <small>HINT 4 · 原文中的用法</small>
                                          <blockquote>{activeIntroductionAsset.originalSentence ?? activeIntroductionAsset.englishForm}</blockquote>
                                          <p>只观察这一句怎样完成开头任务，不要照搬来源主题。</p>
                                        </div>
                                      ) : null}

                                      <footer>
                                        <div>
                                          <small>{activeIntroductionHintLevel === 0
                                            ? `来源：${activeIntroductionAsset.sourceTitle} · 英文在 Hint 2 展示`
                                            : `已使用第 ${activeIntroductionHintLevel} 级帮助`}</small>
                                          <span>{activeIntroductionAsset.sourceRelation === "same_prompt" ? "同题来源" : "跨主题迁移"}</span>
                                        </div>
                                        <button type="button" disabled={introductionExpressionBusy || activeIntroductionHintLevel >= 4} onClick={() => void revealNextIntroductionHint()}>
                                          {activeIntroductionHintLevel === 0 ? "我卡住了，给一点提示" : activeIntroductionHintLevel >= 4 ? "已显示完整参考" : "再给一点提示"}
                                        </button>
                                      </footer>
                                      {activeIntroductionAsset.learningStage === "new" && activeIntroductionHintLevel >= 2 ? (
                                        <a className="node-learning-link" href={assetLearningHref(activeIntroductionAsset)} target="_blank" rel="noreferrer">打开正式学习卡</a>
                                      ) : null}
                                    </section>
                                  ) : null}

                                  {activeIntroductionHintLevel >= 2 && introductionExpressionRetrieval.supportingExpressions.length ? (
                                    <details className="introduction-supporting-expressions">
                                      <summary>可选局部搭配（{introductionExpressionRetrieval.supportingExpressions.length}）</summary>
                                      <div>
                                        {introductionExpressionRetrieval.supportingExpressions.map((asset) => (
                                          <article key={assetKey(asset)}>
                                            <strong>{asset.englishForm}</strong>
                                            <p>{asset.cueZh}</p>
                                            <small>{asset.sourceTitle} · {asset.learningStage === "new" ? "库内新语料" : "已学"}</small>
                                          </article>
                                        ))}
                                      </div>
                                    </details>
                                  ) : null}
                                </div>
                              ) : null}
                            </section>
                            <label>
                              <span><b>01</b><strong>Relevant opening</strong><small>Optional · some teachers call this the hook</small></span>
                              <textarea
                                value={introductionParts.opening}
                                onChange={(event) => setIntroductionParts((current) => ({ ...current, opening: event.target.value }))}
                                onFocus={() => setActiveIntroductionPart("opening")}
                                placeholder="Optional: one directly relevant context sentence."
                                maxLength={1500}
                                disabled={introductionBusy}
                              />
                            </label>
                            <label>
                              <span><b>02</b><strong>Task framing</strong><small>Required · introduce the exact issue in your own words</small></span>
                              <textarea
                                value={introductionParts.taskFraming}
                                onChange={(event) => setIntroductionParts((current) => ({ ...current, taskFraming: event.target.value }))}
                                onFocus={() => setActiveIntroductionPart("task_framing")}
                                placeholder="Paraphrase the question accurately without giving a new argument."
                                maxLength={1500}
                                disabled={introductionBusy}
                              />
                            </label>
                            <label>
                              <span><b>03</b><strong>Thesis</strong><small>Required · state your answer and match both body paragraphs</small></span>
                              <textarea
                                value={introductionParts.thesis}
                                onChange={(event) => setIntroductionParts((current) => ({ ...current, thesis: event.target.value }))}
                                onFocus={() => setActiveIntroductionPart("thesis")}
                                placeholder="State the position this essay actually develops. A fixed ‘This essay will…’ roadmap is not required."
                                maxLength={1500}
                                disabled={introductionBusy}
                              />
                            </label>
                            <details>
                              <summary>Show introduction examples</summary>
                              <p><strong>Relevant opening:</strong> Public transport plays a central role in how modern cities function.</p>
                              <p><strong>Task framing:</strong> There is continuing debate over whether urban transport should be funded mainly by passengers or by the public.</p>
                              <p><strong>Thesis:</strong> I believe shared public funding is justified because access and wider economic benefits extend beyond individual users.</p>
                            </details>
                            <div className="introduction-preview">
                              <small>YOUR INTRODUCTION</small>
                              <p>{introductionText || "Your parts will appear here as one introduction."}</p>
                            </div>
                            <footer>
                              <span>Opening optional · framing and thesis required · no fixed sentence count</span>
                              <button type="submit" disabled={introductionBusy || !introductionParts.taskFraming.trim() || !introductionParts.thesis.trim()}>
                                {introductionBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
                                {introductionBusy ? "Checking…" : introductionDraft ? "Check revised introduction" : "Check task response and language"}
                              </button>
                            </footer>
                          </form>

                          {introductionAction === "KEEP_INTRODUCTION" && !introductionEvaluationStale ? (
                            <section className="introduction-ready-note">
                              <Check size={22} aria-hidden="true" />
                              <div>
                                <small>INTRODUCTION SAVED</small>
                                <strong>开头已经和题目、立场及两段正文对齐。</strong>
                                <p>下一步由你自己收束全文；系统不会生成结论。</p>
                                <button type="button" onClick={() => void startConclusion()} disabled={conclusionBusy}>
                                  {conclusionBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
                                  {conclusionStarted ? "回到结论" : "开始写结论"}
                                  {!conclusionBusy ? <ArrowRight size={15} aria-hidden="true" /> : null}
                                </button>
                              </div>
                            </section>
                          ) : null}

                          {conclusionStarted && conclusionContext ? (
                            <section className="conclusion-workspace" aria-label="Conclusion workshop">
                              <header>
                                <div><small>CONCLUSION · LEARNER WRITES</small><h3>把已经证明的内容收回来</h3><p>给出最终判断，并概括两段共同建立了什么。不要在这里加入第三个理由、新例子或新证据。</p></div>
                                <span>{conclusionWordCount} words</span>
                              </header>
                              <div className="conclusion-anchor-list">
                                <article><small>POSITION</small><p>{conclusionContext.essayPosition}</p></article>
                                {conclusionContext.bodyPlan.map((body, index) => <article key={body.key}><small>BODY {index + 1} TAKEAWAY</small><p>{body.takeaway || body.mainPoint}</p></article>)}
                              </div>
                              <aside className="conclusion-method-note"><b>思考方法</b><p>先问：两段合在一起，让我有资格作出什么有限判断？再用这个判断回应题目。可以换一个概括层级，不必把 thesis 原句再抄一遍。</p></aside>
                              {conclusionEvaluation && !conclusionEvaluationStale ? (
                                <section className="introduction-feedback" aria-label="Conclusion feedback">
                                  <header><small>AGENT FEEDBACK{conclusionDraft?.model ? <> · <span className="deepseek-model">{modelDisplayName(conclusionDraft.model)}</span></> : null}</small><strong>{conclusionAction === "KEEP_CONCLUSION" ? "CLEAR AND READY" : "REVISE THE CONCLUSION"}</strong></header>
                                  <div>
                                    <article className={conclusionEvaluation.task_response.status === "clear" ? "clear" : "revise"}><small>TASK RESPONSE</small><h4>{conclusionEvaluation.task_response.status === "clear" ? "The essay is properly closed" : "One content priority"}</h4>{conclusionEvaluation.task_response.strength_en ? <p>{conclusionEvaluation.task_response.strength_en}</p> : null}<p className="priority">{conclusionEvaluation.task_response.feedback_en}</p>{conclusionEvaluation.task_response.evidence_span ? <blockquote>{conclusionEvaluation.task_response.evidence_span}</blockquote> : null}</article>
                                    <article className={conclusionEvaluation.language.status === "clear" ? "clear" : "revise"}><small>LANGUAGE</small><h4>{conclusionEvaluation.language.status === "clear" ? "The language is usable" : conclusionEvaluation.language.severity === "minor" ? "A local surface fix" : "One language priority"}</h4>{conclusionEvaluation.language.strength_en ? <p>{conclusionEvaluation.language.strength_en}</p> : null}<p className="priority">{conclusionEvaluation.language.feedback_en}</p>{conclusionEvaluation.language.evidence_span ? <blockquote>{conclusionEvaluation.language.evidence_span}</blockquote> : null}</article>
                                  </div>
                                </section>
                              ) : conclusionDraft && conclusionEvaluationStale ? <p className="paragraph-stale-note">You changed the conclusion after the last feedback. Check the current version again.</p> : null}
                              {conclusionMessage ? <p className="coach-inline-message" role="status">{conclusionMessage}</p> : null}
                              <form className="conclusion-form" onSubmit={submitConclusion}>
                                <label><span className="sr-only">Your conclusion</span><textarea value={conclusionText} onChange={(event) => setConclusionText(event.target.value)} placeholder="Write your final judgment and synthesis in English. Do not add a new main idea." maxLength={3000} disabled={conclusionBusy} /></label>
                                <footer><span>No fixed sentence count · no new argument · your exact wording is saved</span><button type="submit" disabled={conclusionBusy || !conclusionText.trim()}>{conclusionBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}{conclusionBusy ? "Checking…" : conclusionDraft ? "Check revised conclusion" : "Check conclusion"}</button></footer>
                              </form>
                              {conclusionAction === "KEEP_CONCLUSION" && !conclusionEvaluationStale ? (
                                <section className="essay-ready-callout"><Check size={22} aria-hidden="true" /><div><small>FOUR SECTIONS READY</small><strong>现在可以看到一篇完全由你写出的文章。</strong><p>全文页只拼接原文并做最后检查，不会偷偷润色。</p><button type="button" onClick={() => void startFullEssay()} disabled={fullEssayBusy}>{fullEssayBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}{fullEssayStarted ? "回到完整文章" : "组装完整文章"}<ArrowRight size={15} aria-hidden="true" /></button></div></section>
                              ) : null}

                              {fullEssayStarted && fullEssayContext ? (
                                <section className="full-essay-workspace" aria-label="Full learner essay">
                                  <header><div><small>YOUR COMPLETE ESSAY</small><h3>四段原文，一字未改</h3><p>检查关注整篇是否回应题目、段落是否推进、语言是否清楚；不提供一键改写。</p></div><span>{fullEssayWordCount} words</span></header>
                                  <div className="full-essay-paper">
                                    {([['INTRODUCTION', fullEssayContext.sections.introduction], ['BODY PARAGRAPH 1', fullEssayContext.sections.bodyOne], ['BODY PARAGRAPH 2', fullEssayContext.sections.bodyTwo], ['CONCLUSION', fullEssayContext.sections.conclusion]] as const).map(([label, text]) => <article key={label}><small>{label}</small><p>{text}</p></article>)}
                                  </div>
                                  {fullEssayWordCount < 250 ? <p className="essay-word-warning">IELTS Task 2 至少要求 250 词；当前还差 {250 - fullEssayWordCount} 词。补充应回到已有论证继续展开，不要为了凑字数加入新观点。</p> : null}
                                  {fullEssayEvaluation ? (
                                    <section className="full-essay-feedback">
                                      <header><small>FINAL CHECK{fullEssayReview?.model ? <> · <span className="deepseek-model">{modelDisplayName(fullEssayReview.model)}</span></> : null}</small><strong>{fullEssayAction === "READY" ? "READY AS YOUR DRAFT" : "ONE MORE REVISION ROUND"}</strong></header>
                                      <div>
                                        {([['TASK RESPONSE', fullEssayEvaluation.task_response], ['COHERENCE', fullEssayEvaluation.coherence], ['LANGUAGE', fullEssayEvaluation.language]] as const).map(([label, axis]) => <article className={axis.status === "clear" ? "clear" : "revise"} key={label}><small>{label}</small><h4>{axis.status === "clear" ? "Clear" : "Priority to revise"}</h4>{axis.strength_en ? <p>{axis.strength_en}</p> : null}<p className="priority">{axis.feedback_en}</p>{axis.evidence_span ? <blockquote>{axis.evidence_span}</blockquote> : null}</article>)}
                                      </div>
                                    </section>
                                  ) : null}
                                  {fullEssayMessage ? <p className="coach-inline-message" role="status">{fullEssayMessage}</p> : null}
                                  <button className="full-essay-check-button" type="button" onClick={() => void submitFullEssayCheck()} disabled={fullEssayBusy}>{fullEssayBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Compass size={17} aria-hidden="true" />}{fullEssayBusy ? "Checking…" : fullEssayReview ? "Check the saved four sections again" : "Run final three-part check"}</button>
                                  <section className="corpus-use-summary">
                                    <header><div><small>CORPUS → WRITING</small><h4>这篇文章里实际调用过的语料</h4></div><span>{fullEssayContext.corpusUse.length} 项</span></header>
                                    {fullEssayContext.corpusUse.length ? <div>{fullEssayContext.corpusUse.map((item) => <article key={`${item.sessionId}:${item.node}`}><small>{item.assetType === "sentence" ? "SENTENCE FRAME" : "COLLOCATION"} · {item.node.toUpperCase()}</small><strong>{item.label}</strong><p>使用到 Hint {item.hintLevel} · {item.learningState === "learned" ? "此前已学习" : "库内新语料"}</p>{item.learningState === "new" ? <a href={item.assetType === "sentence" ? `/sentences/${item.assetId}` : `/collocations/${item.assetId}`} target="_blank" rel="noreferrer">去正式学习</a> : null}</article>)}</div> : <p>本次两段正文没有保存“调用某条正式语料”的通过记录；系统不会为了展示效果伪造使用。</p>}
                                    <footer>“用过”只表示这次写作中发生过迁移，不等于已经掌握。</footer>
                                  </section>
                                </section>
                              ) : null}
                            </section>
                          ) : null}
                        </section>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : (
                <form onSubmit={submitCoachAnswer}>
                  {session.currentNode === "mechanism" && session.graph.reason && session.graph.claim ? (
                    <div className="coach-relationship-strip" aria-label="The connection to explain">
                      <div><small>YOUR REASON</small><p>{session.graph.reason.content}</p></div>
                      <span aria-hidden="true">→</span>
                      <div className="missing"><small>MISSING CONNECTION</small><p>What changes in between?</p></div>
                      <span aria-hidden="true">→</span>
                      <div><small>YOUR MAIN POINT</small><p>{session.graph.claim.content}</p></div>
                    </div>
                  ) : null}
                  {currentGuidance ? (
                    <div className="coach-guidance-stack">
                      <div className="coach-step-guide">
                        <p>{currentGuidance.taskEn}</p>
                        <span>{currentGuidance.boundaryEn}</span>
                      </div>
                      {currentGuidance.logicLens ? (
                        <aside className="coach-logic-panel" aria-label="Logic lens">
                          <header>
                            <h4>{currentGuidance.logicLens.labelEn.replace("Logic lens · ", "")}</h4>
                          </header>
                          <ol>
                            {currentGuidance.logicLens.checksEn.map((check, index) => (
                              <li key={check}><span>{index + 1}</span><p>{check}</p></li>
                            ))}
                          </ol>
                          <footer>{currentGuidance.logicLens.sourceNoteEn}</footer>
                        </aside>
                      ) : null}
                      <details className="coach-form-examples">
                        <summary>Show writing examples</summary>
                        <ol>
                          {currentGuidance.examplesEn.map((example) => <li key={example}>{example}</li>)}
                        </ol>
                      </details>
                    </div>
                  ) : null}
                  <h3>{session.currentQuestionEn}</h3>
                  <label>
                    <span className="sr-only">Answer in English</span>
                    <textarea
                      ref={answerRef}
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder="Answer in English. A clear idea matters more than advanced vocabulary."
                      maxLength={1200}
                      disabled={coachBusy}
                    />
                  </label>
                  <footer>
                    <span>English only · one idea at a time</span>
                    <button type="submit" disabled={coachBusy || !answer.trim()}>
                      {coachBusy ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
                      {coachBusy ? "Checking…" : "Check my idea"}
                    </button>
                  </footer>
                </form>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
