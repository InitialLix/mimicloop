"use client";

import { Check, Clock3, Eye, GitMerge, Loader2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  CollocationData,
  CollocationReviewAction,
  SourceEssayData,
} from "../lib/content-types";

const statusLabels = {
  candidate: "待审核",
  needs_edit: "待修改",
  approved: "已收录",
  deferred: "暂缓",
  rejected: "已驳回",
  merged: "已合并",
  archived: "已归档",
} as const;

const nullable = (value: string) => value.trim() || null;
const lines = (value: string) => [...new Set(value.split("\n").map((item) => item.trim()).filter(Boolean))];

export function CollocationReviewEditor({
  candidate: initialCandidate,
  sources,
  mergeTargets,
}: {
  candidate: CollocationData;
  sources: SourceEssayData[];
  mergeTargets: CollocationData[];
}) {
  const router = useRouter();
  const [candidate, setCandidate] = useState(initialCandidate);
  const [canonicalText, setCanonicalText] = useState(candidate.canonical_text);
  const [translationPrompt, setTranslationPrompt] = useState(candidate.translation_prompt);
  const [pattern, setPattern] = useState(candidate.pattern ?? "");
  const [slotsJson, setSlotsJson] = useState(JSON.stringify(candidate.slots, null, 2));
  const [expressionType, setExpressionType] = useState(candidate.expression_type);
  const [grammarPattern, setGrammarPattern] = useState(candidate.grammar_pattern ?? "");
  const [usageNote, setUsageNote] = useState(candidate.usage_note ?? "");
  const [commonError, setCommonError] = useState(candidate.common_error ?? "");
  const [acceptedAnswers, setAcceptedAnswers] = useState(candidate.accepted_answers.join("\n"));
  const [topics, setTopics] = useState(candidate.topics.join("\n"));
  const [argumentFunctions, setArgumentFunctions] = useState(candidate.argument_functions.join("\n"));
  const [uncertainties, setUncertainties] = useState(candidate.uncertainties.join("\n"));
  const [reason, setReason] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [saving, setSaving] = useState<CollocationReviewAction | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const submit = async (action: CollocationReviewAction) => {
    if (!reason.trim()) {
      setMessage({ kind: "error", text: "请填写本次审核理由。" });
      return;
    }
    setSaving(action);
    setMessage(null);
    try {
      const slots = JSON.parse(slotsJson);
      const response = await fetch(`/api/collocations/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          expectedRevision: candidate.content_revision,
          reason,
          mergeTargetId: mergeTargetId || null,
          fields: {
            canonicalText,
            translationPrompt,
            pattern: nullable(pattern),
            slots,
            expressionType,
            grammarPattern: nullable(grammarPattern),
            usageNote: nullable(usageNote),
            commonError: nullable(commonError),
            acceptedAnswers: lines(acceptedAnswers),
            topics: lines(topics),
            argumentFunctions: lines(argumentFunctions),
            uncertainties: lines(uncertainties),
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "审核提交失败。");
      setCandidate(payload.candidate);
      setReason("");
      const successText = action === "approve"
        ? "已批准并写入正式搭配库。"
        : action === "save"
          ? "候选修改已保存。"
          : action === "defer"
            ? "候选已暂缓。"
            : action === "merge"
              ? "候选已合并到目标搭配。"
              : "候选已驳回。";
      setMessage({ kind: "success", text: successText });
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof SyntaxError
          ? "Slots 不是有效 JSON。"
          : error instanceof Error ? error.message : "审核提交失败。",
      });
    } finally {
      setSaving(null);
    }
  };

  const published = candidate.workflow_status === "approved";
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  return <>
    <header className="candidate-editor-head">
      <div><span>COLLOCATION REVIEW</span><h1>{candidate.canonical_text}</h1></div>
      <span className={`candidate-editor-status status-${candidate.workflow_status}`}>{statusLabels[candidate.workflow_status]}</span>
    </header>

    <div className="candidate-editor-layout">
      <form className="candidate-editor-form" onSubmit={(event) => event.preventDefault()}>
        <section className="candidate-form-section">
          <div className="candidate-section-title"><span>01</span><div><h2>学习内容</h2></div></div>
          <label><span>英文搭配</span><input value={canonicalText} onChange={(event) => setCanonicalText(event.target.value)} /></label>
          <label><span>中文提示</span><input value={translationPrompt} onChange={(event) => setTranslationPrompt(event.target.value)} /></label>
          <label><span>表达类型</span>
            <select value={expressionType} onChange={(event) => setExpressionType(event.target.value as CollocationData["expression_type"])}>
              <option value="collocation">搭配</option>
              <option value="fixed_phrase">固定短语</option>
              <option value="sentence_frame">句型</option>
            </select>
          </label>
          <label><span>可接受答案（每行一个）</span><textarea value={acceptedAnswers} onChange={(event) => setAcceptedAnswers(event.target.value)} rows={4} /></label>
        </section>

        <section className="candidate-form-section">
          <div className="candidate-section-title"><span>02</span><div><h2>结构与边界</h2></div></div>
          <label><span>可替换骨架</span><textarea value={pattern} onChange={(event) => setPattern(event.target.value)} rows={3} /></label>
          <label><span>语法结构</span><textarea value={grammarPattern} onChange={(event) => setGrammarPattern(event.target.value)} rows={2} /></label>
          <label><span>使用提醒</span><textarea value={usageNote} onChange={(event) => setUsageNote(event.target.value)} rows={3} /></label>
          <label><span>常见错误</span><textarea value={commonError} onChange={(event) => setCommonError(event.target.value)} rows={3} /></label>
          <details className="candidate-advanced"><summary>Slots 数据</summary>
            <label><span>Slots JSON</span><textarea className="code-field" value={slotsJson} onChange={(event) => setSlotsJson(event.target.value)} rows={12} /></label>
          </details>
        </section>

        <section className="candidate-form-section">
          <div className="candidate-section-title"><span>03</span><div><h2>分类</h2></div></div>
          <label><span>主题（每行一个）</span><textarea value={topics} onChange={(event) => setTopics(event.target.value)} rows={4} /></label>
          <label><span>论证功能（每行一个）</span><textarea value={argumentFunctions} onChange={(event) => setArgumentFunctions(event.target.value)} rows={3} /></label>
          <label><span>待确认项（每行一个）</span><textarea value={uncertainties} onChange={(event) => setUncertainties(event.target.value)} rows={3} /></label>
        </section>

        <section className="candidate-form-section">
          <div className="candidate-section-title"><span>04</span><div><h2>审核决定</h2></div></div>
          <label><span>审核理由</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} /></label>
          <label><span>合并到</span>
            <select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)} disabled={published || mergeTargets.length === 0}>
              <option value="">选择已批准搭配</option>
              {mergeTargets.map((item) => <option value={item.id} key={item.id}>{item.canonical_text}</option>)}
            </select>
          </label>
          {message ? <p className={`candidate-form-message ${message.kind}`}>{message.text}</p> : null}
          <div className="candidate-actions">
            <button className="button secondary" type="button" disabled={Boolean(saving) || published} onClick={() => submit("save")}>
              {saving === "save" ? <Loader2 className="spin" size={16} /> : <Save size={16} />} 保存修改
            </button>
            <button className="button primary" type="button" disabled={Boolean(saving)} onClick={() => submit("approve")}>
              {saving === "approve" ? <Loader2 className="spin" size={16} /> : <Check size={16} />} 批准并发布
            </button>
            <button className="button candidate-defer" type="button" disabled={Boolean(saving) || published} onClick={() => submit("defer")}><Clock3 size={16} /> 暂缓</button>
            <button className="button candidate-reject" type="button" disabled={Boolean(saving) || published} onClick={() => submit("reject")}><X size={16} /> 驳回</button>
            <button className="button quiet" type="button" disabled={Boolean(saving) || published || !mergeTargetId} onClick={() => submit("merge")}><GitMerge size={16} /> 合并</button>
          </div>
        </section>
      </form>

      <aside className="candidate-preview-column">
        <section className="candidate-preview-card collocation-preview-card">
          <div className="candidate-preview-title"><Eye size={17} /><span>正式条目预览</span></div>
          <p className="candidate-preview-sentence">{canonicalText}</p>
          <p className="candidate-preview-translation">{translationPrompt}</p>
          {pattern ? <code>{pattern}</code> : null}
          <div className="collocation-score-row">
            <span>自然度 {candidate.selection_scores.naturalness}</span>
            <span>回忆价值 {candidate.selection_scores.active_recall_value}</span>
            <span>迁移价值 {candidate.selection_scores.transfer_value}</span>
          </div>
        </section>

        <section className="candidate-source-card collocation-source-card">
          <span>来源定位 · {candidate.source_links.length}</span>
          {candidate.source_links.map((link, index) => {
            const source = sourceById.get(link.source_essay_id);
            return <div key={`${link.source_essay_id}-${link.paragraph_index}-${link.sentence_index}-${link.occurrence_index}`}>
              <small>{index === 0 ? "主要来源" : "补充来源"} · {link.card_id ? "关联句子卡" : "普通正文句"}</small>
              <h2>{source?.title ?? link.source_essay_id}</h2>
              <p>{link.sentence_text}</p>
            </div>;
          })}
        </section>

        <section className="candidate-history-card">
          <span>审核记录</span>
          <ol>{[...candidate.review_history].reverse().map((item, index) => <li key={`${item.reviewed_at}-${index}`}>
            <strong>{item.action}</strong><p>{item.reason}</p><small>{item.reviewer} · {new Date(item.reviewed_at).toLocaleString("zh-CN")}</small>
          </li>)}</ol>
        </section>
      </aside>
    </div>
  </>;
}
