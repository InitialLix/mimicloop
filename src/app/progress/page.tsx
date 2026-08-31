import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "../../components/page-header";
import { getProgressData } from "../../lib/app-data";
import { focusLabels, topicLabels } from "../../lib/labels";

export const dynamic = "force-dynamic";

const stageItems = [
  { key: "new", label: "未学习" },
  { key: "learned", label: "学习中" },
  { key: "recall", label: "回忆中" },
  { key: "use", label: "可运用" },
] as const;

const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const abilityLabels = {
  unknown: "暂无证据",
  weak: "需加强",
  developing: "发展中",
  stable: "较稳定",
} as const;

const learnerDimensions = [
  { key: "recall", label: "回忆", description: "不看答案时能否想起" },
  { key: "guidedUse", label: "按提示运用", description: "指定表达后能否写对" },
  { key: "transferUse", label: "换场景运用", description: "在新语境里能否迁移" },
  { key: "delayedRetention", label: "延时保留", description: "至少隔三天后仍能独立完成" },
] as const;

function activityLabel(dateKey: string, todayKey: string) {
  if (dateKey === todayKey) return "今天";
  const [year, month, day] = dateKey.split("-").map(Number);
  return weekdayLabels[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

function formatRecentTime(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function percentage(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

export default async function ProgressPage() {
  const progress = await getProgressData();
  const maxActivity = Math.max(1, ...progress.activity.map((item) => item.count));
  const coverage = percentage(progress.practicedCards, progress.totalCards);

  return (
    <div className="page page-progress">
      <PageHeader
        eyebrow="LEARNING PROGRESS"
        title="学习进度"
        description="根据已经保存的回忆与仿写记录，查看学过的句子和接下来的复习任务。"
        action={<Link className="button secondary" href="/today">继续今日学习 <ArrowRight size={16} /></Link>}
      />

      <section className="progress-overview" aria-label="学习概览">
        <div className="progress-coverage">
          <span>句子覆盖</span>
          <p><strong>{progress.practicedCards}</strong><small> / {progress.totalCards}</small></p>
          <div className="progress-meter" aria-label={`已开始学习 ${coverage}%`}><span style={{ width: `${coverage}%` }} /></div>
          <small>已开始学习 {coverage}% 的正式句子卡</small>
        </div>
        <div className="progress-overview-stages">
          <div className="progress-overview-stages-head">
            <span>学习阶段</span>
            <small>完成 Use 后进入后续复习阶段</small>
          </div>
          <div className="progress-stage-grid">
            {stageItems.map((item) => (
              <div key={item.key}>
                <span>{item.label}</span>
                <strong>{progress.stageCounts[item.key]}</strong>
                <small>{percentage(progress.stageCounts[item.key], progress.totalCards)}%</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="progress-section learner-profile" aria-labelledby="learner-profile-title">
        <div className="progress-section-head">
          <div><span>LEARNER MODEL · V1</span><h2 id="learner-profile-title">学习能力档案</h2></div>
          <p>根据已保存的正式作答证据重算，不是 AI 给出的分数，也不会改变今日任务或复习时间。</p>
        </div>
        {progress.learnerProfile.assessedAssets ? (
          <>
            <div className="learner-dimension-grid">
              {learnerDimensions.map((dimension) => {
                const counts = progress.learnerProfile.stateCounts[dimension.key];
                const assessedCount = counts.weak + counts.developing + counts.stable;
                return (
                  <article key={dimension.key}>
                    <span>{dimension.label}</span>
                    <strong>{assessedCount}</strong>
                    <small>已有正式作答证据 · {dimension.description}</small>
                    <p><b>{counts.stable}</b> 较稳定 · <b>{counts.developing}</b> 发展中 · <b>{counts.weak}</b> 需加强</p>
                  </article>
                );
              })}
            </div>
            <p className="learner-profile-note">
              上方大数字表示“已有该类证据”的学习项目；“需加强”也是已成功保存的记录，不等于没有进度。当前共读取 {progress.learnerProfile.evidenceCount} 条证据，覆盖 {progress.learnerProfile.assessedAssets} 个学习项目。自发运用目前没有可信采集场景，因此暂不判断。
            </p>
            <div className="learner-asset-list" aria-label="最近形成证据的学习项目">
              {progress.learnerProfile.recentAssets.map((asset) => (
                <Link href={asset.href} key={asset.assetId}>
                  <span className="learner-asset-copy"><strong>{asset.label}</strong><small>{asset.translation}</small></span>
                  <span className="learner-asset-states">
                    <i>回忆 {abilityLabels[asset.recall]}</i>
                    <i>提示运用 {abilityLabels[asset.guidedUse]}</i>
                    <i>迁移 {abilityLabels[asset.transferUse]}</i>
                    <i>延时 {abilityLabels[asset.delayedRetention]}</i>
                  </span>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="progress-empty"><p>完成一次 Recall 或 Use 后，这里会开始积累可解释的学习证据。</p></div>
        )}
      </section>

      <div className="progress-two-column">
        <section className="progress-panel" aria-labelledby="progress-activity-title">
          <div className="progress-section-head compact"><div><span>LAST 7 DAYS</span><h2 id="progress-activity-title">最近学习</h2></div></div>
          <div className="progress-activity" aria-label="最近七天完成句数">
            {progress.activity.map((item) => (
              <div key={item.dateKey} className={item.dateKey === progress.todayKey ? "today" : undefined}>
                <strong>{item.count}</strong>
                <span className="progress-activity-bar"><i style={{ height: item.count ? `${Math.max(14, (item.count / maxActivity) * 100)}%` : "2px" }} /></span>
                <small>{activityLabel(item.dateKey, progress.todayKey)}</small>
                <em>{item.dateKey.slice(5).replace("-", ".")}</em>
              </div>
            ))}
          </div>
        </section>

        <section className="progress-panel" aria-labelledby="progress-focus-title">
          <div className="progress-section-head compact"><div><span>TRAINING FOCUS</span><h2 id="progress-focus-title">训练类型</h2></div></div>
          <div className="progress-focus-list">
            {progress.focusStats.map((item) => (
              <div key={item.focus}>
                <span><strong>{focusLabels[item.focus]}</strong><small>{item.practiced} / {item.total}</small></span>
                <div className="progress-meter"><span style={{ width: `${percentage(item.practiced, item.total)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="progress-section" aria-labelledby="progress-topic-title">
        <div className="progress-section-head"><div><span>TOPIC COVERAGE</span><h2 id="progress-topic-title">主题覆盖</h2></div><p>这里显示已经接触过的句子数量，不把阅读或单次作答称为“掌握”。</p></div>
        <div className="progress-topic-grid">
          {progress.topicStats.map((item) => (
            <div key={item.topic}>
              <span><strong>{topicLabels[item.topic] ?? item.topic}</strong><small>{item.practiced} / {item.total}</small></span>
              <div className="progress-meter"><span style={{ width: `${percentage(item.practiced, item.total)}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="progress-section" aria-labelledby="progress-recent-title">
        <div className="progress-section-head"><div><span>RECENT SENTENCES</span><h2 id="progress-recent-title">最近练习的句子</h2></div><p>点击句子可以回到学习卡复习。</p></div>
        {progress.recentCards.length ? (
          <div className="progress-recent-list">
            {progress.recentCards.map((card, index) => (
              <Link href={`/library/${card.id}`} key={card.id}>
                <span className="progress-recent-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="progress-recent-copy"><strong>{card.learning_sentence}</strong><small>{card.translation_zh}</small></span>
                <span className="progress-recent-meta"><small>{focusLabels[card.primary_focus]}</small><time dateTime={card.completedAt}>{formatRecentTime(card.completedAt)}</time><ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="progress-empty"><p>还没有练习记录。</p><Link className="button primary" href="/today">开始今日学习 <ArrowRight size={16} /></Link></div>
        )}
      </section>
    </div>
  );
}
