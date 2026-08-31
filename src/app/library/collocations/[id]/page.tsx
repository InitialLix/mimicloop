import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, Layers3 } from "lucide-react";
import { notFound } from "next/navigation";
import { HighlightedText } from "../../../../components/highlighted-text";
import { HistoryBackButton } from "../../../../components/history-back-button";
import { CollocationLearnAction } from "../../../../components/collocation-learn-action";
import { getLibraryData } from "../../../../lib/app-data";
import { buildCollocationVariations } from "../../../../lib/collocation-transfer";
import { essaySentenceHref } from "../../../../lib/essay-sentence-links";
import { collocationTypeLabels, functionLabels, sourceDisplayLabel, topicLabels } from "../../../../lib/labels";
import { collocationTaskKey } from "../../../../domain/review/study-navigation";

export const dynamic = "force-dynamic";

export default async function CollocationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queue?: string; index?: string }>;
}) {
  const { id } = await params;
  const flow = await searchParams;
  const { collocations, sources, collocationProgress } = await getLibraryData();
  const collocation = collocations.find((item) => item.id === id);
  if (!collocation) notFound();
  const progress = collocationProgress.find((item) => item.collocationId === id);
  const queue = flow.queue?.split(",") ?? [];
  const index = Number(flow.index ?? -1);
  const inTodayFlow = queue[index] === collocationTaskKey(id);
  const query = inTodayFlow ? `?queue=${encodeURIComponent(queue.join(","))}&index=${index}` : "";
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const variations = buildCollocationVariations(collocation);
  const notes = [
    collocation.grammar_pattern ? { label: "语法结构", content: collocation.grammar_pattern } : null,
    collocation.usage_note ? { label: "使用提醒", content: collocation.usage_note } : null,
    collocation.common_error ? { label: "常见错误", content: collocation.common_error } : null,
  ].filter((item): item is { label: string; content: string } => item !== null);

  return <div className="page collocation-detail-page">
    {inTodayFlow
      ? <Link className="back-link" href="/today"><ArrowLeft size={16} /> 返回今日学习</Link>
      : <HistoryBackButton fallbackHref="/library/collocations" />}
    <article className="collocation-detail">
      <header className="collocation-detail-head">
        <div className="collocation-detail-kicker"><Layers3 size={16} /> {collocationTypeLabels[collocation.expression_type]}</div>
        <h1>{collocation.canonical_text}</h1>
        <p>{collocation.translation_prompt}</p>
        <div className="collocation-detail-meta">
          {collocation.topics.map((topic) => <span key={topic}>{topicLabels[topic] ?? topic}</span>)}
          {collocation.argument_functions.map((item) => <span key={item}>{functionLabels[item] ?? item}</span>)}
        </div>
        <CollocationLearnAction
          collocationId={collocation.id}
          learningStage={progress?.learningStage ?? "new"}
          recallHref={`/practice/collocations/${collocation.id}/recall${query}`}
        />
      </header>

      {variations.length || notes.length ? <section className="collocation-detail-learning">
        {variations.length ? <div className="collocation-variation-panel">
          <span>搭配变化</span>
          <ul>{variations.map((variation) => <li key={variation}>{variation}</li>)}</ul>
        </div> : null}
        {notes.length ? <div className="collocation-note-grid">
          {notes.map((note) => <div key={note.label}><span>{note.label}</span><p>{note.content}</p></div>)}
        </div> : null}
      </section> : null}

      <section className="collocation-source-section">
        <div className="collocation-section-head"><div><BookOpen size={18} /><h2>范文语境</h2></div><span>{collocation.source_links.length} 处</span></div>
        <div className="collocation-context-list">
          {collocation.source_links.map((link) => {
            const source = sourceMap.get(link.source_essay_id);
            if (!source) return null;
            const essayHref = essaySentenceHref(source.id, link.paragraph_index, link.sentence_index);
            return <article className="collocation-context" key={`${link.source_essay_id}-${link.paragraph_index}-${link.sentence_index}-${link.occurrence_index}`}>
              <div className="collocation-context-meta">
                <span>{link.role === "primary" ? "主要来源" : "补充来源"}</span>
                <span>{sourceDisplayLabel(source.answer_origin, source.author, source.source_name)}</span>
              </div>
              <h3>{source.title}</h3>
              <p className="collocation-context-prompt">{source.ielts_prompt}</p>
              <blockquote><HighlightedText text={link.sentence_text} query={link.surface_form} /></blockquote>
              <div className="collocation-context-actions">
                <Link href={essayHref}>回到范文原句 <ArrowUpRight size={15} /></Link>
                {link.card_id ? <Link href={`/library/${link.card_id}`}>打开句子学习卡 <ArrowUpRight size={15} /></Link> : null}
              </div>
            </article>;
          })}
        </div>
      </section>
    </article>
  </div>;
}
