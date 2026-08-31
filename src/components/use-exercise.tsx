"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Layers3, Loader2, PenLine, Puzzle } from "lucide-react";
import { Fragment, useRef, useState } from "react";
import {
  adaptiveCompletionNavigation,
  adaptiveRetestLabel,
  type AdaptiveNextStepPayload,
} from "../domain/review/adaptive-navigation";
import {
  referenceRevealUsesAssistance,
  revisionTreatment,
  type TeachingActionV1,
} from "../domain/practice/teaching-action";
import type { UseEvaluationFeedback } from "../domain/practice/use-evaluation";
import type { UseTask } from "../domain/practice/use-task";
import type { SentenceCardData } from "../lib/content-types";
import { locateGuidedHints } from "../lib/guided-prompt";
import { functionLabels, modelDisplayName } from "../lib/labels";

const ratings = [
  { value: "forgot", label: "还不会用" },
  { value: "fuzzy", label: "结构或搭配不稳" },
  { value: "recalled", label: "基本能写" },
  { value: "can_use", label: "能独立使用" },
] as const;

function PatternSkeleton({ pattern }: { pattern: string }) {
  const parts = pattern.split(/(\{[a-z0-9_]+\})/g).filter(Boolean);
  return <p className="use-pattern">{parts.map((part, index) => part.startsWith("{")
    ? <span className="pattern-blank" aria-label={`可替换内容：${part.slice(1, -1).replaceAll("_", " ")}`} key={`${part}-${index}`} />
    : part)}</p>;
}

function GuidedPromptText({ task }: { task: UseTask }) {
  if (!task.guidedPrompt) return null;
  const matches = locateGuidedHints(task.guidedPrompt.text, task.guidedPrompt.hints);
  let cursor = 0;

  return <p>{matches.map((hint, index) => {
    if (hint.index < cursor) return null;
    const precedingText = task.guidedPrompt!.text.slice(cursor, hint.index);
    cursor = hint.end;
    return <Fragment key={`${hint.zh}-${index}`}>{precedingText}<span>{hint.zh}<small>（{hint.en}）</small></span></Fragment>;
  })}{task.guidedPrompt.text.slice(cursor)}</p>;
}

export function UseExercise({
  card,
  task,
  exerciseRef,
  evaluatorEnabled,
  returnHref,
  returnLabel = "返回回忆练习",
  sourceHref,
  retryHref,
  nextHref,
  nextLabel,
}: {
  card: SentenceCardData;
  task: UseTask;
  exerciseRef: string;
  evaluatorEnabled: boolean;
  returnHref: string;
  returnLabel?: string;
  sourceHref: string;
  retryHref: string;
  nextHref: string;
  nextLabel: string;
}) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [assistanceUsed, setAssistanceUsed] = useState(false);
  const [draftMode, setDraftMode] = useState<"alternative" | "revision" | "typo" | null>(null);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [saved, setSaved] = useState<{
    attemptId: string;
    adaptiveNextStep?: AdaptiveNextStepPayload | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const [attemptId, setAttemptId] = useState(() => crypto.randomUUID());
  const [previousAttemptId, setPreviousAttemptId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<{
    attemptId: string;
    status: "evaluated" | "fallback" | "pending";
    feedback: UseEvaluationFeedback | null;
    teachingAction: TeachingActionV1 | null;
    retryIndex: number;
    model: string | null;
    message: string | null;
  } | null>(null);
  const answerInput = useRef<HTMLTextAreaElement>(null);
  const feedbackHasIssue = Boolean(evaluation?.status === "evaluated" && evaluation.feedback?.issue);
  const isTypoOnly = Boolean(evaluation?.status === "evaluated" && evaluation.feedback?.typoOnly);
  const isCleanPass = Boolean(
    evaluation?.status === "evaluated"
    && evaluation.teachingAction?.type === "PASS"
    && !feedbackHasIssue,
  );
  const promptSnapshot = task.mode === "structure"
    ? [task.guidedPrompt?.text, ...task.slotValues.map((slot) => `${slot.roleZh}: ${slot.value}`)].filter(Boolean).join("\n")
    : [task.guidedPrompt?.text, `目标词块：${task.targetChunks.map((chunk) => chunk.text).join(" / ")}`].filter(Boolean).join("\n");
  const completionNavigation = adaptiveCompletionNavigation({
    step: saved?.adaptiveNextStep,
    nextHref,
    nextLabel,
    sourceHref,
    retryHref,
  });

  const updateAnswer = (value: string) => {
    setAnswer(value);
    if (evaluation) {
      setPreviousAttemptId(evaluation.attemptId);
      setEvaluation(null);
      setAttemptId(crypto.randomUUID());
      startedAt.current = Date.now();
    }
  };

  const evaluate = async () => {
    const requestAttemptId = evaluation?.status === "fallback" ? crypto.randomUUID() : attemptId;
    if (requestAttemptId !== attemptId) setAttemptId(requestAttemptId);
    setEvaluating(true);
    setError(null);
    try {
      const response = await fetch("/api/use-evaluations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: requestAttemptId, exerciseRef, learnerAnswer: answer, previousAttemptId }),
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(failure?.error ?? "暂时无法检查这句话；你的输入仍保留在页面中。");
      }
      const result = await response.json();
      setEvaluation(result);
      if (result.status === "evaluated") {
        if (result.teachingAction?.type === "PASS") {
          if (!result.feedback?.issue) setRevealed(true);
        } else setAssistanceUsed(true);
      }
    } catch (cause) {
      setEvaluation({
        attemptId: requestAttemptId,
        status: "fallback",
        feedback: null,
        teachingAction: { type: "SHOW_REFERENCE" },
        retryIndex: evaluation?.retryIndex ?? 0,
        model: evaluation?.model ?? null,
        message: cause instanceof Error ? cause.message : "AI 反馈暂时不可用。",
      });
    } finally {
      setEvaluating(false);
    }
  };

  const revealReference = () => {
    setAssistanceUsed(referenceRevealUsesAssistance(evaluation?.teachingAction ?? null, assistanceUsed));
    setRevealed(true);
  };

  const tryAlternative = () => {
    setAnswer("");
    setEvaluation(null);
    setAttemptId(crypto.randomUUID());
    setPreviousAttemptId(null);
    setRevealed(false);
    setAssistanceUsed(true);
    setDraftMode("alternative");
    setError(null);
    startedAt.current = Date.now();
    requestAnimationFrame(() => answerInput.current?.focus());
  };

  const reviseCurrentAnswer = () => {
    if (!evaluation) return;
    const treatment = revisionTreatment(evaluation.feedback);
    setEvaluation(null);
    setAttemptId(crypto.randomUUID());
    setPreviousAttemptId(treatment.continuesRetryChain ? evaluation.attemptId : null);
    setRevealed(false);
    if (treatment.countsAsAssistance) setAssistanceUsed(true);
    setDraftMode(treatment.draftMode);
    setError(null);
    startedAt.current = Date.now();
    requestAnimationFrame(() => answerInput.current?.focus());
  };

  const submit = async (selfRating: typeof ratings[number]["value"]) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId,
          exerciseType: task.exerciseType,
          cardId: card.id,
          promptSnapshot,
          userAnswer: answer,
          selfRating,
          hintUsed: assistanceUsed,
          durationMs: Date.now() - startedAt.current,
        }),
      });
      if (!response.ok) throw new Error("保存应用练习失败，请稍后重试。");
      setSaved(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="recall-card use-card">
      <header className="recall-head">
        <Link href={returnHref}><ArrowLeft size={16} /> {returnLabel}</Link>
        <div className="learning-step"><span>USE</span><span className="step-line" /><span>03 / 03</span></div>
      </header>
      <section className="recall-main use-main">
        {saved ? (
          <div className="recall-complete">
            <CheckCircle2 size={34} />
            <h1>本句训练已保存。</h1>
            <p>{saved.adaptiveNextStep
              ? `下一步：${completionNavigation.label}。${completionNavigation.retest ? ` 已安排 ${new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric" }).format(new Date(completionNavigation.retest.dueAt))} ${adaptiveRetestLabel(completionNavigation.retest)}。` : ""}`
              : "应用练习与自评已保存，可以继续下一句。"}</p>
            <div>
              <Link className="button secondary" href={completionNavigation.differsFromPlan ? nextHref : returnHref}>{completionNavigation.differsFromPlan ? "按原计划继续" : "回看本句"}</Link>
              <Link className="button primary" href={completionNavigation.href}>{completionNavigation.label} <ArrowRight size={17} /></Link>
            </div>
          </div>
        ) : (
          <>
            <h1>仿写练习</h1>

            {task.guidedPrompt ? (
              <section className="guided-prompt">
                <span>中文提示</span>
                <GuidedPromptText task={task} />
              </section>
            ) : null}

            <label className="recall-answer use-answer">
              <span>写出英文句子</span>
              <textarea ref={answerInput} disabled={evaluating} value={answer} onChange={(event) => updateAnswer(event.target.value)} placeholder="在这里写…" rows={5} />
            </label>
            {draftMode && !evaluation ? <p className="alternative-writing-note">{draftMode === "revision"
              ? "原答案已保留。只修改刚才指出的语法或拼写问题，然后重新检查。"
              : draftMode === "typo"
                ? "原答案已保留。只修正这处笔误；不会按能力失败处理，也不占用纠错次数。"
              : "正在尝试另一种写法，AI 会重新判断；因为你已经看过参考答案，保存时会记为使用过提示。"}</p> : null}
            {!revealed ? <div className="use-check-actions">
              {evaluatorEnabled ? <button className="button primary" type="button" disabled={evaluating} onClick={evaluate}>
                {evaluating ? <Loader2 className="spin" size={17} /> : null}{evaluating ? "正在检查…" : evaluation ? "重新检查" : "检查我的句子"}
              </button> : null}
              <button className="button secondary reveal-answer" type="button" onClick={revealReference}><Eye size={18} /> 显示参考答案</button>
            </div> : null}
            {evaluation ? <section className={`use-evaluation-feedback ${evaluation.status}${isCleanPass ? " clean-pass" : ""}`} aria-live="polite">
              {evaluation.status === "evaluated" && evaluation.feedback ? <>
                {isCleanPass ? <div className="use-success-burst" aria-hidden="true">
                  <span className="use-success-check"><CheckCircle2 size={25} /></span>
                  <i /><i /><i /><i /><i /><i />
                </div> : null}
                <div className="use-evaluation-provider">AI 反馈 · <span className="deepseek-model">{modelDisplayName(evaluation.model ?? "DeepSeek")}</span></div>
                <div className="use-evaluation-heading">
                  <strong>{evaluation.teachingAction?.type === "PASS"
                    ? isTypoOnly ? "句子成立，修正一处笔误" : feedbackHasIssue ? "整体成立，但先看这个问题" : "这句话可以通过"
                    : evaluation.teachingAction?.type === "SHOW_REFERENCE"
                      ? feedbackHasIssue ? "先看问题，再对照参考答案" : "请对照参考答案并自评"
                      : "先根据反馈再试一次"}</strong>
                  <span>{evaluation.feedback.meaningLabel}</span>
                </div>
                {evaluation.feedback.issue ? <p><b>{isTypoOnly ? "笔误" : "先改这里"}</b>{evaluation.feedback.issue}</p> : null}
                {evaluation.feedback.surfaceNote ? <p><b>另有笔误</b>{evaluation.feedback.surfaceNote}</p> : null}
                {evaluation.feedback.success ? <p><b>{feedbackHasIssue ? "已经做到" : "做对了"}</b>{evaluation.feedback.success}</p> : null}
                {evaluation.teachingAction?.type === "GIVE_MINIMAL_HINT" && evaluation.feedback.hint
                  ? <p><b>最小提示</b>{evaluation.feedback.hint}</p>
                  : null}
                {evaluation.teachingAction ? <div className="teaching-action-row">
                  {evaluation.teachingAction.type === "PASS" ? <>
                    <span>{feedbackHasIssue
                      ? isTypoOnly ? "保留原句，只修改笔误；这不会被记为一次能力失败。" : "保留原句，只修改上面指出的小问题，然后重新检查。"
                      : "参考答案已在下方展开。你可以直接自评，也可以换一种写法再检查。"}</span>
                    <button className="button secondary" type="button" onClick={feedbackHasIssue ? reviseCurrentAnswer : tryAlternative}>
                      <PenLine size={16} /> {isTypoOnly ? "修正笔误" : feedbackHasIssue ? "修改这句话" : "尝试其他写法"}
                    </button>
                  </> : evaluation.teachingAction.type === "SHOW_REFERENCE" ? <>
                    <span>{evaluation.retryIndex >= 2 ? "两次修改机会已用完。" : "这次无法可靠判断。"} 请查看参考答案后自评。</span>
                    <button className="button secondary" type="button" onClick={revealReference}><Eye size={16} /> 查看参考答案</button>
                  </> : <>
                    <span>{evaluation.teachingAction.type === "GIVE_MINIMAL_HINT" ? "先只用这条提示修改，不会直接给出完整答案。" : "请再修改一次；这次不重复相同提示。"}</span>
                    <button className="button secondary" type="button" onClick={() => answerInput.current?.focus()}>回到输入框修改</button>
                  </>}
                </div> : null}
              </> : <><div className="use-evaluation-provider">AI 反馈 · <span className="deepseek-model">{modelDisplayName(evaluation.model ?? "DeepSeek")}</span></div><p>{evaluation.message ?? "评价仍在处理中；你也可以直接查看参考答案并完成自评。"}</p></>}
            </section> : null}
            {revealed ? <>
              <div className="reference-answer">
                <div className="reference-answer-head"><span>参考答案</span><button type="button" onClick={() => setRevealed(false)}><EyeOff size={15} /> 收起答案</button></div>
                <p>{task.referenceAnswer}</p>
                <small className="reference-seen-note">{evaluation?.teachingAction?.type === "PASS" && !assistanceUsed
                  ? "AI 已在参考答案揭晓前判定通过；本次仍按完全独立产出保存。"
                  : "你已在完成前使用反馈或查看参考答案；本次会按“使用过提示”保存。"}</small>
              </div>
              {task.mode === "structure" ? (
                <section className="use-goal-panel revealed-use-goal">
                  <div className="use-goal-title"><Layers3 size={18} /><div><strong>本题结构</strong><span>{card.argument_functions.map((item) => functionLabels[item] ?? item).join(" · ")}</span></div></div>
                  <PatternSkeleton pattern={task.pattern} />
                </section>
              ) : (
                <section className="use-goal-panel vocabulary-use-panel revealed-use-goal">
                  <div className="use-goal-title"><Puzzle size={18} /><div><strong>本题词块</strong></div></div>
                  <div className="vocabulary-targets">{task.targetChunks.map((chunk) => <div key={chunk.text}><strong>{chunk.text}</strong><span>{chunk.meaning_zh}</span></div>)}</div>
                </section>
              )}
            </> : null}
            {revealed ? <div className="rating-panel"><span>这次应用得怎么样？</span><div>{ratings.map((rating) => <button key={rating.value} type="button" disabled={saving} onClick={() => submit(rating.value)}><strong>{rating.label}</strong></button>)}</div>{saving ? <p><Loader2 className="spin" size={15} /> 正在保存…</p> : null}{error ? <p className="form-error">{error}</p> : null}</div> : null}
          </>
        )}
      </section>
    </article>
  );
}
