"use client";

import { Check, Clock3, Eye, Loader2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CandidateData, CandidateReviewAction, Chunk, SourceEssayData } from "../lib/content-types";

const statusLabels = {
  candidate: "待审核",
  needs_edit: "待修改",
  approved: "已收录",
  deferred: "暂缓",
  rejected: "已驳回",
} as const;

const nullable = (value: string) => value.trim() || null;

export function CandidateReviewEditor({ candidate: initialCandidate, source }: { candidate: CandidateData; source: SourceEssayData | null }) {
  const router = useRouter();
  const [candidate, setCandidate] = useState(initialCandidate);
  const [translationZh, setTranslationZh] = useState(candidate.card.translation_zh);
  const [chunks, setChunks] = useState<Chunk[]>(candidate.card.chunks);
  const [pattern, setPattern] = useState(candidate.card.pattern ?? "");
  const [slotsJson, setSlotsJson] = useState(JSON.stringify(candidate.card.slots, null, 2));
  const [grammarNote, setGrammarNote] = useState(candidate.card.grammar_note ?? "");
  const [usageNote, setUsageNote] = useState(candidate.card.usage_note ?? "");
  const [simplifiedVersion, setSimplifiedVersion] = useState(candidate.card.simplified_version ?? "");
  const [transferExample, setTransferExample] = useState(candidate.card.transfer_example ?? "");
  const [exerciseSeedJson, setExerciseSeedJson] = useState(JSON.stringify(candidate.card.exercise_seed, null, 2));
  const [uncertaintiesText, setUncertaintiesText] = useState(candidate.uncertainties.join("\n"));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState<CandidateReviewAction | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const sourceParagraph = useMemo(() => source?.paragraphs.find((item) => item.paragraph_index === candidate.card.paragraph_index)?.text ?? "", [source, candidate]);

  const updateChunk = (index: number, field: "meaning_zh" | "note", value: string) => {
    setChunks((current) => current.map((chunk, chunkIndex) => chunkIndex === index ? { ...chunk, [field]: value } : chunk));
  };

  const submit = async (action: CandidateReviewAction) => {
    if (!reason.trim()) {
      setMessage({ kind: "error", text: "请填写本次修改或审核理由。" });
      return;
    }
    setSaving(action);
    setMessage(null);
    try {
      const slots = JSON.parse(slotsJson);
      const exerciseSeed = JSON.parse(exerciseSeedJson);
      const response = await fetch(`/api/candidates/${candidate.candidate_id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          expectedRevision: candidate.card.content_revision,
          reason,
          fields: {
            translationZh,
            chunks,
            pattern: nullable(pattern),
            slots,
            grammarNote: nullable(grammarNote),
            usageNote: nullable(usageNote),
            simplifiedVersion: nullable(simplifiedVersion),
            transferExample: nullable(transferExample),
            exerciseSeed,
            uncertainties: uncertaintiesText.split("\n").map((item) => item.trim()).filter(Boolean),
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "审核提交失败。");
      setCandidate(payload.candidate);
      setReason("");
      setMessage({ kind: "success", text: action === "approve" ? "已批准并发布到正式学习卡。" : action === "save" ? "候选草稿已保存。" : action === "defer" ? "候选已暂缓。" : "候选已驳回。" });
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof SyntaxError ? "高级结构数据不是有效 JSON。" : error instanceof Error ? error.message : "审核提交失败。" });
    } finally {
      setSaving(null);
    }
  };

  const published = candidate.workflow_status === "approved";

  return <>
    <header className="candidate-editor-head">
      <div><span>候选审核</span><h1>{candidate.card.learning_sentence}</h1></div>
      <span className={`candidate-editor-status status-${candidate.workflow_status}`}>{statusLabels[candidate.workflow_status]}</span>
    </header>

    <div className="candidate-editor-layout">
      <form className="candidate-editor-form" onSubmit={(event) => event.preventDefault()}>
        <section className="candidate-form-section">
          <div className="candidate-section-title"><span>01</span><div><h2>核心内容</h2><p>原句与学习句保持只读，避免失去来源追踪。</p></div></div>
          <label><span>原句</span><textarea value={candidate.card.original_sentence} readOnly rows={3} /></label>
          <label><span>学习句</span><textarea value={candidate.card.learning_sentence} readOnly rows={3} /></label>
          <label><span>中文释义</span><textarea value={translationZh} onChange={(event) => setTranslationZh(event.target.value)} rows={3} /></label>
        </section>

        <section className="candidate-form-section">
          <div className="candidate-section-title"><span>02</span><div><h2>词块与说明</h2><p>词块英文保持来源定位；可调整中文义和使用边界。</p></div></div>
          <div className="candidate-chunk-editor">{chunks.map((chunk, index) => <div key={`${chunk.text}-${index}`}>
            <strong>{chunk.text}</strong>
            <input aria-label={`${chunk.text} 中文义`} value={chunk.meaning_zh} onChange={(event) => updateChunk(index, "meaning_zh", event.target.value)} />
            <input aria-label={`${chunk.text} 使用说明`} placeholder="使用说明，可留空" value={chunk.note} onChange={(event) => updateChunk(index, "note", event.target.value)} />
          </div>)}</div>
          <label><span>语法说明</span><textarea value={grammarNote} onChange={(event) => setGrammarNote(event.target.value)} rows={3} /></label>
          <label><span>使用提醒</span><textarea value={usageNote} onChange={(event) => setUsageNote(event.target.value)} rows={3} /></label>
        </section>

        <section className="candidate-form-section">
          <div className="candidate-section-title"><span>03</span><div><h2>结构与迁移</h2><p>高级结构数据保存时会经过完整 Schema 与一致性检查。</p></div></div>
          <label><span>结构骨架</span><textarea value={pattern} onChange={(event) => setPattern(event.target.value)} rows={3} /></label>
          <label><span>简化表达</span><textarea value={simplifiedVersion} onChange={(event) => setSimplifiedVersion(event.target.value)} rows={3} /></label>
          <label><span>迁移例句</span><textarea value={transferExample} onChange={(event) => setTransferExample(event.target.value)} rows={3} /></label>
          <details className="candidate-advanced"><summary>高级结构数据</summary>
            <label><span>Slots JSON</span><textarea className="code-field" value={slotsJson} onChange={(event) => setSlotsJson(event.target.value)} rows={12} /></label>
            <label><span>Exercise seed JSON</span><textarea className="code-field" value={exerciseSeedJson} onChange={(event) => setExerciseSeedJson(event.target.value)} rows={18} /></label>
          </details>
        </section>

        <section className="candidate-form-section">
          <div className="candidate-section-title"><span>04</span><div><h2>审核决定</h2><p>保存只更新候选草稿；批准才发布到正式学习卡。</p></div></div>
          <label><span>待确认事项</span><textarea value={uncertaintiesText} onChange={(event) => setUncertaintiesText(event.target.value)} rows={4} /></label>
          <label><span>本次理由</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="说明修改内容，或批准/暂缓/驳回的依据…" rows={3} /></label>
          {message ? <p className={`candidate-form-message ${message.kind}`}>{message.text}</p> : null}
          <div className="candidate-actions">
            <button className="button secondary" type="button" disabled={Boolean(saving)} onClick={() => submit("save")}>{saving === "save" ? <Loader2 className="spin" size={16} /> : <Save size={16} />} 保存草稿</button>
            <button className="button primary" type="button" disabled={Boolean(saving)} onClick={() => submit("approve")}>{saving === "approve" ? <Loader2 className="spin" size={16} /> : <Check size={16} />} 批准并发布</button>
            <button className="button candidate-defer" type="button" disabled={Boolean(saving) || published} onClick={() => submit("defer")}><Clock3 size={16} /> 暂缓</button>
            <button className="button candidate-reject" type="button" disabled={Boolean(saving) || published} onClick={() => submit("reject")}><X size={16} /> 驳回</button>
          </div>
        </section>
      </form>

      <aside className="candidate-preview-column">
        <section className="candidate-preview-card">
          <div className="candidate-preview-title"><Eye size={17} /><span>发布预览</span></div>
          <p className="candidate-preview-sentence">{candidate.card.learning_sentence}</p>
          <p className="candidate-preview-translation">{translationZh}</p>
          <div className="candidate-preview-chunks">{chunks.map((chunk) => <span key={chunk.text}>{chunk.text}<small>{chunk.meaning_zh}</small></span>)}</div>
          {pattern ? <code>{pattern}</code> : null}
        </section>
        <section className="candidate-source-card">
          <span>来源定位</span>
          <h2>{source?.title ?? "来源未找到"}</h2>
          <p>{source?.ielts_prompt}</p>
          <div><small>原文段落 {candidate.card.paragraph_index + 1}</small><p>{sourceParagraph}</p></div>
        </section>
        <section className="candidate-history-card">
          <span>审核记录</span>
          <ol>{[...candidate.review_history].reverse().map((item, index) => <li key={`${item.reviewed_at}-${index}`}><strong>{item.action}</strong><p>{item.reason}</p><small>{item.reviewer} · {new Date(item.reviewed_at).toLocaleString("zh-CN")}</small></li>)}</ol>
        </section>
      </aside>
    </div>
  </>;
}
