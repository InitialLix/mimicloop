import { Database, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "../../components/page-header";
import { isCompetitionMode } from "../../lib/competition-mode";

export default function SettingsPage() {
  if (isCompetitionMode()) notFound();
  return <div className="page"><PageHeader eyebrow="LOCAL FIRST" title="设置" description="所有语料与学习记录只保存在这台电脑。" /><div className="settings-list"><div><Database size={20} /><span><strong>本地数据库</strong><small>data/mimicloop.db</small></span><em>已连接</em></div><div><ShieldCheck size={20} /><span><strong>内容边界</strong><small>候选卡必须人工批准后才能进入正式库</small></span><em>已启用</em></div></div></div>;
}
