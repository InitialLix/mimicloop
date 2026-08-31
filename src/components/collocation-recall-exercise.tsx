"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { recallReferenceUsesAssistance } from "../domain/practice/teaching-action";
import type { CollocationData } from "../lib/content-types";

const ratings = [
  { value: "forgot", label: "忘记了" },
  { value: "fuzzy", label: "有点模糊" },
  { value: "recalled", label: "基本会了" },
  { value: "can_use", label: "能够使用" },
] as const;

type SavedAttempt = { attemptId: string; matchResult: "canonical" | "accepted" | "unmatched" };

export function CollocationRecallExercise({
  collocation,
  returnHref,
  returnLabel = "返回搭配",
  nextHref,
  nextLabel,
  requiresUse,
}: {
  collocation: CollocationData;
  returnHref: string;
  returnLabel?: string;
  nextHref: string;
  nextLabel: string;
  requiresUse: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [assistanceUsed, setAssistanceUsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SavedAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  const submit = async (selfRating: typeof ratings[number]["value"]) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/collocations/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          collocationId: collocation.id,
          promptSnapshot: collocation.translation_prompt,
          userAnswer: answer,
          selfRating,
          hintUsed: assistanceUsed,
          durationMs: Date.now() - startedAt.current,
        }),
      });
      if (!response.ok) throw new Error("保存搭配练习失败，请稍后再试。");
      setSaved(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const revealReference = () => {
    setAssistanceUsed(recallReferenceUsesAssistance("reveal_after_answer", assistanceUsed));
    setRevealed(true);
  };

  const continueEditing = () => {
    setAssistanceUsed(recallReferenceUsesAssistance("continue_editing", assistanceUsed));
    setRevealed(false);
  };

  return <article className="recall-card collocation-recall-card">
    <header className="recall-head">
      <Link href={returnHref}><ArrowLeft size={16} /> {returnLabel}</Link>
        <div className="learning-step"><span>RECALL</span><span className="step-line" /><span>{requiresUse ? "02 / 03" : "02 / 02"}</span></div>
    </header>
    <section className="recall-main">
      {saved ? <div className="recall-complete">
        <CheckCircle2 size={34} />
        <h1>{requiresUse ? "回忆结果已经记录。" : "这条搭配已经记录。"}</h1>
        <p>{requiresUse
          ? saved.matchResult === "unmatched" ? "你的写法没有匹配到已审核答案；接下来换一个语境继续使用。" : "你的写法与已审核答案一致；接下来换一个语境继续使用。"
          : saved.matchResult === "unmatched" ? "你的写法没有匹配到已审核答案，本次结果仍按自评保存。" : "你的写法与已审核答案一致，本次自评也已经保存。"}</p>
        <div><Link className="button secondary" href={returnHref}>回看搭配</Link><Link className="button primary" href={nextHref}>{nextLabel} <ArrowRight size={17} /></Link></div>
      </div> : <>
        <p className="recall-kicker">中文提示 → 写出英文搭配 · 写完后核对不算提示</p>
        <h1>{collocation.translation_prompt}</h1>
        <label className="recall-answer collocation-recall-answer">
          <span>写下英文搭配</span>
          <input autoComplete="off" disabled={revealed} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="在这里写…" />
        </label>
        {!revealed
          ? <button className="button secondary reveal-answer" type="button" onClick={revealReference}><Eye size={18} /> 显示参考答案</button>
          : <div className="reference-answer collocation-reference-answer">
            <div className="reference-answer-head"><span>参考答案</span><button type="button" onClick={continueEditing}><EyeOff size={15} /> 收起并修改</button></div>
            <p>{collocation.canonical_text}</p>
            {collocation.accepted_answers.filter((item) => item !== collocation.canonical_text).length
              ? <small>其他已审核写法：{collocation.accepted_answers.filter((item) => item !== collocation.canonical_text).join(" / ")}</small>
              : null}
            <small className="reference-seen-note">{assistanceUsed
              ? "你已在查看答案后继续修改；本次会按“使用过提示”保存。"
              : "参考答案是在你完成作答后才揭晓的；本次仍按独立回忆保存。"}</small>
          </div>}
        {revealed ? <div className="rating-panel"><span>这次掌握得怎么样？</span><div>{ratings.map((rating) => <button key={rating.value} type="button" disabled={saving} onClick={() => submit(rating.value)}><strong>{rating.label}</strong></button>)}</div>{saving ? <p><Loader2 className="spin" size={15} /> 正在保存…</p> : null}{error ? <p className="form-error">{error}</p> : null}</div> : null}
      </>}
    </section>
  </article>;
}
