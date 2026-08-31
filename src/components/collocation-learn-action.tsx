"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const stageLabels: Record<string, string> = {
  new: "未学习",
  learned: "已理解",
  recall: "回忆中",
  use: "能够使用",
};

export function CollocationLearnAction({
  collocationId,
  learningStage,
  recallHref,
}: {
  collocationId: string;
  learningStage: string;
  recallHref: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markLearned = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/collocations/learn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collocationId }),
      });
      if (!response.ok) throw new Error("保存学习状态失败，请稍后再试。");
      router.push(recallHref);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return <div className="collocation-learn-action">
    <span>学习状态 · {stageLabels[learningStage] ?? learningStage}</span>
    {learningStage === "new"
      ? <button className="button primary" type="button" disabled={saving} onClick={markLearned}>
        {saving ? <Loader2 className="spin" size={16} /> : null}{saving ? "正在保存…" : "我已看懂，开始回忆"}{saving ? null : <ArrowRight size={17} />}
      </button>
      : <Link className="button primary" href={recallHref}>开始回忆 <ArrowRight size={17} /></Link>}
    {error ? <p className="form-error">{error}</p> : null}
  </div>;
}

