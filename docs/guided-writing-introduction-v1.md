# Guided Writing learner-owned Introduction v1

- 状态：Implemented；待真实页面复检
- 范围：Phase 2.5E，在两个已通过主体段之后完成 Introduction
- 不在范围：Conclusion、全文组装、Band 评分、整篇改写、自动提分承诺

## 1. 为什么在主体段之后写开头

Introduction 不再预先许诺一篇尚未写出的文章。只有 Body Paragraph 1 与 Body Paragraph 2 的 Logic / Language 都为 `clear`，系统才开放开头；开头使用已经保存的 Position、两个段落职责和两个 Main point 作为可信对照。

这使 Agent 能检查：开头是否准确介绍真实题目、是否明确回答题目、是否与后文一致，而不是奖励一段听起来漂亮但与正文脱节的模板。

## 2. 三个教学部分

1. `Relevant opening`：可选。只允许与题目直接相关、不过度扩张的一般背景；界面说明部分教师会称其为 hook，但它不是公开 Band Descriptors 的独立得分项。
2. `Task framing`：必需。learner 用自己的英语准确引入题目争议，不复制大段原题，不改变范围，不加入新论证。
3. `Thesis`：必需。明确回答题目，并与已经接受的总体立场及两个主体段方向一致。

三个部分是教学支架，不是固定三句模板；不要求 `This essay will...`，也不要求名言、反问、故事、惊人事实、编造数据或空泛的时代背景。

## 3. 评价边界

DeepSeek 分开返回：

- `Task Response`：题目引入是否准确，立场是否明确，是否回应必答部分，是否与两个主体段一致，开场是否相关且不过度；
- `Language`：意义、语法、拼写、搭配、词义、衔接、语域和句界。

每个轴最多指出一个优先问题。模型不得给 Band、替换句、改写后的开头、范文或新的论点。局部 typo / 小型表面错误仍与 blocking 问题分开。

## 4. 保存与失败行为

- `guided_writing_introduction_drafts` append-only 保存 learner 的三个部分、合并后的原文、输入 hash、评价与 trace 引用；
- draft ID 幂等；同一 ID 不得对应不同输入；
- DeepSeek 超时、网络失败或 Schema 无效时仍保存 learner 原文；
- trace 只保存 ID、步骤、状态、模型与错误码，不复制 learner 开头；
- 备份升级至 v1.9，并兼容 v1.0–v1.8。

## 5. 当前 UI

第二主体段清楚通过后显示“开始写开头”。页面同时展示可信的 Position 与两个主体段 Main point，使 learner 不必凭记忆判断 thesis 应该预告什么。三个输入区使用较大字号；下面只拼接 learner 自己输入的内容并显示词数。刷新页面可恢复最近一次正式提交和反馈。

Introduction 内部按 `Relevant opening / Task framing / Thesis` 逐部分激活语言。切换或聚焦某一部分时，服务端只从 approved 内容读取候选：首选完整句式必须来自 IELTS 范文段落 0 的正式句子卡，《新概念英语 3》等 `language_richness_corpus` 不得成为开头首选；Core 表达必须是 `recall_use`，可在确实贴合时作为次级局部支持。主界面最多显示一条 sentence frame / rhetorical move，局部 Collocation 只在 Hint 2 后折叠展示；没有强匹配时明确 no-fit。

提示按中文方向 → 目标句式 → 可填写骨架 → 原文用法逐级展开。learner 已经写了草稿时，第一次请求提示会把这一部分的 learner 原文用于重新选材，但客户端题目、立场、正文和候选 ID 均不是可信事实来源。新语料可打开正式学习卡，不因此计为已掌握；最终仍由 learner 自己填写并提交完整 Introduction。

跨主题开头句式只有经过 DeepSeek 对当前部分语义任务的核对后才能成为首选。模型不可用、低置信或输出无效时，确定性回退只允许同题 IELTS 范文开头；没有同题强匹配就返回 no-fit，不以较宽松的主题词重合替代 Agent 判断。

当前 32 张可定位到来源第一段的 approved 句子卡中，只有 11 张来自 IELTS 范文，另外 21 张属于语言丰富度语料；因此当前开头首选池为 11 张，不宣称 28 篇 IELTS 范文均已完成开头资产覆盖。原文存在可用句子不等于已经通过筛选；未审核句子不会由运行时 Agent 直接提升为正式推荐。
