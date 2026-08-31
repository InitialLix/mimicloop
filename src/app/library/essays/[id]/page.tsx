import { Info } from "lucide-react";
import { notFound } from "next/navigation";
import { CopyPageLink } from "../../../../components/copy-page-link";
import { EssayInteractiveSentence } from "../../../../components/essay-interactive-sentence";
import { EssaySentenceLocator } from "../../../../components/essay-sentence-locator";
import { HistoryBackButton } from "../../../../components/history-back-button";
import { getLibraryData } from "../../../../lib/app-data";
import {
  buildCollocationHighlightRanges,
  buildSentenceCardMap,
  essaySentenceAnchor,
  essaySentenceTypeLabels,
  sentenceLocationKey,
  splitParagraphSentences,
} from "../../../../lib/essay-sentence-links";
import { focusLabels, isLanguageRichnessSource, sourceDisplayLabel, topicLabels } from "../../../../lib/labels";

export const dynamic = "force-dynamic";

export default async function EssayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cards, expressions, sources } = await getLibraryData();
  const source = sources.find((item) => item.id === id);
  if (!source) notFound();
  const sourceCards = cards.filter((card) => card.source_essay_id === source.id);
  const cardsByLocation = buildSentenceCardMap(sourceCards);
  const collocationsByLocation = new Map<string, Array<{
    collocationId: string;
    label: string;
    translation: string;
    learningMode: "recall_use" | "appreciation";
    surfaceForm: string;
    occurrenceIndex: number;
  }>>();
  const sourceCollocationIds = new Set<string>();
  for (const collocation of expressions) {
    for (const link of collocation.source_links.filter((item) => item.source_essay_id === source.id)) {
      sourceCollocationIds.add(collocation.id);
      const key = sentenceLocationKey(link.paragraph_index, link.sentence_index);
      const current = collocationsByLocation.get(key) ?? [];
      current.push({
        collocationId: collocation.id,
        label: collocation.canonical_text,
        translation: collocation.translation_prompt,
        learningMode: collocation.learning_mode,
        surfaceForm: link.surface_form,
        occurrenceIndex: link.occurrence_index,
      });
      collocationsByLocation.set(key, current);
    }
  }
  const sourceCoreCount = expressions.filter((item) => item.learning_mode === "recall_use" && sourceCollocationIds.has(item.id)).length;
  const sourceAppreciationCount = expressions.filter((item) => item.learning_mode === "appreciation" && sourceCollocationIds.has(item.id)).length;
  const isLanguageSource = isLanguageRichnessSource(source);
  return (
    <div className="page essay-page">
      <EssaySentenceLocator />
      <div className="essay-topbar"><HistoryBackButton /><CopyPageLink label="复制本页链接" /></div>
      <article className="essay-article">
        <header>
          <p className="eyebrow">{isLanguageSource ? source.source_name : "ACADEMIC IELTS WRITING TASK 2"}</p>
          <h1>{source.title}</h1>
          <div className="essay-meta"><span>{sourceDisplayLabel(source.answer_origin, source.author, source.source_name)}</span><span>{source.topics.map((topic) => topicLabels[topic] ?? topic).join(" · ")}</span><span>已收录 {sourceCards.length} 个好句 · {sourceCoreCount} 个 Core · {sourceAppreciationCount} 个欣赏表达</span></div>
        </header>
        {source.ielts_prompt ? <section className="essay-prompt"><span>作文题目</span><p>{source.ielts_prompt}</p></section> : null}
        {sourceCoreCount || sourceAppreciationCount ? <div className="essay-expression-legend" aria-label="原文表达标记说明">
          {sourceCoreCount ? <span><b className="legend-core">Core</b> 加粗，可点击进入 Recall → Use</span> : null}
          {sourceAppreciationCount ? <span><b className="legend-appreciation">Appreciation</b> 点状下划线，悬停或点按查看释义</span> : null}
        </div> : null}
        <section className="essay-body" aria-label="原文正文">
          {source.paragraphs.map((paragraph) => {
            const sentences = splitParagraphSentences(paragraph.text);

            return (
              <p key={paragraph.paragraph_index}>
                {sentences.map((sentence, sentenceIndex) => {
                  const card = cardsByLocation.get(sentenceLocationKey(paragraph.paragraph_index, sentenceIndex));
                  const sentenceCollocations = collocationsByLocation.get(sentenceLocationKey(paragraph.paragraph_index, sentenceIndex)) ?? [];
                  const collocationRanges = buildCollocationHighlightRanges(sentence, sentenceCollocations);

                  return (
                    <span className="essay-sentence" id={essaySentenceAnchor(paragraph.paragraph_index, sentenceIndex)} key={`${paragraph.paragraph_index}-${sentenceIndex}`}>
                      <EssayInteractiveSentence
                        sentence={sentence}
                        collocations={collocationRanges}
                        card={card ? {
                          href: `/library/${card.id}`,
                          ariaLabel: `打开${focusLabels[card.primary_focus]}学习卡：${sentence}`,
                          focus: card.primary_focus,
                          typeLabel: essaySentenceTypeLabels[card.primary_focus],
                        } : null}
                      />
                      {sentenceIndex < sentences.length - 1 ? " " : null}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </section>
        <div className="source-warning essay-warning essay-warning-end"><Info size={17} /><span>{isLanguageSource ? <><strong>《新概念英语 3》课文，不是 IELTS 范文。</strong>页面中的句子和表达仅用于英语学习。</> : <><strong>教师范文，不是 IELTS 官方评分样本。</strong>原始合集没有提供可核验的一手网页、实际 Band 或考官评语。</>}</span></div>
        <footer className="essay-source"><span>本地归档</span><code>{source.local_raw_file}</code></footer>
      </article>
    </div>
  );
}
