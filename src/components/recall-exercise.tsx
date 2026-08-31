"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { recallReferenceUsesAssistance } from "../domain/practice/teaching-action";
import type { SentenceCardData } from "../lib/content-types";

const ratings = [
  { value: "forgot", label: "忘记了" },
  { value: "fuzzy", label: "有点模糊" },
  { value: "recalled", label: "基本会了" },
  { value: "can_use", label: "能够使用" },
] as const;

export function RecallExercise({ card, returnHref, returnLabel = "返回学习卡", nextHref, nextLabel }: { card: SentenceCardData; returnHref: string; returnLabel?: string; nextHref: string; nextLabel: string }) {
  const seed = card.exercise_seed.translation_recall;
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [assistanceUsed, setAssistanceUsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ attemptId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  if (!seed) return <p>这张卡没有中译英回忆题。</p>;

  const submit = async (selfRating: typeof ratings[number]["value"]) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exerciseType: "translation_recall",
          cardId: card.id,
          promptSnapshot: seed.prompt_zh,
          userAnswer: answer,
          selfRating,
          hintUsed: assistanceUsed,
          durationMs: Date.now() - startedAt.current,
        }),
      });
      if (!response.ok) throw new Error("保存练习记录失败，请稍后重试。");
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

  return (
    <article className="recall-card">
      <header className="recall-head">
        <Link href={returnHref}><ArrowLeft size={16} /> {returnLabel}</Link>
        <div className="learning-step"><span>RECALL</span><span className="step-line" /><span>02 / 03</span></div>
      </header>
      <section className="recall-main">
        {saved ? (
          <div className="recall-complete">
            <CheckCircle2 size={34} />
            <h1>这次回忆已经记录。</h1>
            <p>本次自评已保存。下一步会根据这张卡的学习目标安排应用练习。</p>
            <div><Link className="button secondary" href={returnHref}>回看本句</Link><Link className="button primary" href={nextHref}>{nextLabel} <ArrowRight size={17} /></Link></div>
          </div>
        ) : (
          <>
            <p className="recall-kicker">中译英 · 写完后核对不算提示；看过答案再继续修改才算</p>
            <h1>{seed.prompt_zh}</h1>
            <label className="recall-answer"><span>写下你记得的英文</span><textarea disabled={revealed} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="不必逐字相同，先完整表达句子的逻辑…" rows={5} /></label>
            {!revealed ? <button className="button secondary reveal-answer" type="button" onClick={revealReference}><Eye size={18} /> 显示参考答案</button> : (
              <div className="reference-answer">
                <div className="reference-answer-head"><span>参考答案</span><button type="button" onClick={continueEditing}><EyeOff size={15} /> 收起并修改</button></div>
                <p>{seed.reference_answer}</p>
                <small className="reference-seen-note">{assistanceUsed
                  ? "你已在查看答案后继续修改；本次会按“使用过提示”保存。"
                  : "参考答案是在你完成作答后才揭晓的；本次仍按独立回忆保存。"}</small>
              </div>
            )}
            {revealed ? <div className="rating-panel"><span>这次掌握得怎么样？</span><div>{ratings.map((rating) => <button key={rating.value} type="button" disabled={saving} onClick={() => submit(rating.value)}><strong>{rating.label}</strong></button>)}</div>{saving ? <p><Loader2 className="spin" size={15} /> 正在保存…</p> : null}{error ? <p className="form-error">{error}</p> : null}</div> : null}
          </>
        )}
      </section>
    </article>
  );
}
