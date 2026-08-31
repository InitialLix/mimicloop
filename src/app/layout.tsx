import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "../components/app-sidebar";
import { isCompetitionMode } from "../lib/competition-mode";

export const metadata: Metadata = {
  title: "MimicLoop — 把好句变成自己的表达",
  description: "Academic IELTS Writing Task 2 句子模仿与迁移训练工具",
  robots: isCompetitionMode()
    ? { index: false, follow: false, nocache: true }
    : undefined,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <AppSidebar competitionMode={isCompetitionMode()} />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
