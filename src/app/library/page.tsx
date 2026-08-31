import { PageHeader } from "../../components/page-header";
import { LibraryBrowser } from "../../components/library-browser";
import { LibraryTabs } from "../../components/library-tabs";
import { getLibraryData } from "../../lib/app-data";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const { cards, collocations, sources } = await getLibraryData();
  return (
    <div className="page page-wide">
      <PageHeader eyebrow="SENTENCE LIBRARY" title="语料库" description={`${cards.length} 张经过人工审核的句子卡。按表达价值选句，不按每篇固定配额。`} />
      <LibraryTabs active="sentences" cardCount={cards.length} collocationCount={collocations.length} essayCount={sources.length} />
      <LibraryBrowser cards={cards} sources={sources} />
    </div>
  );
}
