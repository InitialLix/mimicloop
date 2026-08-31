# MimicLoop 项目规格说明

> **文档用途**：作为 Codex 开始创建仓库、设计数据结构和实现第一阶段 MVP 的唯一项目简报。若后续口头想法与本文冲突，以本文的“第一阶段范围”和“开发顺序”为准，并通过 ADR 记录变更。
>
> **当前决策**：先做一款个人长期使用的 **Academic IELTS Writing Task 2 句子模仿与迁移训练工具**。比赛版、GLM、开放式评价和 Agent 均为后续演进，不得阻塞第一阶段。
>
> **v0.2 增量**：基础句子产品完成后，Collocation 作为独立可复习的补充层增量接入。详细背景见 `docs/MimicLoop_Project_Spec_v0.2.md`，执行规范以本文、`docs/collocation-guidelines.md` 和 ADR 0007 为准。
>
> **Phase 2 增量**：第一阶段已冻结。第二阶段执行规范以 `docs/agent-phase2-spec.md` 与 ADR 0010 为准。Phase 2.1–2.4 与 2.5A 已完成；当前只进入 Phase 2.5B 的全英文构思追问和一个 learner-owned 主体段论证链，不包含观点供应、段落/整篇代写、自动 Band 评分或通用聊天。模型评价不直接改写确定性复习状态。

---

## 1. 产品愿景与定位

### 1.1 名称

**MimicLoop** = Mimic（模仿）+ Loop（学习闭环）。

它表达的不是机械背诵，而是：

```text
优秀范句
→ 理解与拆解
→ 主动回忆
→ 模仿使用
→ 记录表现
→ 间隔复习
→ 最终迁移到陌生题目
```

### 1.2 一句话定位

> MimicLoop 是一款以“模仿学习”和“表达迁移”为核心的 IELTS 写作训练工具，帮助用户把优秀表达从“看得懂、背得出”逐步变成“能在新主题中主动使用”。

### 1.3 不是什么

MimicLoop 第一阶段不是：

- 作文自动评分器；
- 全文批改网站；
- “Band 9 高级句”收藏站；
- 雅思句子版 Anki；
- 通用 AI 聊天机器人；
- 为了比赛堆砌的多 Agent Demo；
- 换皮的 SaaS Dashboard。

产品不与 IELTS WriteUp 等官方产品竞争“谁打分最准”，而是回答：

> **我下一步应该怎样练，才能把不会写变成会写？**

### 1.4 当前优先级

```text
P0  个人自用、每天愿意打开、数据可靠
P1  Academic IELTS Task 2 的句子学习闭环
P2  稳定的内容生产与人工审核流程
P3  开放式迁移、GLM、智能体、比赛展示
P4  多用户、云端、商业化
```

---

## 2. 核心学习原则

### 2.1 模仿学习，而非模板套用

用户学习的单位是“可解释、可拆解、可复用的优秀句子”，但最终目标不是一字不差地复现，而是抽出其中的：

- 主题词块；
- 搭配；
- 论证功能；
- 可复用结构；
- 可替换槽位；
- 使用边界与常见错误。

题型和主题是检索标签，不应变成机械套模板的依据。

### 2.2 Transfer（迁移）是长期差异点

普通背句工具问：“你还记得原句吗？”

MimicLoop 最终要问：

1. 你能否保留逻辑结构，更换内容槽位？
2. 你能否不看完整骨架，在另一个 IELTS 主题中使用它？
3. 你能否把它自然地放进一个完整 body paragraph？

第一阶段先为迁移保留数据结构，但只实现确定性的简单仿写；完全开放的跨主题迁移与段落应用后置。

### 2.3 前台只呈现三个阶段

不要把六种练习模式同时摆给用户。产品表面统一为：

```text
学懂 Learn
→ 回忆 Recall
→ 会用 Use
```

- **学懂**：原句、翻译、词块、骨架和少量高价值说明。
- **回忆**：系统根据句子类型，从词块填空或中译英中选择一种。
- **会用**：按 `primary_focus` 分流。结构/论证价值高的卡做槽位替换；词汇卡用目标词块写自然的简单句；mixed 卡以结构迁移为主并尽量保留目标词块。

“填空、重组、中译英、仿写、迁移、段落”等是系统可用的训练手段，不是每句话的必做清单。

### 2.4 Collocation 是独立的补充学习单位

Collocation 位于单词和完整句子之间，用于训练“中文意思和单词都认识，但写作时想不到自然组合”的表达。

- Collocation 不取代句子卡，也不把现有 `chunks` 整体迁移；
- Collocation 首先关联来源范文中的具体原句，并保留真实 surface form；如果该原句另有正式句子卡，再建立可选的 card 关系；
- 没有做成正式句子卡的普通正文句同样参与 Collocation 提取；
- Collocation 有独立的候选审核、正式内容、attempts 和 progress；
- 首版 Recall 只有“中文提示 → 输入英文 → 显示答案 → 用户自评”；
- 槽位替换、自主造句、跨主题迁移和模型评价后置；
- 顶级导航仍叫“语料库”，内部增加 Collocations 访问方式；
- 到期 Collocation 后续进入 `/today` 的统一任务流，但不新增平级的大型入口；
- Codex 只离线生成候选，未经人工批准不得进入正式库。

内容边界、canonical/surface form、中文提示和去重规则见 `docs/collocation-guidelines.md`；数据库与备份方案见 `docs/collocation-migration-plan.md`。

---

## 3. 内容与分类体系

### 3.1 第一阶段考试范围

只做 **Academic IELTS Writing Task 2**。

题型标签可包括：

- opinion / agree-disagree；
- discussion；
- advantages-disadvantages；
- positive-negative development；
- causes-solutions；
- two-part / multi-part question。

### 3.2 主题体系

数据结构应支持多标签。长期主题地图可包含：

1. 教育与儿童；
2. 科技、人工智能与数字媒体；
3. 环境、能源与动物保护；
4. 健康、饮食与生活方式；
5. 政府、公共政策与财政支出；
6. 工作、经济、商业与消费；
7. 社会、家庭、人口与平等；
8. 犯罪、法律与惩罚；
9. 文化、艺术、语言与媒体；
10. 城市、住房与交通；
11. 全球化、旅游与移民；
12. 科学研究、太空与伦理。

开发种子内容只需覆盖 **教育、科技、环境**。

### 3.3 论证功能

句子可以拥有多个功能标签：

```text
paraphrase_prompt       改写题目
state_position          表明立场
topic_sentence          提出中心观点
explain_mechanism       解释原因或机制
give_example            举例
describe_result         描述结果
concession              让步
counterargument         转折或反驳
compare_or_weigh        比较与权衡
qualify_claim           限定观点
propose_solution        提出解决方案
conclude_or_infer       总结与推论
```

### 3.4 两类句子必须区别处理

#### Vocabulary-focused（词汇型）

价值主要来自主题表达、固定搭配和词块，例如：

```text
exacerbate traffic congestion
widen the gap between rich and poor
pose a threat to public health
```

默认路径：

```text
理解 → 词块回忆 → 目标词块简单造句 → 定期复习
```

词汇卡的 Use 重点是把搭配用自然，不要求复杂句。练习页不自动注入今日队列中其他卡的结构，避免把当前目标词块与上一句骨架混在一起。

#### Structure-focused（结构型）

价值主要来自逻辑关系和可复用句法，例如：

```text
While this approach may be effective in the short term,
it does not address the underlying cause of the problem.
```

默认路径：

```text
理解 → 句子回忆 → 槽位替换 → 后续可进入跨主题迁移
```

可以允许 `mixed`，但必须指定一个 `primary_focus`，让练习调度有确定依据。

`mixed` 默认沿结构路径完成槽位替换，同时提示尽量保留本卡的核心词块。每张卡只完成与其学习目标一致的 Use 练习，不要求把所有练习类型走一遍。

---

## 4. Sentence Card 数据模型

### 4.1 设计原则

- 一张卡不只是英文、中文和生词；
- 保留原始出处与上下文；
- 区分 `original_sentence` 与为学习轻微整理后的 `learning_sentence`；
- 所有 AI/Codex 生成内容先进入候选态；
- 不给单个句子标注“Band 9”；可标难度、来源可靠度和迁移价值；
- 字段应支持未来迁移训练，但第一阶段不必全部展示。

### 4.2 建议字段

```json
{
  "id": "card_uuid",
  "source_essay_id": "essay_uuid",
  "original_sentence": "...",
  "learning_sentence": "...",
  "translation_zh": "...",
  "context_before": "...",
  "context_after": "...",
  "paragraph_index": 2,
  "task": "academic_task_2",
  "question_types": ["opinion"],
  "topics": ["education", "government"],
  "argument_functions": ["concession", "describe_result"],
  "primary_focus": "structure",
  "chunks": [
    {
      "text": "impose a burden on",
      "meaning_zh": "给……造成负担",
      "note": "常与 financial/public/taxpayer 搭配"
    }
  ],
  "pattern": "Although {A} may ..., it could {B} in the long run.",
  "slots": [
    {"name": "A", "role": "short_term_cost"},
    {"name": "B", "role": "long_term_benefit"}
  ],
  "grammar_note": "...",
  "usage_note": "Although 后不要再使用 but。",
  "simplified_version": "...",
  "transfer_example": "...",
  "exercise_seed": {
    "slot_replacement_prompt_zh": "..."
  },
  "difficulty": 3,
  "transfer_value": 5,
  "source_reliability": "teacher_reviewed",
  "content_status": "candidate",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

### 4.3 来源作文模型

至少保存：

```text
id
title / IELTS prompt
full_text
source_name
source_type
source_url 或书名与页码
author
question_type
topics
claimed_band（若来源确有说明）
examiner_comments（若存在）
accessed_at
local_raw_file
content_hash
```

---

## 5. 第一阶段 MVP：确切范围

### 5.1 目标用户与运行方式

- 单用户，仅供本人使用；
- 中文界面；
- 桌面优先的本地 Web 应用；
- 本地 SQLite 持久化；
- 不依赖任何运行时大模型 API；
- 程序重启后语料、进度和复习计划完整保留。

### 5.2 必须实现

#### A. 今日学习

- 显示到期复习数、新句子数、预计时长；
- 一个主操作：`开始今日学习`；
- 按简单规则混合到期旧句和少量新句；`daily_new_card_limit` 只限制新句，到期复习使用同等大小的独立配额，旧句不能挤占新句名额；
- 一次只展示一个任务；
- 完成后显示简洁总结。

#### B. 句子语料库

- 句子列表；
- 英文/中文搜索；
- 按主题、论证功能、句子类型、文章来源、学习状态筛选；
- 查看详情；
- 手动新增、编辑、删除；
- 收藏/置顶；
- 基于标准化文本或 hash 的查重；
- 从候选卡审核进入正式库。

#### C. 句子学习卡

- 原句与中文按需显示；
- 核心词块在原句中高亮，点击后轻量展开解释；
- 少量可能影响理解的生词使用更轻的颜色或下划线标记，点击后显示简短释义浮层；
- 生词浮层只展示词形、词性、当前语境下的中文义和必要提醒，不展开成长篇词典页；
- 逻辑/结构拆解；
- 可复用骨架与槽位；
- 论证功能、语法说明、使用提醒；
- 来源与上下文可展开查看；
- 页面主视觉始终是一句话，而不是一组控制面板。

生词释义是阅读支架，不是新的学习模式。第一阶段释义随候选卡预生成并经过人工审核，不在运行时调用词典或模型 API。

#### D. 确定性练习

第一阶段只做：

1. **词块填空**：按完整 chunk 挖空，不随机挖单词；
2. **中译英回忆**：展示参考答案，用户自评，不使用 LLM 判同义；
3. **槽位替换**：仅用于结构型/高迁移价值句子，使用预先审核的 prompt 和参考答案；
4. **词块引导造句**：用于词汇型句子，以完整中文句子引导作答，并以 `transfer_example` 作为参考写法；作答前不展示目标 chunk，也不自动展示其他卡的结构；
5. **遮挡/显示**：作为学习卡交互，不单列为复杂模式。

不要求每张卡做完全部练习。调度依据 `primary_focus` 和当前复习状态选择一个任务。

Recall 只记录阶段尝试，不代表整张卡完成；完成与卡片类型匹配的 Use 后，才更新复习状态并进入下一句。新规则启用前已经完成的 Recall 保持原完成状态，不追溯要求补做。

#### E. 学习记录与复习状态

记录每次尝试：

```text
card_id
exercise_type
prompt_snapshot
user_answer
result / self_rating
hint_used
attempt_count
duration_ms（可选）
completed_at
```

前台自评选项：

```text
忘记了
有点模糊
基本会了
能够使用
```

第一阶段学习状态：

```text
new        未学习
learned    已理解
recall     能回忆
use        能在给定槽位下使用
```

数据库可预留但前台暂不使用：

```text
transfer   能跨主题无提示迁移
compose    能用于段落
```

第一阶段采用简单、透明、可测试的自然日规则，不使用页面停留时长推断学习效果，也不安排分钟级倒计时：

```text
完成任一句    记录本次自评，继续今日队列的下一句
完成今日任务  进入今日总结，统一快速回看当天句子
第二个自然日  当天学过的句子重新进入今日任务
```

四档自评继续用于记录掌握阶段与后续练习类型：`忘记了` 回到 learned，`有点模糊 / 基本会了` 进入 recall，`能够使用` 进入 use；第一阶段不因档位显示不同的精确复习时间。跨日边界按 Asia/Shanghai 自然日计算。

#### F. 数据管理

- 导出正式句子卡 JSON；
- 导出学习记录 JSON；
- 导出完整备份（含版本号）；
- 从备份恢复；
- 导入候选卡 JSON；
- 导入前做 schema 校验、版本校验、查重和预览；
- 恢复或覆盖前自动生成可回滚备份；
- 数据库 migration 必须可重复执行并有测试。

### 5.3 第一阶段明确不做

- GLM 或其他运行时 API；
- AI 自动评分、同义答案判断；
- 开放式无骨架跨主题迁移；
- 微型段落与全文写作；
- 全文批改、雅思分数预测；
- Agent、聊天框、长期能力图谱；
- 用户账号、多人协作、社区和语料市场；
- 云同步、移动 App；
- 自动在线抓取作为 App 功能；
- Task 1、General Training；
- 复杂推荐算法和花哨统计图表。

---

## 6. 页面、导航与信息架构

左侧导航保持五项：

```text
首页
今日学习
语料库
学习进度
设置
```

页面关系：

```text
首页
├── 开始 / 继续今日学习
└── 阅读完整范文

今日学习
└── 今日学习流
    ├── 学习卡
    ├── 回忆练习
    └── 简单仿写

语料库
├── 句子库
│   ├── 搜索与筛选
│   └── 句子详情
    ├── 学习
    ├── 练习
    └── 编辑
└── 完整范文库
    ├── 按主题筛选
    ├── 原题与完整正文
    └── 已收录句子直达学习卡

候选卡片
├── 待审核
├── 逐字段编辑
└── 收录 / 驳回 / 标记稍后处理

学习进度
├── 今日与本周记录
├── 学习阶段分布
├── 到期复习
└── 主题 / 功能的简单统计

设置
├── 数据导入
├── 数据导出
├── 备份与恢复
└── 内容与应用版本信息
```

“新增句子”可放在语料库和候选卡页的主按钮中，不额外占导航。第一阶段支持手动新增和 JSON 导入，不显示不可用的 AI 整理入口。

---

## 7. 内容来源策略

### 7.1 来源分工

首批内容以可靠人类作者/官方材料为母语料：

1. **IELTS 官方高分考生作答：首批主要来源**  
   必须同时保存实际 band 与 examiner comments。优先从 Band 7.5 及以上作答筛句，并排除考官明确指出的问题表达。
2. **Cambridge IELTS 正版 model/sample answers：首批主要来源**  
   区分 examiner-written model answer 与 candidate answer，保存书名、版本、测试编号、页码、band 和评语（若有）。
3. **British Council / IDP 官方样本：补充与校准**  
   只使用一手官方页面或文件，并保留其对样本用途和分数的原始说明。
4. **IELTS Simon：后续补充与对照**  
   只使用可追溯的完整范文；Ideas 话题素材书不能冒充 source essay。

不要把来历不明的“100 篇 Band 9 PDF”、大量未校对学生作文或模型批量生成作文作为首批母语料。官方考生答案也不等同于官方范文；只选经得起考官评语校准的句子。

### 7.2 内容规模

#### 开发种子

```text
3 篇 IELTS 官方 / Cambridge 高可靠度作答或 model answer
× 按实际学习价值筛选，不设每篇硬性配额
= 以形成至少 15 张经审核的高质量卡为验收目标
```

主题：教育、科技、环境各一篇。目的是冻结 schema、验证 UI 和跑通整个内容管线，不要为准备大量语料拖延开发。

#### 第一个可用内容包

```text
约 12 篇 IELTS 官方、Cambridge 与后续可靠教师来源作文
→ 按学习价值形成首个精选卡包，不用固定卡片总数倒逼筛选
```

建议构成：

| 来源 | 篇数 | 用途 |
|---|---:|---|
| IELTS 官方高分考生作答 | 优先 | 带 band 与 examiner comments 的首批语料 |
| Cambridge 正版 sample/model answers | 优先 | examiner model 或带评语的 candidate answer |
| British Council / IDP | 补充 | 官方公开样本与评分校准 |
| IELTS Simon | 后续 | 完整且可追溯时作为教师范文补充 |

教育、科技、环境各约 4 篇；整体覆盖主要 Task 2 题型即可，不强迫每个主题覆盖全部题型。

### 7.3 筛句标准

不按每篇固定数量收句。AI 应适度扩大候选范围，人工审核按学习价值决定最终数量；普通文章可能形成 5–10 张卡，表达密度高的文章可以更多。优先：

- 明确立场；
- 段落主题句；
- 解释原因/机制；
- 让步、对比、反驳或评价；
- 例子、结果或解决方案；
- 有自然搭配或高复用结构，且适合考试时间与语体。

排除：

- 空泛套话，如 `Nowadays, X has become a controversial issue.`；
- 只因句子长或“高级”而收录；
- 过度模板化、过度学术、搭配可疑；
- 脱离上下文后逻辑不完整；
- 与库内已有卡片学习价值重复。

---

## 8. 第一阶段 Codex-first 内容管线（零 API）

第一阶段的“AI 内容加工”由开发时的 Codex/GPT 完成，不是 App 运行时调用 GLM。

```text
用户提供 URL / HTML / PDF / 文本
             ↓
Codex 获取或读取并保存原文
             ↓
识别题目、来源、题型、主题和段落
             ↓
按 content-guidelines 提取所有具有独立学习价值的候选句（不设硬配额）
             ↓
分类 vocabulary / structure / mixed
             ↓
生成 chunks、pattern、slots、中文说明和练习种子
             ↓
JSON Schema 校验 + 查重
             ↓
data/candidate_cards.json
             ↓
用户逐张审核、修改
             ↓
approved cards / SQLite 正式库
```

来源处理约束：

- 公开网页：Codex 可在获准联网后获取并保存原文；
- 有权限访问的会员网页、电子书或 PDF：用户把文件放入 `sources/raw/`，无需逐篇复制；
- 纸质书：用户先扫描/拍摄成可读 PDF；
- 获取失败时保留 URL 与待办，不伪造正文；
- 保存原文、来源元数据和 hash，保证可追溯；
- 不允许候选卡绕过审核直接进入正式库。

### 8.1 `candidate_cards` 审核工作流

每张候选卡展示：

```text
原句与上下文
推荐的 learning_sentence
primary_focus
主题与论证功能
词汇价值 / 结构价值 / 迁移价值
chunks / pattern / slots
中文解释与使用提醒
推荐收录理由
潜在问题或不确定项
来源链接 / 文件 / 页码
```

允许操作：

```text
收录        → 校验、查重、写正式库
编辑后收录  → 保存修订历史后写正式库
稍后处理    → 保留 pending
驳回        → 保存原因，避免下次重复推荐
```

状态建议：

```text
candidate → needs_edit → approved
          ↘ deferred
          ↘ rejected
```

---

## 9. UI 与设计系统

### 9.1 视觉方向

> **安静、轻盈、编辑感、阅读舒适、有学习反馈；不像传统教育软件，也不像满屏卡片的 AI Dashboard。**

参考气质：

- Notion / Linear 的克制；
- Apple Books / Kindle 的阅读舒适度；
- Duolingo 的反馈感，但去除卡通化；
- 少量蓝紫品牌强调色，大量暖灰、米白、黑灰文本。

### 9.2 强制原则

1. 一屏只突出一个主要动作；
2. 大留白、舒适行距、受控文本宽度；
3. 主色最多一个：克制的蓝紫色；
4. 背景优先浅暖灰/奶油白，避免刺眼纯白；
5. 弱边框、轻阴影，禁止卡片套卡片；
6. 注释按需展开，默认不把所有信息拍在用户脸上；
7. 排版优先于装饰；
8. 不滥用 emoji、渐变、玻璃拟态和大面积插画；
9. 动画只服务于学习反馈，且尊重 `prefers-reduced-motion`；
10. 图标统一使用 Lucide；
11. 学习卡必须围绕“这一句话”设计，不能套管理后台详情页；
12. 宁可少一个功能，也不要为了塞功能破坏信息层级。

### 9.3 组件与实现

推荐：

```text
Next.js + TypeScript
Tailwind CSS
shadcn/ui（基础可访问组件）
Lucide Icons
Magic UI（可选，只取极少量细微反馈动画）
```

禁止直接 fork 完整 dashboard template。开源项目只借鉴局部交互或组件，不复制整套产品气质。

开始正式页面前先建立 design tokens：

```text
Typography
Color
Spacing
Radius
Shadow
Button
Input
Surface
Motion
Content width
```

先完成三个核心页面的高保真方向稿：

- 今日学习；
- 句子学习卡；
- 语料库。

这三个页面通过审美确认后，再扩展其他页面。

---

## 10. 技术建议与仓库结构

技术基线建议（Codex 可在 ADR 中提出替代，但不得增加第一阶段复杂度）：

```text
Next.js App Router + TypeScript
SQLite + Drizzle ORM（或同等级轻量 ORM）
Zod / JSON Schema 做边界校验
Vitest 做规则与数据层测试
Playwright 做关键学习闭环 E2E
```

建议仓库结构：

```text
mimicloop/
├─ AGENTS.md
├─ README.md
├─ package.json
├─ docs/
│  ├─ product-spec.md
│  ├─ content-guidelines.md
│  ├─ design-system.md
│  └─ adr/
│     ├─ 0001-stack-and-local-storage.md
│     └─ 0002-learning-state-and-review-rules.md
├─ schemas/
│  ├─ sentence-card.schema.json
│  ├─ source-essay.schema.json
│  ├─ candidate-card.schema.json
│  └─ backup.schema.json
├─ sources/
│  ├─ raw/
│  └─ metadata/
├─ data/
│  ├─ candidate_cards.json
│  ├─ approved_cards.seed.json
│  └─ rejected_candidates.json
├─ scripts/
│  ├─ validate-content.*
│  ├─ detect-duplicates.*
│  └─ import-approved-cards.*
├─ src/
│  ├─ app/
│  │  ├─ today/
│  │  ├─ library/
│  │  ├─ candidates/
│  │  ├─ progress/
│  │  └─ settings/
│  ├─ components/
│  │  ├─ sentence-card/
│  │  ├─ exercises/
│  │  └─ ui/
│  ├─ db/
│  │  ├─ schema/
│  │  ├─ migrations/
│  │  └─ repositories/
│  ├─ domain/
│  │  ├─ cards/
│  │  ├─ exercises/
│  │  └─ review/
│  ├─ lib/
│  └─ styles/
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  ├─ e2e/
│  └─ fixtures/
└─ backups/                 # 本地生成，默认不提交 Git
```

未来才添加：

```text
agent/
tools/
evals/
observability/
```

不要为了“看起来像 Agent 项目”提前创建空壳并增加认知负担；但在进入比赛/实习阶段时，这些目录必须有真实实现、测试和评测。

---

## 11. 开发顺序与验收门槛

严格按以下顺序推进；上一阶段未达验收标准，不进入下一阶段。

### 0. 冻结范围

- [ ] 确认第一阶段约束与非目标；
- [ ] 确认 Learn / Recall / Use 三阶段；
- [ ] 确认 vocabulary / structure 的不同路径；
- [ ] 建立 ADR 机制。

**完成标准**：所有人能用一句话描述 MVP，且不存在 GLM、Agent、账号系统等隐性依赖。

### 1. 内容规范与 Schema

- [ ] 创建 `docs/content-guidelines.md`；
- [ ] 创建 `schemas/sentence-card.schema.json`；
- [ ] 创建来源作文、候选卡和备份 schema；
- [ ] 明确枚举、必填字段、版本策略和来源追踪。

**完成标准**：任意目标句都能完整表达，schema 校验能给出可理解的错误。

### 2. 手工种子卡

- [ ] 先制作一批完整样卡，以至少 15 张经审核的正式卡为验收目标；
- [ ] 覆盖教育、科技、环境；
- [ ] 同时覆盖词汇型与结构型；
- [ ] 走一遍候选 → 审核 → approved 流程。

**完成标准**：真实内容证明 schema 与学习卡布局可用，而非仅靠假数据自洽。

### 3. 数据库与基础后端

- [ ] SQLite schema 与 migrations；
- [ ] 句子、来源、标签、尝试记录、复习状态、候选卡；
- [ ] CRUD、事务、查重、导入导出；
- [ ] repository/service 边界与测试。

**完成标准**：程序重启数据仍在；备份可恢复；重复导入不会制造重复数据。

### 4. 语料库与候选审核

- [ ] 搜索、筛选、详情、编辑、删除、收藏；
- [ ] 候选卡预览、修改、收录、驳回；
- [ ] 导入前预览与错误反馈。

**完成标准**：用户可以完全手动维护正式语料，不依赖外部模型。

### 5. 句子学习卡

- [ ] 原句/翻译显示控制；
- [ ] chunk 高亮与轻量注释；
- [ ] pattern、slots、usage note；
- [ ] 来源上下文按需展开；
- [ ] 完成三个核心页面的视觉一致性检查。

**完成标准**：打开任意卡都能清楚理解“值得学什么”和“哪里可以复用”。

### 6. 确定性练习

- [ ] 词块填空；
- [ ] 中译英参考答案 + 用户自评；
- [ ] 结构型句子的预设槽位替换；
- [ ] 尝试记录、提示与结果保存；
- [ ] 规则单元测试。

**完成标准**：一张卡能走完 Learn → Recall → Use，且不调用 API。

### 7. 简单复习调度与今日学习

- [ ] 实现透明的自然日复习规则；
- [ ] 到期复习、新卡混合、单任务流程；
- [ ] 今日完成总结与基础进度；
- [ ] 跨天 E2E 测试。

**完成标准**：第二天重新打开 App，它知道该复习什么；到此第一阶段 MVP 完成。

### 8. 扩充到首个内容包

- [ ] Codex 处理 12 篇来源作文；
- [ ] 用户审核形成约 50–60 张正式卡；
- [ ] 记录审核中暴露的 guideline/schema 问题；
- [ ] 只做向后兼容或有 migration 的变更。

---

## 12. Codex 开工时必须先创建的文件

第一批提交应至少包含：

```text
README.md
AGENTS.md
docs/product-spec.md
docs/content-guidelines.md
docs/design-system.md
docs/adr/0001-stack-and-local-storage.md
schemas/sentence-card.schema.json
schemas/source-essay.schema.json
schemas/candidate-card.schema.json
schemas/backup.schema.json
data/candidate_cards.json
data/approved_cards.seed.json
```

其中：

### `docs/content-guidelines.md`

必须定义：

- 什么句子值得收入；
- 什么句子不要收；
- vocabulary / structure / mixed 如何判断；
- chunks 怎样选择；
- pattern 和 slots 怎样抽取；
- 中文解释、grammar note、usage note 的长度与标准；
- 如何处理原句的轻微清理；
- 来源可靠度与可追溯要求；
- 候选卡推荐理由与不确定项怎样写；
- 输出必须通过哪个 schema。

### `schemas/sentence-card.schema.json`

必须做到：

- JSON Schema 有显式 `$schema`、`$id` 和 `schema_version`；
- `additionalProperties: false`，避免静默吞字段；
- enum 集中定义并与 TypeScript 类型保持一致；
- chunks、slots、来源和状态有严格约束；
- 对未来字段使用可迁移版本策略，而不是随意改 JSON。

### `AGENTS.md`

应告诉 Codex：

- 第一阶段严禁引入运行时 LLM API；
- 内容不得直接从 raw 写入正式库；
- 所有 schema/migration/review 规则变更需同步测试与文档；
- UI 必须遵循 `docs/design-system.md`；
- 禁止完整 dashboard template；
- 不得为未来 Agent 提前增加不必要框架。

---

## 13. Codex 的首轮任务清单

把本文放入新仓库后，第一条给 Codex 的任务可以直接写成：

```text
请阅读 docs/product-spec.md，并严格把第一阶段个人自用 MVP 与后续 Agent 阶段分开。

本轮只做规划与项目地基：
1. 检查规格中的冲突或未决技术点，用 ADR 明确默认选择；
2. 创建 docs/content-guidelines.md；
3. 创建 sentence-card、source-essay、candidate-card、backup 四个 JSON Schema；
4. 从 IELTS 官方 / Cambridge 的 3 篇高可靠度作答或 model answer 中按学习价值创建覆盖教育、科技、环境的高质量样卡，不设每篇硬性数量限制，并以至少 15 张经审核的正式卡为验收目标；样卡必须同时包含 vocabulary-focused 和 structure-focused；
5. 创建 schema 校验与查重脚本及对应测试；
6. 输出数据库表设计草案和第一阶段实现计划，但不要接入任何 LLM API，不要实现 Agent，不要套用 dashboard template。

每一步完成后运行校验与测试，并报告：已完成项、关键设计决策、仍需人工审核的内容问题、下一步建议。
```

首轮之后再单独要求 Codex 搭建应用和数据库。不要把“建 schema、批量抓作文、做全部页面、接 Agent”塞在一次提示中。

---

## 14. 第二阶段：GLM 与开放式迁移（后续，不阻塞 MVP）

当第一阶段已经稳定并被真实使用后，再加入：

1. App 内粘贴句子 → GLM 生成结构化候选卡；
2. 字段级重新生成；
3. JSON Schema 校验、重试、查重、人工审核；
4. 开放式跨主题仿写；
5. 混合评价器：确定性检查 + 语义/语言 rubric；
6. 低置信度保守反馈或人工复核；
7. 微型段落应用。

GLM 永远不能跳过 `candidate → human review → approved`。

---

## 15. 比赛与实习演进（明确次要）

### 15.1 比赛版

比赛的差异点不是“接了大模型”或“AI 会批改”，而是：

- Transfer Mastery（迁移掌握度）；
- Scaffold Fading（根据表现逐步撤除支架）；
- Expression Mastery Graph（细粒度表达能力状态）；
- 同一用户答对/答错后，下一步路径真实不同；
- Agent 的决策会更新数据库与后续训练计划。

比赛版建议仍由一个总控 Learning Director Agent 配合明确工具，不要为了展示强行让多个 Agent 开会。

候选工具：

```text
get_learner_state
search_sentence_bank
diagnose_attempt
evaluate_transfer
choose_next_action
generate_exercise
update_mastery
schedule_review
ingest_new_sentence
```

### 15.2 实习级项目

要从比赛 Demo 变成可用于 Agent/AI 全栈实习的项目，还需补齐：

- 显式状态机与持久化 checkpoint；
- 工具输入输出 schema、错误码、超时、重试和幂等；
- 短期训练状态、长期学习记忆与结构化能力图谱；
- 人工标注评测集；
- 固定流程 vs 规则自适应 vs Agent 的基线对比；
- 开放答案接受率、错误识别、教学动作、工具调用、端到端成功率；
- 延迟、成本、置信度校准；
- 模型超时、非法 JSON、刷新、并发写入、重复提交、Prompt 注入等异常治理；
- 日志、trace、缓存、事务、限流、Docker、单元测试和 E2E；
- 小规模真实用户与真实指标，不编造提升数字。

若投 Agent 算法/研究岗位，再增加模型侧实验，例如错误诊断小模型、策略学习或人工标注 benchmark。MimicLoop 仍作为原创主项目；可另做一个小型 Agent Runtime 复现或真实上游 PR 作为技术副线，不建议换成轻改高 Star 仓库。

---

## 16. 第一阶段完成定义（Definition of Done）

只有同时满足以下条件，才可称为 MVP：

- [ ] 本地启动无需 API Key；
- [ ] 有至少 15 张经人工审核的真实句子卡；
- [ ] 候选卡不能绕过审核进入正式库；
- [ ] 用户能搜索、筛选、查看、编辑和备份语料；
- [ ] 一张卡能走完 Learn → Recall → Use；
- [ ] vocabulary-focused 与 structure-focused 获得不同练习；
- [ ] 每次尝试和自评都持久化；
- [ ] 第二天打开时能看到正确的到期复习；
- [ ] 导出后可在空数据库中完整恢复；
- [ ] 关键规则有单元测试，核心学习闭环有 E2E；
- [ ] 三个核心页面视觉一致、信息不拥挤、无 dashboard 模板感；
- [ ] README 能让新的 Codex/开发者在不了解旧对话的情况下继续工作。

---

## 17. 最终产品准则

> **先把一条句子真正学会，再考虑平台规模。**

> **先用确定性规则做出可靠闭环，再让模型处理确实需要语言判断的部分。**

> **先证明 MimicLoop 是一款本人愿意每天使用的工具，再把它演进成比赛 Agent 和实习级工程项目。**

> **产品的核心不是记住原句，而是把优秀表达变成能在陌生话题中主动调用的能力。**
