import { EssayLibraryBrowser } from "../../../components/essay-library-browser";
import { LibraryTabs } from "../../../components/library-tabs";
import { PageHeader } from "../../../components/page-header";
import { getLibraryData } from "../../../lib/app-data";
import { buildEssaySummaries } from "../../../lib/essay-summaries";
import { sourceDisplayLabel } from "../../../lib/labels";

export const dynamic = "force-dynamic";

export default async function EssayLibraryPage({ searchParams }: { searchParams: Promise<{ topic?: string; source?: string }> }) {
  const { cards, collocations, sources } = await getLibraryData();
  const essays = buildEssaySummaries(sources, cards, sourceDisplayLabel);
  const requested = await searchParams;
  const requestedTopic = requested.topic ?? "all";
  const requestedSource = requested.source ?? "all";
  const validTopics = new Set(essays.flatMap((essay) => essay.topics));
  const validSources = new Set(essays.map((essay) => essay.sourceLabel));
  const initialTopic = requestedTopic === "all" || validTopics.has(requestedTopic) ? requestedTopic : "all";
  const initialSource = requestedSource === "all" || validSources.has(requestedSource) ? requestedSource : "all";
  return (
    <div className="page page-wide">
      <PageHeader eyebrow="SOURCE TEXTS" title="原文阅读" description="查看 IELTS 范文与其他英语原文，并按主题和来源筛选。" />
      <LibraryTabs active="essays" cardCount={cards.length} collocationCount={collocations.length} essayCount={sources.length} />
      <EssayLibraryBrowser essays={essays} initialTopic={initialTopic} initialSource={initialSource} />
    </div>
  );
}
