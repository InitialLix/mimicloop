# MimicLoop 项目规格说明

> **版本**：v0.2 — Collocation Extension  
> **当前阶段**：基础句子学习产品已经实现，正在增量加入 Collocation 学习与复习模块  
> **主要目标**：在不破坏现有句子卡、练习、复习与 UI 的前提下，把“自然搭配”建设成可独立积累、可回忆、可迁移、并能回到原句语境中的学习单位。  
> **优先级说明**：当旧规划与当前代码或本版本发生冲突时，以现有已验证实现和 v0.2 的明确要求为准。Codex 不应因为旧章节仍保留设计背景而重做已经完成的功能。

---

## 0. v0.2 当前工程基线与变更摘要

### 已有成果

当前项目不是从零开始：

- 已上传并处理 **28 篇 IELTS 作文**；
- 已经制作 **100 多张句子卡**；
- 句子语料、学习卡、既有练习、复习及相关基础功能已经实现；
- `/today` 等现有页面已经形成自己的结构和视觉语言；
- 当前任务是**补充 Collocation 功能**，不是重新搭建 MVP。

Codex 必须先检查现有仓库、数据库、路由、组件和数据，再做增量修改。不得根据旧规划重新初始化项目、覆盖已有数据或用新模板重写现有页面。

### 本次明确修改

1. Collocation 的“回忆”阶段只保留一种方式：  
   **显示中文提示，用户主动写出英文 Collocation。**
2. 顶级导航名称继续使用：  
   **语料库**  
   不改名为“表达库”。
3. Collocation 是已有句子学习系统的补充层，而不是新的独立重型课程。
4. Collocation 在 `/today` 首页中的具体位置、入口样式和信息层级，由 Codex 在检查现有页面后，依据已有设计经验选择。
5. 其余有关 Collocation 独立数据、原句关联、去重、复习、举一反三和后续应用训练的设计继续保留。

---

## 1. 产品一句话定位

**MimicLoop 是一款以“模仿 → 回忆 → 仿写 → 迁移”为核心的 IELTS 写作训练工具。**

它不以“整篇作文批改”为核心，也不只是范句收藏或 Anki 式背诵。

核心目标是：

> 把高质量表达从“看懂 / 背过”逐步训练成“在新的 IELTS 主题里能够主动调用”。

---

## 2. 当前优先级

### 最高优先级

在现有产品中补充一个真正可长期使用的 Collocation 学习闭环：

```text
从已有句子中发现自然搭配
→ 理解中文含义和固定组合
→ 回到来源原句观察真实用法
→ 中文提示主动回忆英文
→ 间隔复习
→ 逐步替换对象并写入自己的句子
```

### 工程原则

- 保留现有句子卡和学习流程；
- 优先复用现有数据库、复习调度、练习记录与 design system；
- 新功能采用增量 schema migration，不做破坏性重构；
- 先让 Codex 离线整理现有语料，不要求产品运行时立即调用 API；
- UI 继续以简洁、安静、留白充足为首要约束；
- 比赛 Agent 和实习级增强仍属于后续阶段，不干扰当前个人使用体验。

### 暂时不追求

- 因为加入 Collocation 而新增复杂顶级导航；
- 多种随机回忆题型；
- 一次学习强制完成多个练习；
- 为了展示 AI 而在每次复习中调用模型；
- 自动把 Codex 产出的候选搭配直接写入正式库；
- 重新制作已有 28 篇作文和 100 多张句子卡；
- 为新功能重做已经稳定的页面和交互。

---

# 3. 当前产品范围

## 3.1 考试范围

继续聚焦：

**IELTS Academic Writing Task 2**

## 3.2 内容范围

已有 28 篇作文和 100 多张句子卡所覆盖的主题，构成当前真实内容范围。无需再把工程限制回最初设想的 Education、Technology、Environment 三个主题。

Collocation 模块应当能够跨所有已有主题工作，例如：

- Education
- Technology
- Environment
- Government & Public Policy
- Health
- Work & Economy
- Society & Family
- Crime & Law
- Culture & Media
- Cities & Transport
- Globalisation & Tourism
- Science & Ethics

## 3.3 论证功能

Collocation 不只积累主题名词，也应服务于真实论证，例如：

- 表明观点
- 解释原因
- 描述影响
- 让步与反驳
- 比较与权衡
- 举例
- 结果评价
- 提出解决方案

例如：

```text
address the root cause of
place pressure on
pose a threat to
widen the gap between
play a central role in
raise public awareness of
```

它们的价值在于帮助用户把简单中文意思转化成自然、可直接进入作文的英文表达。

---

# 4. 核心学习理念

## 4.1 不把一句话练六遍

系统可以拥有多种训练手段，但**不是每个句子都必须依次完成所有训练模式**。

用户界面不应该出现：

```text
填空 / 默写 / 重组 / 替换 / 迁移 / 段落
```

然后逼用户每句全部做一遍。

这会非常臃肿。

---

## 4.2 表面上只保留三个阶段

### Stage 1 — 学懂 Learn

第一次见句子时重点是：

- 理解原句
- 理解中文意思
- 看重点词块
- 看可复用结构
- 看 1～2 条真正有价值的注释

用户完成后：

```text
我看懂了
```

---

### Stage 2 — 记住 Recall

后续复习时，系统根据句子的特点选一种训练，而不是全部做。

主要两种：

#### A. 词块填空

重点考值得积累的词块，而不是随机挖单词。

例如：

```text
Although subsidising public transport would
________________ taxpayers,
it could reduce congestion in the long run.
```

答案：

```text
impose a short-term burden on
```

#### B. 中译英回忆

显示中文，让用户写英文。

第一版不强制和原句一字不差，可先：

- 显示原句自我核对
- 用户选择：忘记了 / 有点模糊 / 基本会了 / 能够迁移

后续再让模型评价合理同义表达。

---

### Stage 3 — 会用 Use

只有值得迁移的高价值结构才进入这一层。

主要做：

#### A. 槽位替换

保留骨架，换主题内容。

#### B. 跨主题迁移（后续）

不给完整骨架，只给：

- 新主题
- 要表达的意思
- 目标论证功能

用户自己回忆并调用结构。

---

## 4.3 段落训练不是每句话都做

段落应用属于一个主题单元或一组句子结束后的综合练习。

它更像一个“Boss 关卡”，而不是单句的常规必做环节。


## 4.4 Collocation 是句子与单词之间的中间层

Collocation 功能不取代现有句子训练，而是在其下方补上一层“可组合表达积木”。

```text
单词
→ Collocation
→ 来源原句
→ 仿写句子
→ 跨主题迁移
```

原有句子练习保持现状。本版本中“只保留中文到英文一种回忆方式”的要求，专门指 **Collocation 回忆**，不要求删除已经实现的句子练习模式。

---

# 5. 两类句子

为了避免训练臃肿，每条句子要判断其主要学习价值。

## 5.1 Vocabulary-focused

重点是主题词汇、搭配、词块。

例如：

```text
exacerbate traffic congestion
widen the gap between rich and poor
pose a threat to public health
```

建议学习路径：

```text
理解 → 词块回忆 → 定期复习
```

通常不需要强行跨主题仿写。

---

## 5.2 Structure-focused

重点是逻辑、句式和可复用表达骨架。

例如：

```text
While this approach may be effective in the short term,
it does not address the underlying cause of the problem.
```

建议学习路径：

```text
理解 → 句子回忆 → 槽位替换 → 偶尔迁移
```

只有高复用价值的结构句才需要深练。

---

# 6. 句子卡设计

一张句子卡需要同时服务：

- 学习
- 复习
- 仿写
- 后续 AI 评价
- 数据统计

## 6.1 基础字段

建议至少包含：

```text
id
sentence
translation
source
source_type
source_url_or_reference
task_type
topics[]
functions[]
focus_type
difficulty
created_at
updated_at
```

---

## 6.2 学习字段

```text
chunks[]
pattern
slots[]
grammar_note
usage_note
learning_note
example_transfer
```

---

## 6.3 可选字段

```text
simplified_version
context_before
context_after
paragraph_role
original_sentence
learning_sentence
```

特别建议同时保留：

```text
original_sentence
learning_sentence
```

因为以后可能为了学习目的对原句做轻微整理。

---

# 7. 示例句子卡

原句：

```text
Although subsidising public transport would impose a short-term burden on taxpayers,
it could reduce congestion and improve air quality in the long run.
```

建议数据：

```json
{
  "sentence": "Although subsidising public transport would impose a short-term burden on taxpayers, it could reduce congestion and improve air quality in the long run.",
  "translation": "尽管补贴公共交通会在短期内给纳税人造成负担，但从长远来看，它可以缓解交通拥堵并改善空气质量。",
  "task_type": "task2",
  "topics": ["government", "transport", "environment"],
  "functions": ["concession", "evaluation"],
  "focus_type": "structure",
  "difficulty": 3,
  "chunks": [
    "subsidise public transport",
    "impose a burden on taxpayers",
    "reduce congestion",
    "improve air quality",
    "in the long run"
  ],
  "pattern": "Although {policy} would impose a short-term burden on {group}, it could {benefit_1} and {benefit_2} in the long run.",
  "slots": [
    "policy",
    "group",
    "benefit_1",
    "benefit_2"
  ],
  "grammar_note": "Although 引导让步从句；主句使用 could 表达非绝对结果；reduce 和 improve 构成平行结构。",
  "usage_note": "Although 后不要再使用 but。",
  "example_transfer": "Although subsidising higher education would place pressure on public finances, it could improve social mobility in the long run."
}
```

---

# 8. 产品核心页面

第一版左侧导航暂定只有：

```text
今日学习
语料库
新增句子
学习进度
设置
```

---

## 8.1 今日学习

现有 `/today` 页面及其视觉结构应保留。

Collocation 需要进入每日学习与到期复习，但本规格**不强行指定它必须放在首页哪个卡片、哪个区域或哪个顺序**。Codex 应先检查现有 `/today`：

- 当前主任务如何呈现；
- 每日队列如何组成；
- 页面信息密度；
- 现有 design system；
- 句子学习和复习入口；
- 移动端与桌面端布局。

然后选择最自然的整合方式，并在实施说明中简短记录理由。

必须满足：

- 到期 Collocation 能进入今日学习队列；
- 每天安排 10 个新 Collocation；到期 Collocation 另用独立复习配额，不挤占这 10 个新学习名额；
- 不新增一个突兀、笨重的 Dashboard 区域；
- 不让 Collocation 抢走句子学习的全部视觉重点；
- 不要求用户在同一轮完成多种 Collocation 练习；
- 仍保持“一屏一个主要动作”的体验。

---

## 8.2 语料库

顶级导航名称必须继续保留为：

```text
语料库
```

不得改名为“表达库”。

在现有语料库内部增量加入 Collocation 访问方式。具体采用：

- `句子 / Collocations` 轻量切换；
- 筛选器；
- 子路由；
- 或与现有信息架构一致的其他方式；

由 Codex 根据当前代码和 UI 选择。

Collocation 视图至少支持：

- 中文或英文搜索；
- 按主题筛选；
- 按内部类型筛选；
- 按掌握状态筛选；
- 查看来源句；
- 查看同一 Collocation 的多个语境；
- 编辑、审核或停用；
- 查重与合并候选项。

原有句子语料库功能必须保持可用。

---

## 8.3 句子学习卡

视觉重点永远是句子本身。

需要展示：

### 原句与翻译

可独立隐藏 / 显示。

### 词块与 Collocation

现有重点词块继续高亮。

当某个词块已经成为正式 Collocation 学习对象时，应能：

- 在原句中清楚但克制地高亮；
- 点击或展开查看 Collocation 详情；
- 跳转到该 Collocation 的学习或复习状态；
- 查看它在其他来源句中的使用；
- 不因增加交互而破坏句子阅读的连续性。

### 结构拆解

例如：

```text
Although
[subsidising public transport]
would impose
[a short-term burden on taxpayers],

it could
[reduce congestion]
[in the long run].
```

### 可复用骨架

```text
Although {A} would impose a short-term burden on {B},
it could {C} in the long run.
```

### 使用说明

只保留最有价值的信息：

- 句子功能
- 语法提醒
- 适用场景
- 常见误用

---

## 8.4 新增句子

第一阶段提供：

### 手动新增

可手工填写全部字段。

### Codex 离线内容生产

第一阶段不需要 App 调用模型 API。

Codex 负责：

```text
读取来源作文
→ 理解全文
→ 拆句
→ 筛选候选句
→ 打主题 / 功能标签
→ 判断 vocabulary / structure
→ 提取 chunks
→ 提取 pattern
→ 生成中文解释
→ 生成 usage note
→ 写入 candidate_cards
```

用户审核后再进入正式库。

---

## 8.5 学习进度

第一版不要做复杂图表。

至少回答：

```text
总句子数
本周完成练习数
今日到期复习数
不同学习阶段的句子数量
不同主题的积累情况
不同论证功能的积累情况
```

例如：

```text
总句子数：42
本周练习：68
今日到期：7

未学习      8
已理解     10
能复现     14
能仿写      7
能迁移      3
```

不要一开始给“预计雅思分数”。

---

# 9. 学习状态

不要只有：

```text
已学 / 未学
```

建议状态：

```text
1. 未学习
2. 已理解
3. 能复现
4. 能仿写
5. 能迁移
```

单句还可进一步记录：

```text
原句理解
词块回忆
中译英复现
槽位替换
跨主题迁移
```

每次练习保存：

```text
exercise_type
user_answer
result
hint_used
attempt_count
self_rating
completed_at
next_review_at
```

---

# 10. 复习系统

第一版使用简单、透明的规则即可，不必一开始实现复杂 SRS。

用户每次练习后可以选择：

```text
忘记了
有点模糊
基本会了
能够迁移
```

大致规则：

```text
忘记了      → 很快再次出现
有点模糊    → 1～2 天后
基本会了    → 更长间隔
能够迁移    → 减少原句复现，增加应用型练习
```

后续再优化复习算法。

---

# 11. 当前语料基线

当前已有：

```text
28 篇来源作文
100 多张句子卡
```

这些内容已经进入项目，不需要重新按“3 篇 / 15 卡”或“12 篇 / 60 卡”的旧计划再做一次。

本次 Collocation 功能应优先利用已有资产：

1. 读取 28 篇来源作文的全部正文句，而不只读取正式句子卡；
2. 将正文句与已有正式句子卡、chunks 和学习句做可选匹配；
3. 从每个正文句中识别最值得主动掌握的自然搭配；
4. 与全库已有候选项去重；
5. 建立 Collocation 与一个或多个来源句的关联。

现有句子 ID、来源关系和学习记录不得被破坏。

---

# 12. Collocation 首批内容策略

不预先硬性规定必须生成多少条。Codex 应先扫描全部来源范文正文句，输出统计，再由实际质量决定首批批准数量。是否成为整句学习卡不是 Collocation 的筛选条件。

筛选原则：

- 每个范文正文句通常只提取 **0～3 个**真正高价值的 Collocations；
- 不是每个连续词组都值得独立建卡；
- 优先保留中国学习者“认识每个单词，但不容易自然组合出来”的表达；
- 优先保留能够跨多个 IELTS 主题复用的表达；
- 优先保留能够直接进入观点、原因、影响和解决方案论证的表达；
- 过度具体、只适用于一个原句的词串可以继续留在句子注释中，不必升级为独立 Collocation；
- 所有候选项必须经过人工审核后才能进入正式库。

候选项应按以下价值排序：

```text
自然度
主动表达难度
可迁移性
IELTS 适用性
原句质量
跨主题扩展空间
```

建议分批审核，而不是一次向用户展示数百条候选内容。

---

# 13. Codex 离线 Collocation 生产工作流

本阶段不要求产品运行时调用 GLM API。

Codex 使用自身 GPT 能力完成离线整理：

```text
28 篇来源范文的全部正文句
        ↓
匹配可选的句子卡、翻译与已有 chunks
        ↓
必要时回看 28 篇来源作文上下文
        ↓
提取 0～3 个高价值 Collocation 候选
        ↓
保留原文 surface form
        ↓
生成 canonical form 与可复用 pattern
        ↓
生成适合主动回忆的中文提示
        ↓
生成可替换对象和跨主题例子
        ↓
全库去重、聚类、合并
        ↓
写入 candidate_collocations
        ↓
人工审核
        ↓
approved collocations
        ↓
建立 sentence ↔ collocation 关联
```

推荐新增：

```text
data/candidate_collocations.json
schemas/collocation.schema.json
docs/collocation-guidelines.md
scripts/extract-collocations.*
```

Codex 不得直接把模型生成的候选内容写入正式表，也不得未经审核自动修改原句卡片。

---

# 14. Candidate Review 原则

Codex 不允许自动把候选内容直接写进正式语料库。

必须存在：

```text
raw essays
    ↓
candidate cards
    ↓
human review
    ↓
approved cards
```

审核页面后续建议提供：

```text
[收录]
[修改]
[不要]
```

可以显示：

```text
结构价值
词汇价值
迁移价值
推荐原因
```

---

# 15. 什么样的句子值得收

优先收：

- 明确立场
- 段落主题句
- 因果解释
- 让步与反驳
- 结果评价
- 解决方案
- 高价值固定搭配
- 可以跨主题迁移的句式

不要为了凑数收：

```text
Nowadays, X has become a controversial issue.
```

这种正确但学习价值很低的句子。

---

# 16. Collocation 功能规格

## 16.1 功能目标

Collocation 模块解决的不是“单词不认识”，而是：

> 中文意思看起来很简单，英文单词也可能都认识，但真正写作时想不到自然组合。

例如：

```text
对公共财政造成压力
place pressure on public finances

解决问题的根本原因
address the root cause of the problem

对公共健康构成严重威胁
pose a serious threat to public health

扩大不同群体之间的差距
widen the gap between different social groups
```

用户最终要经历：

```text
看懂
→ 从中文主动回忆
→ 在原句中理解
→ 替换搭配对象
→ 写进自己的句子
```

但这些动作分散在不同学习时间中，不在一次学习里全部完成。

---

## 16.2 产品定位

Collocation 是：

- 独立可复习的学习对象；
- 与现有句子卡多对多关联；
- 单词与完整句子之间的中间层；
- 句子仿写和迁移能力的表达积木。

Collocation 不是：

- 一个新的重型课程；
- 句子学习的替代品；
- 随机收集的所有词组；
- 纯粹的词典释义；
- 必须单独新增顶级导航的模块。

---

## 16.3 学习卡的内容顺序

一次 Collocation 学习应优先展示表达本身，再展示来源原句。

推荐信息层级：

```text
COLLOCATION

对……构成严重威胁

pose a serious threat to

Pattern
pose a/an {adjective} threat to {noun}

可替换对象
public health
local ecosystems
job security
social stability

来源原句
Uncontrolled urban expansion can pose a serious threat to local ecosystems.
```

核心原则：

- 中文提示要适合主动回忆，不要只复制生硬词典释义；
- 英文核心形式清楚突出；
- pattern 说明固定部分与可替换部分；
- 原句放在下方，帮助用户看见真实语境；
- 保留来源信息；
- 一次只强调少量真正值得记忆的信息。

---

## 16.4 回忆模式：只保留中文到英文

Collocation 的 Recall 阶段只有一种正式模式：

```text
显示中文提示
→ 用户输入英文 Collocation
→ 核对答案
→ 更新复习状态
```

例如：

```text
中文提示：
对……构成严重威胁

用户输入：
pose a serious threat to
```

明确不做：

- 三种题型随机选一；
- 原句挖空作为独立 Recall 模式；
- 二选一判断作为独立 Recall 模式；
- 每次回忆后强制再做替换或造句。

为了无 API 也能稳定判断，正式 Collocation 可以保存：

```text
canonical_answer
accepted_answers[]
normalization_rules
```

基础匹配可忽略：

- 大小写；
- 首尾空格；
- 连续空格；
- 句末标点。

涉及合理但不同的表达时，第一版可显示答案让用户自评；后续再考虑模型判断。

---

## 16.5 使用与举一反三

“回忆”只有一种，但掌握后的应用训练可以逐步增加。

首版已确定 Collocation 的完成条件与句子一致：Recall 只证明能回忆原表达，不能直接算完成；只有完成一条经过人工审核的换场景 Use 题后，才更新应用分数并安排下次复习。Use 题展示完整中文句子，只给较难且非考点的英文提示，目标搭配在作答前隐藏。没有审核题的旧条目继续使用原 Recall 闭环，禁止把候选题直接放入正式每日学习。

### A. 槽位替换

```text
原表达：
pose a serious threat to public health

新中文：
对生物多样性构成威胁

目标：
pose a threat to biodiversity
```

### B. 跨主题变化

```text
heavy reliance on private cars
heavy reliance on fossil fuels
heavy reliance on technology
heavy reliance on standardised tests
```

### C. 写入自己的句子

```text
主题：人工智能与就业
目标 Collocation：pose a threat to

示例方向：
Automation may pose a threat to the job security of low-skilled workers.
```

这些属于 Use / Transfer，不属于 Recall，且不要求首个版本一次全部实现。

---

## 16.6 内部类型

前台可以统一称为“Collocation”或“表达”，但内部数据最好区分：

```text
collocation
fixed_phrase
sentence_frame
```

示例：

```text
pose a threat to               collocation
in the long run                fixed_phrase
Although {A}, {B}              sentence_frame
```

这样可以避免把所有 chunks 都错误地当成 Collocation，同时继续复用现有句子卡中的 chunks 和 pattern。

---

## 16.7 推荐数据模型

### collocations

```text
id
canonical_text
translation_prompt
pattern
expression_type
grammar_pattern
usage_note
common_error
difficulty
status
created_at
updated_at
```

### collocation_source_links

```text
collocation_id
source_essay_id
paragraph_index
sentence_index
sentence_text
card_id             optional
surface_form
learning_surface_form optional，仅 card_id 存在时使用
role
start_offset        optional
end_offset          optional
created_at
```

其中：

```text
canonical_text
```

用于去重和复习；

```text
surface_form
```

保留它在来源句中的真实形式。范文原句关系是必需的，句子卡关系是可选的。

### collocation_examples

```text
id
collocation_id
sentence
translation
topic
source_sentence_id  optional
source_type
review_status
```

### collocation_progress

```text
collocation_id
stage
recall_score
application_score
last_reviewed_at
next_review_at
success_streak
lapse_count
updated_at
```

### collocation_attempts

```text
id
collocation_id
exercise_type
prompt
user_answer
normalized_answer
result
self_rating
created_at
```

首个版本中：

```text
exercise_type = zh_to_en_recall
```

---

## 16.8 掌握状态

Collocation 可采用四个层级：

```text
1. 已认识
2. 能回忆
3. 能替换
4. 能使用
```

第一阶段重点实现前两级：

```text
已认识
→ 能从中文回忆英文
```

后两级在槽位替换和自主造句成熟后再正式计入。

Collocation 状态与句子状态分开保存，因为用户可能：

- 会背原句但不会主动调用其中搭配；
- 会使用搭配但记不住完整原句；
- 理解意思但拼写不稳定；
- 能在原主题中使用但不能跨主题迁移。

---

## 16.9 去重与规范化

同一表达可能以不同形式出现：

```text
pose a threat to
poses a serious threat to
may pose a significant threat to
```

不得简单创建三张完全独立的卡。

建议保留：

```text
canonical form
surface forms
pattern
accepted answers
examples
```

Codex 在自动聚类时必须：

- 保留所有来源句；
- 不删除原文真实形式；
- 对不确定的合并标记为待人工审核；
- 不把语义不同但形式相似的表达强行合并；
- 允许一个 Collocation 关联多个主题和多个句子。

---

## 16.10 与现有 chunks 的关系

现有句子卡中的 `chunks` 不必立即删除或整体迁移。

推荐增量策略：

1. 保留原有 `chunks`，避免破坏既有页面；
2. 从完整范文正文、chunks 和句子卡原句中提取 Collocation 候选；
3. 审核通过后建立来源原句关系；存在正式句子卡时再建立可选的 card 关系；
4. UI 优先显示已关联的正式 Collocations；
5. 尚未升级的普通 chunks 继续作为句子注释；
6. 后续根据真实使用再决定是否逐步收敛数据结构。

---

## 16.11 首页与现有 UI 的整合

Collocation 必须能进入 `/today` 学习流，但不在规格里强制指定固定位置。

Codex 应根据现有工作经验和当前页面完成设计选择，要求如下：

- 先阅读当前 `/today` 代码和截图效果；
- 复用已有视觉语言和组件；
- 不为了新功能新增一块明显突兀的大型卡片；
- 不把首页改造成统计 Dashboard；
- 不让用户面对多个平级主按钮；
- 优先考虑把 Collocation 作为每日学习队列中的一个自然步骤；
- 保持句子与 Collocation 的关系可理解；
- 在 PR / implementation notes 中说明选择理由。

---

## 16.12 语料库中的整合

顶级名称保持“语料库”。

Codex 可根据现有结构选择：

```text
语料库
├─ 句子
└─ Collocations
```

或其他同等简洁的方式。

Collocation 详情需要能够：

- 查看中文提示；
- 查看 canonical form 和 pattern；
- 查看来源原句；
- 查看其他主题语境；
- 查看掌握状态；
- 开始复习；
- 编辑与停用；
- 合并重复候选项。

---

## 16.13 API 策略

首个 Collocation 版本不依赖产品运行时 API。

可以由 Codex离线完成：

- 提取；
- 中文提示；
- pattern；
- 变体；
- 例句；
- 去重候选。

未来只有以下环节明显需要 API：

- 判断用户自主造句是否自然；
- 接受与标准答案不同但合理的表达；
- 针对错误给出最小反馈；
- 根据掌握状态动态生成新的跨主题使用题。

---

## 16.14 第一阶段验收标准

Collocation 增量功能完成的最低标准：

- [ ] 能从现有句子卡关联一个或多个 Collocations；
- [ ] 一个 Collocation 能关联多个来源句；
- [ ] 顶级导航仍叫“语料库”；
- [ ] 能在语料库中搜索和查看 Collocations；
- [ ] 学习卡先展示 Collocation，再展示下方原句；
- [ ] Recall 只使用中文提示到英文输入；
- [ ] 回忆记录和下次复习时间能持久化；
- [ ] 到期 Collocation 能进入 `/today`；
- [ ] `/today` 的具体整合由 Codex 基于现有 UI 选择；
- [ ] 候选 Collocations 必须人工审核；
- [ ] 不破坏已有 100 多张句子卡及其学习记录；
- [ ] 不要求 GLM API 才能完成基本功能。

---

# 17. UI / 视觉设计原则

这是项目的一等约束，不是最后再“美化”。

目标风格：

> 安静、轻盈、克制、现代、具有阅读和学习感。

避免：

> 传统教育软件感  
> AI Dashboard 感  
> 卡片套卡片  
> 满屏渐变  
> 满屏按钮  
> 过度 gamification

---

## 17.1 视觉气质参考

偏向：

- Notion / Linear 的克制
- Apple Books / Kindle 的阅读舒适度
- Duolingo 的反馈感，但不走卡通路线
- Editorial / Learning App aesthetic

---

## 17.2 色彩

建议：

- 大面积暖白 / 浅灰 / 奶油底
- 黑灰文字
- 蓝紫作为品牌强调色
- Logo 可使用蓝紫柔和渐变
- 页面正文不要滥用渐变

---

## 17.3 排版

重点优先级：

```text
Typography
Whitespace
Line height
Text width
Hierarchy
```

排版优先于装饰。

---

## 17.4 卡片

避免：

```text
一个大卡片
  ├── 小卡片
  ├── 小卡片
  ├── 小卡片
```

尽量通过：

- 留白
- 字号
- 分隔
- 局部背景
- hover / reveal

完成层级。

---

## 17.5 动画

只服务于学习反馈：

- 答对后的轻微反馈
- 词块出现
- 掌握度变化
- 页面切换

不要为了“炫”而动画。

---

# 18. UI 技术栈建议

推荐：

```text
Next.js
Tailwind CSS
shadcn/ui
Lucide Icons
```

可选：

```text
Magic UI
```

只用于少量细腻动效。

以后进度页需要复杂图表时再考虑：

```text
Tremor
```

---

## 18.1 GitHub UI 的使用原则

可以大量利用成熟组件，但：

**不要直接 fork 一个 Dashboard Template 然后换 Logo。**

正确做法：

- 复用按钮
- Dialog
- Input
- Tooltip
- Tabs
- Sidebar
- Command Menu
- Empty State
- 微动效

但核心学习页面布局自己设计。

---

## 18.2 给 Codex 的 UI 指令

核心约束可以直接写：

```text
Use shadcn/ui as the base component system,
but do not use a ready-made dashboard template.

Follow MimicLoop's design tokens and maintain an
editorial / learning-app aesthetic.

Prioritize generous whitespace, strong typography,
restrained blue-purple branding, and minimal visual noise.

Avoid generic SaaS admin dashboard styling,
nested cards, excessive gradients, oversized iconography,
and overly dense control panels.
```

---

# 19. 设计系统

正式写大量页面前，先冻结一份小型 design system：

```text
Typography
Spacing
Radius
Colors
Shadows
Buttons
Inputs
Cards
Icons
Animations
```

建议保存：

```text
docs/design-system.md
```

以后 Codex 写新页面必须遵守。

---

# 20. 三个最重要的视觉页面

在大量开发前，优先把下面三个页面视觉方向定住：

1. 今日学习
2. 句子学习卡
3. 语料库

尤其是：

**句子学习卡必须是整个产品最原创、最精致的页面。**

因为它直接体现 MimicLoop 的学习理念。

---

# 21. 数据安全与备份

个人长期整理出的高质量语料非常有价值。

必须支持：

- JSON 导出
- JSON 导入
- 数据库备份
- 学习记录导出
- 恢复备份

不要让内容因为开发改动丢失。

---

# 22. 当前开发先后顺序：Collocation 增量

本轮不再按“从零实现 MVP”的旧顺序开发。现有基础功能已经完成，Codex 应采用增量路线。

---

## Phase 0 — 审计现有项目

在写代码前先完成：

- 读取现有路由与组件；
- 检查 `/today`；
- 检查语料库页面；
- 检查句子卡页面；
- 检查数据库 schema 和 migration 方式；
- 检查 28 篇作文和 100 多张卡的实际存储；
- 检查现有复习调度与 attempt 记录；
- 检查 design tokens 和组件风格。

输出一份简短 audit：

```text
当前架构
可复用模块
需要新增的数据
潜在兼容风险
推荐实现路径
```

未经审计，不得直接重构页面或数据库。

---

## Phase 1 — 冻结 Collocation 规范与 migration

创建或更新：

```text
docs/collocation-guidelines.md
schemas/collocation.schema.json
docs/product-spec.md
```

先提出数据库 migration 方案，确认：

- 是否复用现有 tag / progress / review 表；
- 哪些表需要新增；
- 如何关联 sentence；
- 如何保留已有 IDs；
- 如何 rollback；
- 如何备份。

---

## Phase 2 — 从现有语料生成候选项

扫描 28 篇来源范文的全部正文句，并匹配现有 100 多张句子卡：

```text
来源范文正文句 + 可选句子卡
→ Collocation candidates
→ canonicalization
→ deduplication
→ ranking
→ candidate_collocations.json
```

不要自动批准。

先输出统计：

- 扫描范文数、正文句数和其中已建卡句数；
- 候选总数；
- 去重后数量；
- 每种 expression type 数量；
- 高价值候选示例；
- 存疑合并项。

---

## Phase 3 — 人工审核与正式入库

实现最小审核路径：

```text
批准
修改
拒绝
合并
```

审核通过后：

- 写入正式 Collocation 表；
- 建立 sentence ↔ collocation 关系；
- 保留来源与 surface form；
- 不覆盖原句卡中的已有 chunks。

---

## Phase 4 — 句子页与语料库展示

实现：

- 原句中的 Collocation 高亮；
- Collocation 详情；
- 来源句关联；
- 同一表达的多个语境；
- 语料库内的 Collocation 入口；
- 搜索、筛选与状态查看。

保持原有设计系统。

---

## Phase 5 — Collocation 学习卡

实现：

```text
中文提示
英文表达
pattern
可替换对象
usage note
来源原句
其他语境
```

原句位于表达学习内容下方。

---

## Phase 6 — 单一 Recall 模式

只实现：

```text
中文提示
→ 输入英文 Collocation
→ 答案核对
→ 记录结果
→ 更新 next_review_at
```

不要在此阶段增加随机题型选择器。

---

## Phase 7 — `/today` 与复习调度

将到期 Collocations 接入现有今日学习队列。

具体页面位置和视觉形式由 Codex 审查现有 `/today` 后决定。实施时必须：

- 保持页面简洁；
- 复用现有 session flow；
- 避免增加平级主入口；
- 支持新学习和到期复习；
- 能恢复中断的学习进度。

---

## Phase 8 — 槽位替换与自主使用

基础 Recall 稳定后，再增加：

- 目标对象替换；
- 跨主题扩展；
- 将 Collocation 写入完整句子；
- application_score。

自主造句的自动判断可在以后接入 API，不阻塞基础版本。

---

## Phase 9 — 真实使用反馈

使用一段时间后检查：

- 中文提示是否容易产生歧义；
- canonical form 是否拆得过大或过小；
- 重复项是否过多；
- 复习量是否挤压句子学习；
- 用户是否能从 Collocation 回到原句；
- 哪些表达真正被迁移到新句子。

再根据数据调整，而不是提前加入更多题型。

---

# 23. 第二阶段：再考虑 GLM API

等个人版真的好用之后，再接 GLM。

## 23.1 AI 新增句子

流程：

```text
粘贴句子
→ GLM 结构化整理
→ 用户预览
→ 修改
→ 确认
→ 保存
```

---

## 23.2 开放式仿写评价

让模型判断：

- 是否表达目标意思
- 是否完成指定论证功能
- 语法是否正确
- 搭配是否自然
- 是否成功迁移

必须输出结构化 JSON。

---

## 23.3 自适应教练 / Agent

之后才做：

```text
读取历史状态
→ 判断弱点
→ 选择下一步训练
→ 调用练习工具
→ 评价结果
→ 更新 mastery
→ 决定下一步
```

---

# 24. 比赛版 Agent 演进方向（后续）

比赛版本可以升级为：

> AI Writing Transfer Coach

核心不是“AI 批改作文”，而是：

> Agent 根据用户长期学习状态，主动安排训练，并验证优秀表达能否迁移到新主题。

---

## 24.1 迁移掌握度 Transfer Mastery

可能维护：

```text
concession.form_accuracy
concession.topic_transfer
causal_explanation
lexical_specificity
paragraph_integration
```

区分：

```text
会看
会背
会替换
会迁移
会主动调用
```

---

## 24.2 Agent Loop

```text
Observe
→ Diagnose
→ Plan
→ Exercise
→ Evaluate
→ Update Memory
→ Adapt
```

---

## 24.3 比赛展示重点

让评委看到：

```text
用户答错
→ Agent 诊断
→ 状态变化
→ 下一题改变
→ 用户答对
→ 撤掉提示
→ 跨主题迁移
```

而不是只是一个聊天框。

---

# 25. 实习项目演进方向（后续）

如果以后用于 Agent 实习简历，需要从 Demo 升级成：

```text
可测
可解释
可部署
有真实状态
有异常治理
有评测
```

需要补：

- Agent state machine
- tool layer
- short / long-term memory
- eval dataset
- baseline comparison
- retry / timeout
- JSON Schema validation
- idempotency
- tracing
- Docker
- tests
- real-user data

但这不应该影响第一版个人产品的开发节奏。

---

# 26. 建议仓库结构

在不破坏现有结构的前提下，可增量增加：

```text
mimicloop/
├─ app/
├─ components/
│  └─ collocations/
├─ lib/
│  └─ collocations/
├─ db/
│  └─ migrations/
├─ data/
│  ├─ candidate_collocations.json
│  └─ approved_collocations.json
├─ schemas/
│  ├─ sentence-card.schema.json
│  └─ collocation.schema.json
├─ docs/
│  ├─ product-spec.md
│  ├─ content-guidelines.md
│  ├─ collocation-guidelines.md
│  └─ design-system.md
├─ scripts/
│  ├─ extract-collocations.*
│  └─ deduplicate-collocations.*
├─ tests/
└─ README.md
```

这只是职责建议。Codex 必须优先服从现有仓库结构，不应为了与示例完全一致而无意义搬迁文件。

后续 Agent 版仍可再增加：

```text
agent/
tools/
evals/
observability/
```

---

# 27. Codex 当前任务

## Task 1 — 先审计，不立即重写

完整阅读本规格和现有仓库，重点检查：

```text
/today
语料库
句子学习卡
数据库 schema
复习调度
现有 100+ 卡片数据
design system
```

先汇报：

- 当前实现；
- 可复用部分；
- 建议的 Collocation 数据关系；
- 首页整合选择；
- migration 风险；
- 分步实施方案。

---

## Task 2 — 更新规范文件

创建或更新：

```text
docs/collocation-guidelines.md
schemas/collocation.schema.json
docs/product-spec.md
```

要求明确：

- 什么值得成为 Collocation；
- 如何区分普通 chunk；
- canonical form 与 surface form；
- 中文提示怎么写；
- 如何去重；
- 如何与多个句子关联；
- Recall 只有中文到英文一种模式。

---

## Task 3 — 从已有数据生成候选 Collocations

读取 28 篇来源范文的全部正文句，并匹配现有 100 多张句子卡及 chunks。

输出：

```text
data/candidate_collocations.json
```

包含：

- 范文、段落、句号位置和完整原句关系；
- 可选句子卡关系；
- surface form；
- canonical form；
- 中文提示；
- pattern；
- 可替换对象；
- expression type；
- 推荐理由；
- 迁移价值；
- 去重组；
- review status。

不得直接写入正式库。

---

## Task 4 — 提交 migration 与审核方案

在改数据库前提供：

- 新表或复用表说明；
- migration；
- rollback；
- 数据备份；
- backfill；
- 去重策略；
- 测试方案。

不得丢失已有句子卡、来源、学习记录和复习状态。

---

## Task 5 — 实现最小可用 Collocation 闭环

按顺序实现：

```text
候选审核
→ 正式入库
→ 原句关联
→ 语料库访问
→ Collocation 学习卡
→ 中文到英文 Recall
→ 复习记录
→ /today 整合
```

`/today` 的具体位置和布局由 Codex 根据现有 UI 决定，不需要机械照搬规格示意图。

---

## Task 6 — 保持视觉质量

任何新增页面或组件必须：

- 复用当前设计系统；
- 保持大留白和清晰排版；
- 避免新增 Dashboard 感；
- 避免卡片套卡片；
- 避免一次展示过多操作；
- 让 Collocation 与下方来源句形成自然视觉关系；
- 不改变顶级导航“语料库”的名称。

---

# 28. 当前产品决策摘要

已经确认：

- 产品继续聚焦 Academic IELTS Task 2；
- 当前已有 28 篇作文和 100 多张句子卡；
- 既有功能视为已实现，不重新从零开发；
- Collocation 是补充功能，不替代句子卡；
- Collocation 要成为独立可复习的数据对象；
- 一个 Collocation 可以关联多个来源句；
- 普通正文句即使没有成为正式句子卡，也可以提供 Collocation；
- 一张句子卡可以关联多个 Collocations；
- 原句中的真实 surface form 必须保留；
- Collocation Recall 只有“中文提示 → 英文输入”一种模式；
- 槽位替换和自主造句属于后续 Use / Transfer；
- 顶级导航继续叫“语料库”；
- 语料库内部如何进入 Collocations，由 Codex 按现有信息架构选择；
- `/today` 中的具体位置由 Codex检查现有页面后决定；
- 第一阶段不依赖 GLM API；
- Codex 负责离线提取、标注和去重；
- 候选内容不得未经人工审核直接进入正式库；
- 现有 chunks 先保留，采用增量关联而非破坏性迁移；
- UI 审美仍是一等约束；
- 不套用现成 Dashboard Template；
- 不为了增加功能破坏现有简洁体验。

---

# 29. 产品最终希望形成的体验

加入 Collocation 后，一次学习仍然必须很轻。

示例：

```text
打开 MimicLoop
↓
进入今日学习
↓
看到一个中文提示
“对……构成严重威胁”
↓
主动写出
pose a serious threat to
↓
核对并记录
↓
在下方原句中看见真实使用
↓
继续今天的句子学习或结束
```

第一次学习一个新 Collocation 时：

```text
看中文含义
→ 看英文核心表达
→ 理解固定与可替换部分
→ 看下方来源原句
→ 标记已认识
```

后续才逐步进入：

```text
中文回忆
→ 替换对象
→ 写入自己的句子
→ 跨主题主动调用
```

产品不应该变成：

```text
一个 Collocation
→ 三种随机回忆
→ 强制填空
→ 强制选择题
→ 强制造句
→ 再做整句默写
```

核心仍然是少量、高质量、可持续的学习动作。

---

# 30. MimicLoop 的核心原则

> **少而精。**

> **先真正学会，再谈智能。**

> **Collocation 是自然英文表达的积木，原句是它的真实语境。**

> **回忆动作保持单一：看到中文，主动找回英文。**

> **每个表达只练它最值得练的部分，不把题型数量当作学习质量。**

> **AI 与 Codex 用来降低机械整理成本，不用来把简单复习复杂化。**

> **现有产品和数据优先，新增功能采用增量设计。**

> **界面必须帮助用户专注于表达和原句，而不是展示系统有多少功能。**

> **最终目标不是“收藏了多少 Collocations”，而是能否把它们自然写进陌生主题的句子。**
