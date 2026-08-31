# 《新概念英语 3》第 18、27 课接收与处理记录

- 登记日期：2026-08-18
- 来源合集：新概念英语 3
- 内容角色：`language_richness_corpus`
- 来源性质：语言丰富度语料，不是 IELTS model essay
- 当前状态：扫描图与逐字转写已归档；5 张句子卡和 21 条 Collocation 已经用户整批批准并发布

## 来源登记

| 课次 | 标题 | 网页 | 已归档 raw 文件 |
|---|---|---|---|
| 18 | Electric Currents in Modern Art | https://nce.luzhenhua.cn/NCE3/18-electric-currents-in-modern-art.html | `sources/raw/new-concept-english-3/lesson-18.txt` |
| 27 | Nothing to Sell and Nothing to Buy | https://nce.luzhenhua.cn/NCE3/27-nothing-to-sell-and-nothing-to-buy.html | `sources/raw/new-concept-english-3/lesson-27.txt` |

用户于 2026-08-18 提供两课的清晰教材扫描图。项目以扫描页为段落边界和逐字转写依据，同时保存原始扫描与 UTF-8 转写；网站只作为来源说明，不用于猜测教材段落。两课各确认 2 个正文段落。

## 固定字段映射

- `source_name`: `新概念英语 3`
- `content_role`: `language_richness_corpus`
- `answer_origin`: `published_language_textbook`
- `ielts_prompt`: `null`
- `question_type`: `not_applicable`
- `claimed_band`: `null`
- `examiner_comments`: `null`
- `rights_note`: 仅供个人学习；正式 raw 由用户基于合法持有的教材提供

## 按段落筛选规则

1. 先逐段标记叙事、描写、说明或议论功能，再在段内扫描全部句子，不只看整课主题。
2. 第一优先级是完整句子的框架、信息组织和自然写法；句子只收可迁移的逻辑、句法或表达组织方式，纯故事细节、专名和只靠修辞效果成立的句子不收。
3. 第二优先级是 Collocation；只收中国学习者不容易主动产出、搭配边界明确且至少能迁移到一个新场景的表达，基础透明组合不凑数，也不让零散短语数量淹没整句学习目标。
4. 同一句可同时贡献句子卡和 Collocation，但两个学习对象分别判断、分别查重。
5. 每条候选保存课次、段号、句号、原句、上下文和 surface form；任何清理都写入可追踪 edit。

## 历史预审记录

以下是收到扫描前的方向性初筛，现已由正式候选和审核清单取代，不代表最终收录结果。正式结果见 `sources/metadata/nce3-candidate-review.md`。

### 第 18 课

Collocation / frame 初筛：

- `take no interest in`
- `cannot have failed to notice`
- `on display in public places`
- `get quite used to`
- `in response to`
- `line up against`

可迁移句初筛：

- `The idea that modern art can only be seen in museums is mistaken.`
- `Even people who take no interest in art cannot have failed to notice examples of modern sculpture on display in public places.`

### 第 27 课

Collocation / frame 初筛：

- `live by doing something`
- `in the light of`
- `measure the value of something in terms of money`
- `estimate the true value of`
- `grudge paying a high fee for`
- `the only exception to this general rule`
- `arouse the pity of`
- `sacrifice human dignity`
- `be fully aware of the consequences`
- `be free from anxieties`
- `move from place to place with ease`
- `sleep in the open`
- `in times of real need`
- `speak of someone with contempt`
- `put someone in the same class as`
- `feel envious of`
- `freedom from care`

可迁移句初筛：

- `Though it may be possible to measure the value of material goods in terms of money, it is extremely difficult to estimate the true value of the services which people perform for us.`
- `There are times when we would willingly give everything we possess to save our lives, yet we might grudge paying a surgeon a high fee for offering us precisely this service.`
- `The conditions of society are such that skills have to be paid for in the same way that goods are paid for at a shop.`
- `Tramps seem to be the only exception to this general rule.`

## 正式候选与查重结果

- 基线：152 张 approved 句子卡、200 条 approved Collocation。
- 最终生成 5 个句子候选、21 个 Collocation 候选；生成阶段均保持 `candidate`，随后根据用户明确决定整批批准，没有自动批准。
- 与正式库规范化英文精确重复均为 0；另逐条记录近似表达、包含关系和学习目标重叠提示。
- 重点人工辨别的相邻表达包括：`take no interest in` / 库内 `take pleasure in`，`measure the value of something in terms of something` / 库内相关 `measure effectiveness` 与 `in terms of`，`in times of real need` / 库内 `those in need`，`be fully aware of the consequences` / 库内 consequences 相关表达。它们不是精确重复，但可能造成学习目标重叠。
- 没有为凑数收录基础或过窄表达；例如 `on display`、`flash on and off`、`feel envious of` 未进入本批候选。

## 已完成工作与人工门禁

1. 已归档两张原始扫描和两份逐字转写，并计算整课与逐段 SHA-256；
2. 已建立两个 `language_richness_corpus` source records；
3. 已按 4 个原始段落扫描并生成句子与 Collocation candidate；
4. 已完成全库精确、近似和学习目标查重；
5. 已生成 `sources/metadata/nce3-candidate-review.md` 审核清单；
6. 用户已于 2026-08-18 整批批准 5 个句子与 21 个 Collocation；句子自带经本批审核的结构仿写练习；
7. 21 个 Collocation 的换场景 Use 题仍需另行生成和审核，当前不伪造正式 Use 题。
