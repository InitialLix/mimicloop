"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { House, Library, PenLine, Settings, Sparkles, TrendingUp } from "lucide-react";

const navigation = [
  { href: "/", label: "首页", icon: House },
  { href: "/today", label: "今日学习", icon: Sparkles },
  { href: "/writing", label: "写作练习", icon: PenLine },
  { href: "/library", label: "语料库", icon: Library },
  { href: "/progress", label: "学习进度", icon: TrendingUp },
  { href: "/settings", label: "设置", icon: Settings },
];

export function AppSidebar({ competitionMode = false }: { competitionMode?: boolean }) {
  const pathname = usePathname();
  const visibleNavigation = competitionMode
    ? navigation.filter((item) => item.href !== "/settings")
    : navigation;
  return (
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="MimicLoop 首页">
        <span className="brand-mark brand-mark-logo" aria-hidden="true"><Image className="brand-mark-image" src="/mimicloop-logo.png" alt="" width={64} height={64} priority /></span>
        <span>
          <strong>MimicLoop</strong>
          <small>IELTS 写作句子训练</small>
        </span>
      </Link>
      <nav className="sidebar-nav" aria-label="主要导航">
        {visibleNavigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={active ? "nav-item active" : "nav-item"} aria-current={active ? "page" : undefined}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <span className="status-dot" />
        <span>{competitionMode ? "评审体验 · 独立进度" : "本地模式 · 无需 API"}</span>
      </div>
    </aside>
  );
}
