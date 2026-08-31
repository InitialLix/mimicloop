import { CollocationLibraryBrowser } from "../../../components/collocation-library-browser";
import { LibraryTabs } from "../../../components/library-tabs";
import { PageHeader } from "../../../components/page-header";
import { getLibraryData } from "../../../lib/app-data";

export const dynamic = "force-dynamic";

export default async function CollocationLibraryPage() {
  const { cards, collocations, sources, collocationProgress } = await getLibraryData();
  return <div className="page page-wide">
    <PageHeader
      eyebrow="COLLOCATION LIBRARY"
      title="搭配库"
      description={`${collocations.length} 条经过人工确认的搭配、固定短语和可迁移句型。每条都能回到范文原句。`}
    />
    <LibraryTabs active="collocations" cardCount={cards.length} collocationCount={collocations.length} essayCount={sources.length} />
    <CollocationLibraryBrowser collocations={collocations} sources={sources} progress={collocationProgress} nowIso={new Date().toISOString()} />
  </div>;
}
