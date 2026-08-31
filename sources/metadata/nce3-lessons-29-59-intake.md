# 《新概念英语 3》第 29、38、41、44、45、47、51、53、55、59 课接收与处理记录

- 登记与发布：2026-08-19
- 来源网站：https://nce.luzhenhua.cn/NCE3/
- 来源角色：`language_richness_corpus`
- 来源性质：语言丰富度教材课文，不是 IELTS model essay
- 最终状态：10 课网页正文已归档；29 张句子卡和 36 条 Collocation 已按用户整批决定发布

## 处理范围

| 课次 | 标题 | 原文段落 | 句子卡 | Collocation |
|---:|---|---:|---:|---:|
| 29 | Funny or Not | 2 | 3 | 3 |
| 38 | The First Calendar | 2 | 4 | 4 |
| 41 | Illusions of Pastoral Peace | 3 | 2 | 3 |
| 44 | Speed and Comfort | 4 | 2 | 3 |
| 45 | The Power of the Press | 3 | 3 | 4 |
| 47 | Too High a Price | 2 | 2 | 3 |
| 51 | Predicting the Future | 2 | 3 | 4 |
| 53 | In the Public Interest | 2 | 3 | 4 |
| 55 | From the Earth: Greetings | 4 | 3 | 4 |
| 59 | Collecting | 3 | 4 | 4 |
| **合计** |  | **27** | **29** | **36** |

## 归档与来源说明

- 原文逐课保存在 `sources/raw/new-concept-english-3/lesson-<课次>.txt`；段落边界按课文信息组织恢复并写入 source paragraph records。
- 每个 source 保存网页 URL、访问日期、整课与逐段 SHA-256；页面和数据层均明确标注为“语言丰富度语料”。
- 网站存在少量明显的转写异常，例如第 29 课 `from U.S.`、第 47 课 `Industriallized farming metheods` 和第 55 课 `far to hot`。raw 层忠实保留网页文本，存在异常的句子不进入学习卡或 Collocation，不静默伪造教材正文。
- 本批不保存或展示 IELTS Band、考官评语或 IELTS 题目；`question_type` 为 `not_applicable`。

## 筛选与查重

1. 逐段扫描全文，不按每课固定数量凑句。
2. 优先保留完整句子的逻辑框架、信息组织与自然写法；纯故事细节、过时叙事表达和转写异常句大量排除。
3. Collocation 作为第二层学习对象，只保留能换到正式写作新场景、搭配边界清楚的表达。
4. 与发布前 157 张句子卡和 221 条 Collocation 做规范化精确查重，并在审核清单中记录最近相似项；精确重复为 0。
5. 每张句子卡和每条 Collocation 都带完整中文 Use 题、目标隐藏、参考答案和来源定位。
6. 65 条 Use 参考答案全部脱离原句完成 native-naturalness check；修正了平行结构、题干答案错位、搭配对象与不自然的机械迁移。

## 审核与发布决定

- 内容先由 `scripts/generate-nce3-candidates.mjs 29-59` 生成 candidate，并通过 Schema、来源定位、hash、查重和 Use 对应校验。
- 用户于 2026-08-19 明确要求本批全部完成后无需逐条复核，允许在上述检查通过后整批发布；该决定写入每项 `review_history`，没有从 raw source 绕过 candidate 状态直接写库。
- 发布脚本：`scripts/approve-nce3-candidates.mjs 29-59`；脚本支持幂等发布及参考答案修订升级。
- 发布后规模：40 个来源、187 个句子候选、186 张正式句子卡、257 个 Collocation 候选、257 条正式 Collocation。

## 验证

- `npm run validate:content`：通过。
- Schema fixtures：18 项通过；规则单元测试：55 项通过；数据库集成测试：10 项通过。
- `npm run typecheck` 与生产构建通过。
- 浏览器实测：来源筛选显示 12 篇《新概念英语 3》原文；第 59 课原文显示 4 张句子卡和 4 条 Collocation；句子 Learn、Sentence Use、Collocation Use 均可访问，题干与参考答案一致；控制台无警告或错误。
