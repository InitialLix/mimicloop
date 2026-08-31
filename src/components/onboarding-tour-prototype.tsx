"use client";

import {
  ArrowLeft, ArrowRight, BookOpen, Check, Eye, FilePlus2, Highlighter, Home,
  Languages, Layers3, LibraryBig, MousePointer2, Pause, PenLine, Play,
  RotateCcw, Search, Sparkles, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type TourPage = 1 | 2 | 3 | 4 | 5 | 6;

const tourLabels: Record<TourPage, string> = {
  1: "开始", 2: "原文阅读", 3: "句子学习", 4: "回忆与运用", 5: "搜索定位", 6: "写作练习",
};

function nextPage(page: TourPage): TourPage {
  return Math.min(6, page + 1) as TourPage;
}

function previousPage(page: TourPage): TourPage {
  return Math.max(1, page - 1) as TourPage;
}

export function OnboardingTourPrototype() {
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [activePage, setActivePage] = useState<TourPage>(1);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") showPage(nextPage(activePage));
      if (event.key === "ArrowLeft") showPage(previousPage(activePage));
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, activePage]);

  function replay() {
    setPaused(false);
    setReplayKey((current) => current + 1);
  }

  function showPage(page: TourPage) {
    setPaused(false);
    setActivePage(page);
    setReplayKey((current) => current + 1);
  }

  function openTour() {
    setActivePage(1);
    setPaused(false);
    setReplayKey((current) => current + 1);
    setOpen(true);
  }

  return (
    <>
      <button className="tour-trigger" type="button" onClick={openTour}>
        <Play size={13} fill="currentColor" aria-hidden="true" /> 使用导览
      </button>

      {open ? (
        <div className="tour-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section
            className={`tour-dialog${paused ? " is-paused" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
            aria-describedby="tour-description"
          >
            <header className="tour-dialog-head">
              <span className="tour-dialog-brand"><Layers3 size={16} aria-hidden="true" /> MimicLoop 使用导览</span>
              <div className="tour-dialog-controls">
                <button type="button" onClick={() => setPaused((current) => !current)} aria-label={paused ? "继续动画" : "暂停动画"}>
                  {paused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                </button>
                <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} aria-label="关闭使用导览"><X size={18} /></button>
              </div>
            </header>

            {activePage === 1 ? <StartTourPage replayKey={replayKey} /> : null}
            {activePage === 2 ? <ReadingTourPage replayKey={replayKey} /> : null}
            {activePage === 3 ? <SentenceTourPage replayKey={replayKey} /> : null}
            {activePage === 4 ? <PracticeTourPage replayKey={replayKey} /> : null}
            {activePage === 5 ? <SearchTourPage replayKey={replayKey} /> : null}
            {activePage === 6 ? <WritingTourPage replayKey={replayKey} /> : null}

            <footer className="tour-dialog-footer">
              <div className="tour-progress" aria-label={`完整导览共六页，当前第${activePage}页`}>
                {([1, 2, 3, 4, 5, 6] as TourPage[]).map((page) => (
                  <button
                    key={page}
                    className={activePage === page ? "active" : ""}
                    type="button"
                    aria-label={`查看第${page}页：${tourLabels[page]}`}
                    aria-current={activePage === page ? "step" : undefined}
                    onClick={() => showPage(page)}
                  />
                ))}
                <small>{String(activePage).padStart(2, "0")} / 06</small>
              </div>
              <div className="tour-footer-actions">
                <button className="tour-replay" type="button" onClick={replay}><RotateCcw size={15} /> 重新播放</button>
                {activePage > 1 ? <button className="tour-page-back" type="button" onClick={() => showPage(previousPage(activePage))}><ArrowLeft size={15} /> 上一页</button> : null}
                {activePage < 6
                  ? <button className="tour-page-next" type="button" onClick={() => showPage(nextPage(activePage))}>下一页 <ArrowRight size={15} /></button>
                  : <button className="tour-page-next" type="button" onClick={() => setOpen(false)}>完成导览 <Check size={15} /></button>}
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

function StartTourPage({ replayKey }: { replayKey: number }) {
  return (
    <div className="tour-dialog-main">
      <div className="tour-copy">
        <span className="tour-step-label">01 / 06 · 开始</span>
        <h2 id="tour-title">先选一条，现在最想走的学习路径</h2>
        <p id="tour-description">首页的三个入口彼此独立，不必按照固定顺序使用。</p>
        <div className="tour-key-list">
          <div><span className="tour-key-icon"><Sparkles size={16} /></span><span><strong>今日学习</strong><small>新内容与到期复习放在同一天</small></span></div>
          <div><span className="tour-key-icon"><LibraryBig size={16} /></span><span><strong>原文阅读</strong><small>从文章语境进入句子和搭配</small></span></div>
          <div><span className="tour-key-icon"><PenLine size={16} /></span><span><strong>写作练习</strong><small>带着一道 Task 2 题逐步完成文章</small></span></div>
        </div>
        <p className="tour-copy-note"><MousePointer2 size={14} aria-hidden="true" /> 右侧依次展示首页的三个主要入口。</p>
      </div>
      <div className="tour-demo-shell" key={`start-${replayKey}`}>
        <div className="tour-demo-windowbar"><span><i /><i /><i /></span><small><Home size={12} aria-hidden="true" /> 首页</small><em>自动演示</em></div>
        <div className="tour-demo-stage tour-start-stage">
          <div className="tour-start-board">
            <header><small>IELTS WRITING · LEARN BY MIMICRY</small><strong>今天想从哪里开始？</strong></header>
            <div className="tour-start-card tour-start-study"><span><Sparkles size={17} /></span><div><small>TODAY</small><strong>开始今日学习</strong><p>5 个新内容 · 4 个到期复习</p></div><ArrowRight size={15} /><MousePointer2 className="tour-start-card-cursor" size={25} fill="#fff" aria-hidden="true" /></div>
            <div className="tour-start-card tour-start-reading"><span><BookOpen size={17} /></span><div><small>SOURCE TEXTS</small><strong>阅读完整原文</strong><p>按主题与来源筛选</p></div><ArrowRight size={15} /><MousePointer2 className="tour-start-card-cursor" size={25} fill="#fff" aria-hidden="true" /></div>
            <div className="tour-start-card tour-start-writing"><span><PenLine size={17} /></span><div><small>GUIDED WRITING</small><strong>进入写作练习</strong><p>选择或导入一道题目</p></div><ArrowRight size={15} /><MousePointer2 className="tour-start-card-cursor" size={25} fill="#fff" aria-hidden="true" /></div>
          </div>
          <div className="tour-start-reduced-note">今日学习、原文阅读和写作练习可以独立进入。</div>
        </div>
      </div>
    </div>
  );
}

function ReadingTourPage({ replayKey }: { replayKey: number }) {
  return (
    <div className="tour-dialog-main">
      <div className="tour-copy">
        <span className="tour-step-label">02 / 06 · 原文阅读</span>
        <h2 id="tour-title">看懂原文里的三种标记</h2>
        <p id="tour-description">同一篇文章里，不同标记对应不同的学习动作。</p>
        <div className="tour-key-list">
          <div><span className="tour-key-swatch sentence" aria-hidden="true" /><span><strong>荧光句子</strong><small>点击进入完整句子卡</small></span></div>
          <div><span className="tour-key-swatch core" aria-hidden="true">Aa</span><span><strong>Core</strong><small>加粗，可进入 Recall → Use</small></span></div>
          <div><span className="tour-key-swatch appreciation" aria-hidden="true">Aa</span><span><strong>Appreciation</strong><small>点按查看释义，了解即可</small></span></div>
        </div>
        <p className="tour-copy-note"><MousePointer2 size={14} aria-hidden="true" /> 右侧自动演示 Core 与 Appreciation 的区别。</p>
      </div>
      <div className="tour-demo-shell" key={`reading-${replayKey}`}>
        <div className="tour-demo-windowbar"><span><i /><i /><i /></span><small><BookOpen size={12} aria-hidden="true" /> 原文阅读</small><em>自动演示</em></div>
        <div className="tour-demo-stage">
          <div className="tour-demo-paper">
            <span className="tour-demo-source">新概念英语 3</span><h3>Illusions of Pastoral Peace</h3>
            <p>Most of my friends live in the city, yet they always <span className="tour-appreciation-token"><span className="tour-appreciation-target">go into raptures<span className="tour-appreciation-tooltip" aria-hidden="true">一提到……便赞叹不已</span><MousePointer2 className="tour-target-cursor tour-appreciation-cursor" size={25} fill="#fff" aria-hidden="true" /></span> at the mere mention of the country</span>.</p>
            <p>Even he still <span className="tour-core-token">lives under the illusion that<span className="tour-core-tooltip" aria-hidden="true">查看 Core：live under the illusion that</span><span className="tour-click-ring" aria-hidden="true" /><MousePointer2 className="tour-target-cursor tour-core-cursor" size={25} fill="#fff" aria-hidden="true" /></span> country life is somehow superior to town life.</p>
            <p className="tour-highlight-sentence"><b>STRUCTURE SENTENCE</b> This idyllic pastoral scene is only part of the picture.</p>
          </div>
          <aside className="tour-detail-peek" aria-label="Core 学习卡演示"><span>CORE · 固定表达</span><h4>live under the illusion that</h4><p>误以为……；错误地相信……</p><div><b>Recall</b><i /><b>Use</b></div><button type="button" tabIndex={-1}>进入学习卡</button></aside>
          <div className="tour-reduced-motion-note">Core 可进入学习；Appreciation 只显示释义。</div>
        </div>
      </div>
    </div>
  );
}

function SentenceTourPage({ replayKey }: { replayKey: number }) {
  return (
    <div className="tour-dialog-main">
      <div className="tour-copy">
        <span className="tour-step-label">03 / 06 · 句子学习</span>
        <h2 id="tour-title">先理解整句，再抓住真正值得学的部分</h2>
        <p id="tour-description">学习卡围绕一句话展开，不要求把所有内容一次背完。</p>
        <div className="tour-key-list">
          <div><span className="tour-key-icon"><Eye size={16} /></span><span><strong>先读英文</strong><small>中文默认隐藏，需要时再展开</small></span></div>
          <div><span className="tour-key-icon"><Languages size={16} /></span><span><strong>查看短释义</strong><small>只解释当前句中值得注意的词块</small></span></div>
          <div><span className="tour-key-icon"><Layers3 size={16} /></span><span><strong>提取可复用骨架</strong><small>保留逻辑，替换具体内容</small></span></div>
        </div>
        <p className="tour-copy-note"><MousePointer2 size={14} aria-hidden="true" /> 右侧先展开中文，再把注意力移到句子骨架。</p>
      </div>
      <div className="tour-demo-shell" key={`sentence-${replayKey}`}>
        <div className="tour-demo-windowbar"><span><i /><i /><i /></span><small><Highlighter size={12} aria-hidden="true" /> 句子学习</small><em>自动演示</em></div>
        <div className="tour-demo-stage tour-sentence-stage">
          <article className="tour-sentence-card">
            <small>STRUCTURE · EXPLAINING A CAUSE</small>
            <p>The rise in obesity has also been <span>linked in part to</span> the sedentary lifestyle and lack of exercise.</p>
            <button type="button" tabIndex={-1}><Eye size={13} /> 显示中文释义<MousePointer2 className="tour-sentence-cursor" size={25} fill="#fff" aria-hidden="true" /></button>
            <div className="tour-sentence-translation">肥胖率的上升，也在一定程度上与久坐的生活方式和缺乏锻炼有关。</div>
          </article>
          <section className="tour-sentence-frame"><small>可复用骨架</small><p>_____ has also been <b>linked in part to</b> _____.</p><span>保留关联强度，不把它写成绝对因果。</span></section>
          <div className="tour-sentence-reduced-note">中文可按需展开；学习重点是词块和可迁移结构。</div>
        </div>
      </div>
    </div>
  );
}

function PracticeTourPage({ replayKey }: { replayKey: number }) {
  return (
    <div className="tour-dialog-main">
      <div className="tour-copy">
        <span className="tour-step-label">04 / 06 · 回忆与运用</span>
        <h2 id="tour-title">写出来以后，让 DeepSeek 帮你检查</h2>
        <p id="tour-description">先回忆，再换场景写；开启 AI 反馈后，DeepSeek 会检查这句话是否自然、准确。</p>
        <div className="tour-key-list">
          <div><span className="tour-writing-number">01</span><span><strong>Recall</strong><small>先自己回忆，再查看答案</small></span></div>
          <div><span className="tour-writing-number">02</span><span><strong>Use</strong><small>根据中文提示换场景仿写</small></span></div>
          <div><span className="tour-writing-number">03</span><span><strong>DeepSeek 批改</strong><small>指出是否通过，或给一条优先修改建议</small></span></div>
        </div>
        <p className="tour-copy-note"><MousePointer2 size={14} aria-hidden="true" /> 右侧依次演示 Recall、Use 和一次 DeepSeek 反馈。</p>
      </div>
      <div className="tour-demo-shell" key={`practice-${replayKey}`}>
        <div className="tour-demo-windowbar"><span><i /><i /><i /></span><small><RotateCcw size={12} aria-hidden="true" /> Recall → Use → Feedback</small><em>自动演示</em></div>
        <div className="tour-demo-stage tour-practice-stage">
          <div className="tour-practice-track"><span className="recall">RECALL</span><i /><span className="use">USE</span><i /><span className="feedback">DEEPSEEK</span></div>
          <section className="tour-practice-card tour-practice-recall"><small>RECALL · 02 / 03</small><h3>回忆目标表达</h3><p>“与……在一定程度上有关”</p><div className="tour-practice-answer"><span>linked</span><span>in</span><span>part</span><span>to</span></div><button type="button" tabIndex={-1}>查看答案</button></section>
          <section className="tour-practice-card tour-practice-use"><small>USE · 03 / 03</small><h3>换一个场景写出来</h3><blockquote>城市空气质量的下降，在一定程度上与交通量增加有关。</blockquote><div className="tour-practice-writing">The decline in urban air quality has been linked in part to heavier traffic.</div><button className="tour-practice-check" type="button" tabIndex={-1}>检查我的句子<MousePointer2 className="tour-practice-ai-cursor" size={25} fill="#fff" aria-hidden="true" /></button></section>
          <section className="tour-practice-card tour-practice-feedback">
            <div className="tour-practice-provider"><Sparkles size={12} /><span>AI 反馈 · <b>DeepSeek</b></span></div>
            <div className="tour-practice-feedback-head"><Check size={16} /><strong>这句话可以通过</strong><span>意思准确</span></div>
            <p><b>做对了</b>正确使用了 “linked in part to”，表达的关联强度和整体搭配都很自然。</p>
            <div className="tour-practice-feedback-action"><span>你可以直接自评，也可以尝试另一种写法再检查。</span><button type="button" tabIndex={-1}>尝试其他写法</button></div>
          </section>
          <div className="tour-practice-reduced-note">Use 写完后可由 DeepSeek 检查；不可用时仍保留答案与参考答案流程。</div>
        </div>
      </div>
    </div>
  );
}

function SearchTourPage({ replayKey }: { replayKey: number }) {
  return (
    <div className="tour-dialog-main">
      <div className="tour-copy">
        <span className="tour-step-label">05 / 06 · 搜索定位</span>
        <h2 id="tour-title">搜到一句话，也能一路找回它的原文语境</h2>
        <p id="tour-description">句子和搭配都支持中英文搜索，不需要记住它们来自哪一篇文章。</p>
        <div className="tour-key-list">
          <div><span className="tour-key-icon"><Search size={16} /></span><span><strong>中英文都能搜</strong><small>搜索完整表达或其中一部分</small></span></div>
          <div><span className="tour-key-icon"><Highlighter size={16} /></span><span><strong>结果强调命中位置</strong><small>英文词形和中文释义都会标出</small></span></div>
          <div><span className="tour-key-icon"><BookOpen size={16} /></span><span><strong>定位回原文</strong><small>目标句会短暂闪烁，避免重新寻找</small></span></div>
        </div>
        <p className="tour-copy-note"><MousePointer2 size={14} aria-hidden="true" /> 右侧从搜索结果跳回文章，并闪烁目标句。</p>
      </div>
      <div className="tour-demo-shell" key={`search-${replayKey}`}>
        <div className="tour-demo-windowbar"><span><i /><i /><i /></span><small><Search size={12} aria-hidden="true" /> 搜索与定位</small><em>自动演示</em></div>
        <div className="tour-demo-stage tour-search-stage">
          <section className="tour-search-panel">
            <header><small>SENTENCE LIBRARY</small><strong>搜索句子</strong></header>
            <div className="tour-search-box"><Search size={14} /><span>linked in part to</span><i /></div>
            <article><small>结构句 · 健康</small><p>The rise in obesity has also been <mark>linked in part to</mark> the sedentary lifestyle and lack of exercise.</p><button type="button" tabIndex={-1}>定位到范文原句 <ArrowRight size={12} /><MousePointer2 className="tour-search-cursor" size={25} fill="#fff" aria-hidden="true" /></button></article>
          </section>
          <section className="tour-search-source"><header><BookOpen size={13} /><span>原文阅读</span><small>Video games</small></header><p>Playing video games can have several disadvantages.</p><p className="tour-search-located">The rise in obesity has also been <b>linked in part to</b> the sedentary lifestyle and lack of exercise that often accompany gaming addiction.</p><p>However, games can also develop useful skills when used in moderation.</p><span><Highlighter size={11} /> 已定位到目标句</span></section>
          <div className="tour-search-reduced-note">搜索结果会标出命中词；回到原文后目标句会再次突出。</div>
        </div>
      </div>
    </div>
  );
}

function WritingTourPage({ replayKey }: { replayKey: number }) {
  return (
    <div className="tour-dialog-main tour-writing-main">
      <div className="tour-copy tour-writing-copy">
        <span className="tour-step-label">06 / 06 · 写作练习</span>
        <h2 id="tour-title">带着一道题，开始写自己的文章</h2>
        <p id="tour-description">选择题库题目，或导入一条新的 IELTS Task 2 题目，在这里体验完整写作流程。</p>
        <div className="tour-key-list tour-writing-key-list">
          <div><span className="tour-writing-number" aria-hidden="true">01</span><span><strong>选择已有题目</strong><small>从题库直接开始</small></span></div>
          <div><span className="tour-writing-number" aria-hidden="true">02</span><span><strong>导入自己的题目</strong><small>粘贴完整的英文 Task 2 题目</small></span></div>
          <div><span className="tour-writing-number" aria-hidden="true">03</span><span><strong>进入写作练习</strong><small>从审题开始，逐步完成文章</small></span></div>
        </div>
        <a className="tour-writing-cta" href="/writing">进入写作练习 <ArrowRight size={16} aria-hidden="true" /></a>
        <p className="tour-copy-note"><MousePointer2 size={14} aria-hidden="true" /> 右侧演示如何导入一条自己的 Task 2 题目。</p>
      </div>
      <div className="tour-demo-shell tour-writing-shell" key={`writing-${replayKey}`}>
        <div className="tour-demo-windowbar"><span><i /><i /><i /></span><small><PenLine size={12} aria-hidden="true" /> 写作练习</small><em>自动演示</em></div>
        <div className="tour-demo-stage tour-writing-stage">
          <div className="tour-writing-board">
            <header className="tour-writing-board-head"><span>GUIDED WRITING</span><strong>先想清楚，再用英语写</strong></header>
            <div className="tour-writing-mini-stages" aria-hidden="true"><span className="active">审题</span><i /><span>构思</span><i /><span>逐段写作</span><i /><span>完整文章</span></div>
            <section className="tour-writing-prompt-card"><div><small>IELTS WRITING TASK 2</small><p>The best way to provide enough homes in large cities is to build tall apartment blocks.</p></div><span className="tour-writing-import-target"><FilePlus2 size={14} aria-hidden="true" /> 导入自己的题目<span className="tour-writing-click-ring" aria-hidden="true" /><MousePointer2 className="tour-writing-cursor" size={25} fill="#fff" aria-hidden="true" /></span></section>
            <section className="tour-writing-import-sheet" aria-label="导入自己的 Task 2 题目演示"><header><FilePlus2 size={15} aria-hidden="true" /><strong>导入自己的 Task 2 题目</strong></header><div className="tour-writing-faux-input"><span>Some people believe that...</span><i /><i /><i /></div><footer><span><Check size={12} aria-hidden="true" /> 题型与主题由你确认</span><button type="button" tabIndex={-1}>确认后开始</button></footer></section>
            <div className="tour-writing-reduced-note">可选择题库题目，也可以导入自己的 IELTS Task 2 题目。</div>
          </div>
        </div>
      </div>
    </div>
  );
}
