import Link from "next/link";

export function LibraryTabs({
  active,
  cardCount,
  collocationCount,
  essayCount,
}: {
  active: "sentences" | "collocations" | "essays";
  cardCount: number;
  collocationCount: number;
  essayCount: number;
}) {
  return (
    <nav className="library-tabs" aria-label="语料库内容类型">
      <Link className={active === "sentences" ? "active" : ""} href="/library">句子 <span>{cardCount}</span></Link>
      <Link className={active === "collocations" ? "active" : ""} href="/library/collocations">搭配 <span>{collocationCount}</span></Link>
      <Link className={active === "essays" ? "active" : ""} href="/library/essays">原文 <span>{essayCount}</span></Link>
    </nav>
  );
}
