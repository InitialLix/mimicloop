# MimicLoop 第一阶段实施计划

本文是执行状态的唯一入口。产品边界以 `docs/product-spec.md` 为准，技术或范围变化通过 ADR 记录。

## 总体框架

```text
A. 项目与内容地基
   范围冻结 → 内容规范 → Schema → 校验与查重

B. 真实内容验证
   官方/Cambridge 原文归档 → AI/Codex 候选提取 → 人工审核 → approved seed

C. 本地数据能力
   SQLite → migrations → repository/service → 导入导出与恢复

D. 核心产品闭环
   语料库/审核 → Learn → Recall → Use → Review

E. 交付验证
   单元/集成/E2E → 数据恢复 → 跨天调度 → 视觉验收
```

## 状态说明

- `未开始`：尚未进入；
- `进行中`：当前唯一主阶段；
- `已完成`：全部验收条件通过；
- `受阻`：缺少用户材料、权限或关键决策。

## 阶段状态

| 阶段 | 状态 | 核心产出 | 完成门槛 |
|---|---|---|---|
| 0. 范围冻结与项目地基 | 已完成 | README、AGENTS、ADR、实施计划 | MVP、来源策略、筛句原则和技术基线无隐性依赖 |
| 1. 内容规范与 Schema | 已完成 | content guidelines、四个 JSON Schema、版本策略 | 任意目标句可完整表达，错误信息可理解 |
| 2. 官方 / Cambridge 种子来源 | 已完成 | 官方材料归档；Simon 教育/科技/环境开发种子与 metadata | 正文、来源类型、band/评语、定位、hash 可追溯 |
| 3. 候选卡与人工审核 | 已完成 | candidate cards、校验/查重、approved seed | 至少 15 张真实卡通过人工审核 |
| 4. 数据库与基础后端 | 已完成 | SQLite、migration、repository/service、备份恢复 | 重启保留数据，重复导入幂等，空库可恢复 |
| 5. 内容维护与学习卡 | 已完成 | 语料库、候选审核、句子详情、学习卡 | 可完全手动维护；卡片明确展示学习价值与来源 |
| 6. 练习与复习调度 | 已完成 | Recall/Use、自评、尝试记录、透明间隔规则 | 句子与 Core 均走通 Learn → Recall → Use，第二天调度正确 |
| 7. MVP 验收与交付 | 已完成 | 测试、视觉检查、README、可恢复备份 | 第一阶段个人自用本地 MVP 完成；公开部署与多人隔离不属于本次完成范围 |

当前结论（2026-08-31）：第一阶段已冻结。正式库包含 28 篇 Simon Task 2 范文、12 篇《新概念英语 3》课文、186 张正式句子卡、286 条 Core 与 115 条 Appreciation。Phase 2.0–2.4、2.5A 与 2.5B 已通过用户产品验收；2.5C–2.5H 已完成当前实现、自动验证与真实 DeepSeek 快速体验路径，等待用户对完整闭环和自带 Task 2 新题入口做产品验收。Recall、既有自评和确定性调度仍保持原逻辑，AI verdict 不直接写学习进度。

## Phase 2 Learning Agent 增量状态

| Phase | 状态 | 核心产出 | 完成门槛 |
|---|---|---|---|
| 2.0 Repository Audit 与范围门禁 | 已完成 | 实际架构映射、ADR、规则更新、备份兼容修复 | 旧流程不变；备份往返保留两个 Use rollout 设置；全量验证通过 |
| 2.1 Open-ended Use Evaluator | 已完成 | 单一 provider、`use-eval.v1`、可信上下文、幂等 evaluation、fallback、trace、双 Use UI | 49 条 Sentence + Collocation approved baseline 达标 |
| 2.2 Minimal Teaching Actions | 已完成 | PASS / RETRY / GIVE_MINIMAL_HINT / SHOW_REFERENCE | Sentence 与 Collocation 均通过动作、fallback 与自评兼容验收 |
| 2.2S Sentence Use rollout | 已完成 | 结构仿写与词块应用批改、Sentence gold set、双 Use 覆盖矩阵 | 两类 Sentence Use 通过评价、动作、回退、自评兼容、测试与浏览器验收 |
| 2.3 Learner Model | 已完成 | append-only evidence、确定性 reducer、历史保守回填与只读学习档案 | 技术与用户产品验收通过；不改 Today 与复习排程 |
| 2.4 Adaptive Next-Step | 已完成 | 有限动作、guards、reason codes、幂等复测计划与有界记忆排序 | 自动验证与用户产品验收通过 |
| 2.5 Guided Writing | 进行中（2.5G–2.5H 待用户验收） | 可信 Task Analyzer、两个主体段、Introduction、Conclusion、四段原文闭环、自带 Task 2 新题入口 | 用户验收全文闭环与新题入口；不进入 Task 1 或 Band 评分 |

### Phase 2.5F–2.5G 当前实现与验证记录

- [x] 两段正文和 Introduction 均通过后，才开放 learner-owned Conclusion；结论只检查收束、一致性、新观点和语言，不生成结论；
- [x] 全文只按 Introduction → Body Paragraph 1 → Body Paragraph 2 → Conclusion 拼接四段已保存原文，不自动润色；
- [x] 终检分开显示 Task Response、Coherence 与 Language，每轴最多一个优先问题，不给 Band 分数或整篇改写；
- [x] Task 2 词数由确定性代码计算；少于 250 词时，无论模型原判如何，Task Response 必须提示继续展开已有论证；
- [x] 正式语料使用汇总只读取两段正文已通过的节点语言尝试；无真实记录时显示 0，不伪造使用或掌握；
- [x] Conclusion、全文 review、trace 和四段引用进入 append-only SQLite 与备份 v1.10，刷新和恢复后保持原文及结果；
- [x] 18 项 Schema fixtures、176 项规则单元测试、47 项数据库集成测试和生产构建全部通过；
- [x] 真实 DeepSeek 快速体验完成一篇 223 词四段作文：Conclusion 通过，全文连贯与语言通过，Task Response 因少于 250 词稳定要求再修改；刷新后结果恢复正常；
- [ ] 用户在桌面页面完成 Phase 2.5G 产品验收；本次真实路径没有调用正式语料，汇总如实显示 0 项，因此“语料迁移进入全文”的展示仍需另选一个有真实匹配的节点验证。

### 比赛申报材料统一底稿

- [x] 建立 `docs/competition-application-master-materials-2026-08-31.md`，统一整理产品定位、当前功能、来源策略、IELTS 官方对齐、内容工作流、技术架构、DeepSeek/Agent 边界、研发难题、用户—AI 协作亮点、验证证据、风险和比赛展示故事线；
- [x] 明确区分已实现、已验证、待用户验收和后续规划，保留“独立非官方工具、无 Band 评分、无提分保证、当前 Simon 为教师范文”的对外边界；
- [x] 为产品介绍、技术与应用、创新与优势三个限字栏目提供后续独立对话的统一读取提示，当前不提前锁死最终 500/300/300 字版本。

### 评委短期体验链接部署规划

- [x] 重新审计 Git、secret、SQLite、公开路由、单 learner 状态和既有 Railway 方案；当前仓库尚无 commit、remote，原始 PDF 未被忽略，不能直接 push；
- [x] 决定 GitHub 只作为 private source/CI，最终网站使用 Railway Node.js service + persistent volume，不采用会丢失 Route Handlers、SQLite 写入和 DeepSeek 的 GitHub Pages 静态导出；
- [x] 将“评委异步短期体验”与“未来多人公开 Beta”分开；本次推荐签名 cookie + 每浏览器独立短期 SQLite 副本，不提前迁移账号与 PostgreSQL；
- [x] 列出 competition mode、内部路由保护、approved-only seed、volume bootstrap、AI 限流、healthcheck、noindex、内容展示边界和提交前验收清单；详见 `docs/deployment-plan.md`；
- [ ] 待用户确认链接截止时间和表单是否支持访问说明后，开始阶段 A：冻结可提交仓库。GitHub repo、push、Railway service 与可能费用均未创建。

### Phase 2.5H 自带 IELTS Writing Task 2 新题入口

- [x] 写作页允许粘贴一条完整英文 Task 2 题目；DeepSeek 只判断是否为 Task 2、现有六类题型和一个宽主题，不生成观点、提纲或范文；
- [x] 模型结果只是 first pass，learner 必须在界面确认或改正题型与主题后，服务端才保存可信题目并建立既有 Essay Map；AI 失败时原题保留并允许手动确认；
- [x] 导入题使用独立 `guided_writing_prompt` 语义记录和 append-only analysis/trace，不冒充范文、raw source、approved 语料或掌握记录，并从原文语料库列表过滤；
- [x] 确认后的题目直接复用现有 Task Analyzer → Essay Map → English Coaching → 节点语言激活 → Paragraph Weaving → 四段闭环，不另建一套写作流程；
- [x] 新题、分析记录和安全 trace 纳入 migration 与备份 v1.11；重复确认幂等，URL 保存选题，刷新恢复同一道题；
- [x] 真实浏览器粘贴一条未预置的远程办公题：DeepSeek 识别为“双问题 / 工作与经济”，learner 确认后练习题由 28 变为 29，两段分别回答两个问句，进入首个英文 Position 问题；刷新仍停在该题，原文语料库仍只有既有 40 篇原文；
- [x] 全量内容校验、42 个单元测试文件共 180 项、5 个数据库测试文件共 48 项、TypeScript 和 20 页生产构建全部通过；
- [ ] 用户在桌面页面完成 Phase 2.5H 产品验收；Task 1、自动观点供应和 Band 评分继续不在范围内。

### Phase 2.0 审计记录与任务

- [x] 完整阅读交接文档、现有人工原型、当前产品概览和 `docs/agent-phase2-spec.md`；
- [x] 审计 Sentence Use、Collocation Use、attempts、自评、SQLite、Today、备份和测试；
- [x] 确认当前无 feature flag、LLM SDK、Evaluator、trace 或独立 exercise ID；
- [x] 确认现有 Use 自评与次日调度保持确定性，Phase 2.1 不由模型 verdict 改写；
- [x] 通过 ADR 0010 和 `AGENTS.md` 将运行时授权收窄到 feature-flagged Use Evaluator；
- [x] 修复备份未保存 `collocation_use_started_at` 的兼容缺口并增加往返测试；
- [x] 运行 Schema、规则、数据库、TypeScript 与生产构建全量验证；
- [x] Phase 2.0 验收通过后，将 2.0 标记完成并开始 2.1。

### Phase 2.0 验证记录

- 备份 v1.1 现在导出并恢复 `collocation_use_started_at`；v1.0 缺失该字段时按恢复时间保守初始化；
- Schema fixtures、65 项规则单元测试和 11 项数据库集成测试通过；
- `npm run typecheck` 与 `npm run build` 通过；
- 现有 Sentence / Collocation Recall → Use、自评、次日调度和所有页面路由未改动。

### Phase 2.1 实现与验收状态

- [x] 在现有 Collocation Use 页面增加默认关闭的“检查我的句子”，不改写 Sentence Use，也不重构既有自评和调度；
- [x] 服务端用 `collocation:{id}:guided_application:{revision}` 从 approved SQLite 内容重建题意、目标表达、accepted variants 和参考答案，不信任客户端目标元数据；
- [x] 接入单一 DeepSeek Chat provider adapter、显式 `deepseek-v4-flash` 配置、非思考 JSON mode、本地 `use-eval.v1` Schema 与 attempt/span/pass 等语义校验；
- [x] 增加稳定 attempt ID、`use_evaluation_runs`、`agent_traces`、超时/非法输出/低置信度/缺配置 fallback 和重复提交幂等；
- [x] 既有 sentence/collocation attempt 写入接受稳定 ID，同 payload 重试不重复更新复习状态，不同 payload 冲突返回 409；
- [x] 备份升级到 v1.2 并覆盖 evaluation/trace 往返；仍可恢复 v1.0/v1.1；
- [x] 建立 32 条 evaluator gold set 和 provider-independent metrics runner；包含自然改写、漏目标、搭配错误、语法/语义、空答案、中文、无关、prompt injection 与困难可接受变体；
- [x] Schema fixtures、78 项规则单元测试、17 项数据库集成测试、`npm run typecheck` 与 `npm run build` 通过；timeout、malformed output、缺配置、trace 字段和重复写入均有覆盖；
- [x] 用户分四批逐条确认全部 32 条 labels，gold set 已升级为 approved；
- [x] 在 `deepseek-v4-flash` 上运行首次 `npm run eval:use-gold`：32 条中 26 条 Schema-valid，false-pass 6.67%，fallback 18.75%，duplicate-write 0%，p95 3452 ms；结果与初始阈值见 `docs/use-evaluator-baseline-2026-08-19.md`；
- [x] 用 v4 prompt、JSON 样板、`temperature=0` 和不放松的本地校验完成 Flash/Pro 对照；DeepSeek V4 Pro 连续两轮 32/32 Schema-valid、verdict agreement 100%/96.88%、false pass/fail 0、fallback 0、duplicate write 0，通过最终风险优先门槛；
- [x] 确认 AI 开关关闭时完整旧流程可用，Phase 2.1 标记完成；下一步只能讨论 Phase 2.2，不得直接扩展到 Guided Writing。

运行配置与评测口径见 `docs/use-evaluator-operations.md`；Collocation 历史 baseline 见 `docs/use-evaluator-baseline-2026-08-19.md`，Sentence + Collocation 合并验收见 `docs/use-evaluator-baseline-2026-08-20.md`。当前验收覆盖两类 Use，但不得外推成 Learner Model、Adaptive Next-Step、作文评分或 Guided Writing 已验收。

### Phase 2.2 最小实现与验收状态

- [x] 只在现有 Collocation Use 垂直切片上增加确定性教学动作；Recall、Sentence Use、既有自评与调度未改动；
- [x] 固定动作为 `PASS`、`RETRY`、`GIVE_MINIMAL_HINT`、`SHOW_REFERENCE`；模型只产出评价，服务端规则负责选动作；
- [x] 每题最多允许两次修改；相同最小提示不会原样重复，达到上限或无法可靠判断时引导查看已审核参考答案；
- [x] 前端展示动作按钮和修改路径；若 AI 在参考答案揭晓前已判定 `PASS`，之后对照答案仍记为独立产出；先看答案或根据失败反馈修改才标记“使用过提示”；
- [x] SQLite 保存上一版 attempt、`retry_index` 与教学动作；备份升级到 v1.3，并为旧 v1.2 记录保留缺省恢复路径；
- [x] 18 项 Schema/内容 fixtures、83 项规则测试、19 项数据库集成测试、TypeScript 与生产构建通过；provider 临时失败后可用新的 evaluation ID 重试且不消耗学习者修改次数；
- [x] 本地浏览器实测三轮确定性路径：首轮最小提示 → 次轮不重复提示 → 第三轮 `SHOW_REFERENCE`；参考答案标记、自评入口和小屏显示正常，控制台无应用错误；测试生成的 3 条 evaluation/trace 已从个人数据库精确清理。
- [x] 用户实际使用确认：AI 在答案揭晓前判定 `PASS` 后再对照参考答案仍属于独立产出；规则、保存字段和页面文案已同步修正并完成真实 DeepSeek 页面复测，复测记录已精确清理。
- [x] `PASS`（含仅有轻微非阻断问题）后自动在 AI 判断下方展开参考答案和自评；真正需要修改的答案仍只给最小提示，不提前泄露答案。
- [x] 检查按钮保持通用文案；反馈标题从服务端 trace 返回并显示本次实际具体模型，例如 `AI 反馈 · deepseek-v4-flash`，不写死提供方版本。
- [x] AI 反馈存在语法、搭配或目标表达问题时，先展示“先改这里”，再展示已完成的题意部分；题意标签明确写成单项维度，避免“题意完整”被误读为整句完全正确。
- [x] 收紧小语法错误判定：主谓一致、单复数等局部错误即使不阻断整体通过，也必须作为非阻断问题明确返回。
- [x] 完全通过且没有待改问题时播放克制的成功动画；通过后可点“尝试其他写法”开启一次新的 AI 判断，不消耗纠错次数，并在已看参考答案后如实标记提示使用。
- [x] DeepSeek 仅因 `FABRICATED_EVIDENCE_SPAN` 未通过本地校验时，后台自动补做一次模型请求；第二次仍无效才降级提示，且 trace 记录两次调用与合计 token 用量。
- [x] PASS 反馈区分“完全正确”与“带小语法/拼写问题”：前者提供“尝试其他写法”并清空输入，后者提供“修改这句话”并完整保留原答案，只收起反馈与参考答案供局部修正。
- [x] 将机械笔误与拼写不稳、语法/词形和逻辑问题分级：新增非阻断 `typo`，单个明确笔误不单独导致失败、不提前揭晓参考答案、不计为内容提示或占用纠错次数；混合问题分行展示并由主要问题决定 verdict。用户确认的 `simulationr` 回归案例已加入第 50 条 approved gold label；v11 真实 DeepSeek 基线 50/50 Schema-valid、verdict 98%、false pass/fail 0、blocking precision/recall 100%、fallback 0，隔离浏览器验证原句保留且无错误。
- [x] 从句子库或搭配库进入详情时，非今日学习入口统一使用浏览历史返回，恢复原列表与原滚动位置，不再新开一个置顶的列表页。

Phase 2.2 不让 AI verdict 直接写入学习进度。用户仍需查看参考答案并自评，既有确定性调度只读取正式的自评 attempt。

### Phase 2.2S Sentence Use rollout 门禁

- [x] Repository Audit：Sentence Use 已有结构仿写与词块应用、稳定正式 attempt、自评及复习调度；缺口仅在评价 exercise ref、可信上下文装载、API 类型和反馈 UI。
- [x] 结构仿写按 `sentence_pattern` 评价结构关系、题意、语法和自然度，不要求含占位符的 pattern 成为答案字面子串。
- [x] 词块应用按已审核 `target_chunk` 评价，继续要求目标表达自然出现。
- [x] 复用 `use-eval.v1`、四种确定性教学动作、两次修改上限、自动格式重试、fallback、trace 与具体模型显示。
- [x] AI verdict 不写入 `attempts` 或 `review_states`；只有用户查看参考答案后的自评继续驱动既有调度。
- [x] 已建立 `tests/fixtures/use-evaluator-sentence.approved.json`：17 条覆盖结构/词块、自然变体、局部语法/拼写、漏目标、语义偏差和不可判断；用户已逐条确认并升级为 approved。
- [x] 浏览器真实验证结构仿写与词块应用均能调用 `deepseek-v4-flash`、显示具体模型、PASS 后自动展开参考答案，并保留“AI 先判对仍算独立产出”的自评语义；验收产生的两条 evaluation 与 trace 已精确清理，未产生正式自评 attempt。
- [x] Sentence 与 Collocation 的评价、动作、fallback、自评、数据库、备份、关闭开关和页面行为全部通过；49 条合并 baseline 的 Schema-valid 100%、verdict 95.92%、false pass/fail 0、target 97.96%、blocking precision/recall 100%、fallback 与 duplicate write 0、p95 2900 ms，允许开始 Phase 2.3。详见 `docs/use-evaluator-baseline-2026-08-20.md`。

### Phase 2.3 Repository Audit 与最小实现方案

- [x] 审计现有 `attempts`、`collocation_attempts`、`review_states`、`collocation_progress`、Use evaluation/trace、备份与进度页；确认正式 Use attempt ID 可与 evaluation 对齐，无需重构旧表。
- [x] 固定保守映射：Recall 使用自评与确定性匹配；Use 仅纳入已经完成自评的正式 attempt，校验通过的 evaluation 负责补充 verdict/confidence/版本，fallback 或旧记录最多提供 `partial`，不能凭自评升级为独立成功。
- [x] 固定能力边界：Sentence slot replacement 与 Collocation `cross_topic` 记为 Transfer Use；Sentence guided application 与 Collocation `slot_replacement` 记为 Guided Use；当前没有可信的 Spontaneous Use 采集场景，保持 `unknown`。
- [x] 新增 append-only `learning_evidence`、幂等历史回填与 v1.4 备份兼容。
- [x] 新增 `learner-state-reducer.v1`，验证低置信、`cannot_judge`、看过参考答案与单次成败不会夸大学习状态。
- [x] 在学习进度页加入只读学习档案；不改变 Today、`review_states`、`collocation_progress` 或下一步选择。
- [x] 用户实测后修正能力卡片口径：大数字改为“已有正式作答证据”的项目数，掌握层级仍分别显示 weak / developing / stable，不再把已保存的 weak evidence 表现成大号 `0`。
- [x] 补齐只读单项证据详情：学习档案的句子/搭配行先进入独立记录页，展示四维状态、判断原因、历次答案、自评、提示使用、AI verdict 与模型，再由显式按钮进入旧学习/Recall/Use；不加入 Phase 2.4 自动决策。
- [x] 保留学习记录的导航上下文：从详情页进入 Sentence/Collocation Recall 或 Use 时，左上角和练习完成后都返回当前学习记录；Today 队列和语料库原有导航保持不变。
- [x] 根据用户产品复检精简单项记录页：四维状态仅保留在 reducer，前台合并为单一学习阶段、简短原因、更强证据条件和最近记录；完整 evidence 默认折叠，Sentence 明示真正的结构/表达训练目标。新增 4 项 presenter 规则测试，不引入 Phase 2.4 自动选题。
- [x] 再次按用户复检去除报告式排版和口语化结论：单项页改为统一字号的五行事实摘要，移除重复结论卡和“能……，但……”式文案；技术证据仍默认折叠。
- [x] 将能力档案证据起点固定为首次真实 AI evaluation（`2026-08-19T13:21:16.859Z`）：删除此前 74 条派生 evidence，保留之后 9 条；63 条 Sentence attempts、20 条 Collocation attempts、Today 与既有复习排程均未删除，旧证据不会被再次回填。
- [x] 修正 Recall 的提示语义：正常的“先写、后揭晓、再自评”仍记为独立回忆；揭晓后输入框锁定，只有收起答案后继续修改才标记使用过提示。Sentence Recall 与 Collocation Recall 保持一致。
- [x] 通过 18 项 Schema fixtures、98 个规则单元测试、24 个数据库集成测试与 TypeScript；真实浏览器确认 `/progress` 读取 9 条 evidence、单项页只显示紧凑事实摘要且完整历史默认折叠。
- [x] 用户确认学习档案的呈现与解释口径，Phase 2.3 验收通过并允许进入 2.4。

### Phase 2.4 Repository Audit 与最小实现方案

- [x] 审计 Today 队列、Sentence / Collocation Recall → Use → 下一项导航、旧自评与次日调度；确认当前下一步完全固定，不读取 Learner Model。
- [x] 审计稳定触发点：正式 Sentence / Collocation Use attempt ID 已幂等并能对齐 evaluation 与 evidence；v1 不改动仍由服务端随机生成 ID 的 Recall 写入。
- [x] 审计 approved exercise 库存：171 张结构/综合句各有 1 套 slot replacement，15 张词汇句各有 1 套 guided application；286 条 Core 各有 1 套 Use，其中 162 条 cross-topic、124 条 slot replacement。
- [x] 确认当前没有任何资产同时拥有 Guided + Cross-topic 两套已审核练习；planner 必须以 exercise availability guard 失败关闭，不能临时生成或伪造训练内容。
- [x] 确认 Phase 2.2 已负责正式自评前的即时 RETRY / minimal hint；Phase 2.4 v1 只在正式 Use 保存后选择跨步骤动作，不重复即时修改链。
- [x] 提出最小效果：Use 完成态显示单一紧凑下一步，支持继续、返回来源、存在 approved exercise 时进入 Guided / Cross-topic，以及幂等安排 lower-scaffold / retention retest；用户可按原队列继续。
- [x] 提出 additive `adaptive_training_decisions`、`adaptive_retests`、默认关闭 feature flag、备份兼容与测试方案；不修改 attempts、`review_states`、`collocation_progress`，不重排完整 Today 队列。
- [x] 用户确认 `docs/adaptive-next-step-v1-plan.md` 的规则、复测时间和页面效果并允许开始实现。
- [x] 实现无模型调用的 `adaptive-policy.v1`：对 unavailable、failure、assisted pass、guided success、transfer success 和 exercise guard 做确定性选择并保存 reason codes。
- [x] 新增 additive `adaptive_training_decisions`、`adaptive_retests` 与幂等 repository；同一正式 Use attempt 重放不重复新增 decision、trace 或 retest。
- [x] 接入 Sentence / Collocation Use 保存接口；任何自适应异常都只回退原下一项，不回滚已经保存的作答、自评和旧调度。
- [x] 两个 Use 完成页改为紧凑的单一下一步；建议偏离固定队列时保留“按原计划继续”，开关关闭时保持旧页面行为。
- [x] 备份升级至 v1.5 并兼容 v1.0–v1.4；18 项 Schema fixtures、110 个规则测试、26 个数据库集成测试、TypeScript 与生产构建全部通过。
- [x] 用隔离 SQLite 在浏览器完成 Sentence 与 Collocation 各一次正式 Use：各生成 1 条 decision / trace，完成页显示确定性下一步且无浏览器错误；临时数据库已清理，个人学习记录未受影响。
- [x] 细分修改后通过的下一步：确定性读取已保存的有界 evaluation chain；单个非阻断局部语法/普通拼写修正安排次日“快速确认”，目标表达、搭配、意义或多轮修正安排“提示复测”，纯笔误仍保持独立完成与 72 小时“保持复测”；不增加 DeepSeek 调用，不改旧自评和复习状态。18 项 Schema fixtures、123 个规则单元测试、28 个数据库集成测试、TypeScript 与生产构建通过。
- [x] 根据产品验收修正 Today 的固定首项与固定新旧比例：新增只读、additive 的有界记忆策略；同到期内容按到期复测 → 到期时间 → 最久未复习 → Learner Model 平局顺序选择，到期积压时最多把一半新内容名额让给复习。旧 daily-plan 默认调用保持兼容，不改 attempts、自评、interval、evidence、retest 状态或任何历史数据，也不将这一小步标记为完整 Phase 2.7。
- [x] 开启 `MIMICLOOP_ADAPTIVE_NEXT_STEP_ENABLED=true` 并完成用户产品验收；用户确认进入 Phase 2.5。

### Phase 2.5A Task Analyzer 与 Essay Map

- [x] 先限定最小切片：不直接要求 120 字，不生成正文，不预测 Band；先完成整题审题和段落分工。
- [x] 只读取 28 道已归档 IELTS Task 2 题目及人工标注的六类 `question_type`，不信任客户端提交的题目或类型。
- [x] 新增确定性 `essay-task-analysis.v1`：提取题目指令、任务边界、必须回答的部分，以及推荐起始段落的职责。
- [x] 新增独立 `/writing` 板块与首页、侧栏入口；视觉采用“题目阅读面 + Essay Map”，不使用聊天式界面或重复状态卡。
- [x] 逐题切换时更新题型、任务清单、边界词和推荐起始结构；第三阶段“逐段写作”明确锁定，避免宣传尚未实现的能力。
- [x] 用户复检发现首版虽然更换段落职责，却把 28 题全部画成相同四段纵向地图；修正为六类不同论证关系：立场支撑、双观点判断、利弊权衡、因果应对、影响评价与双问题回应。
- [x] 四段只标记为可调整的常用起点，不再冒充固定模板；discussion 可按独立判断扩成五段，双问题某一问需要多个理由时也可调整段落数。
- [x] 28 道题全部通过覆盖测试；六类题型各有独立 argument map，且规则明确区分二元权衡与非二元论证。
- [x] 18 项 Schema fixtures、134 个规则单元测试、28 个数据库集成测试、TypeScript 与生产构建通过；浏览器实测观点题与原因方案题显示不同论证关系。
- [x] 用户验收审题准确性、信息密度和页面视觉，并明确进入 2.5B；教学问题和回答默认使用英语。

### Phase 2.5B English Argument Coaching

- [x] 将首个主体段的构思固定为 `stance → claim → reason → mechanism → result`；Agent 一次只诊断一个节点，不给观点、改写句或示范段落。
- [x] 所有教学问题、learner 回答与逻辑反馈默认英语；中文只保留导航、配置和故障说明。构思阶段允许小语法或拼写错误，不因语言表面问题阻断清楚的观点。
- [x] 新增 `guided-writing-coach.v1` Schema 与本地语义校验；模型只返回 relevance、logic、specificity、issue 与一条短英文观察，本地 policy 决定接受、重试或进入下一节点。
- [x] 客户端只提交 session ID、turn ID 和 learner answer；服务端重新读取已归档题目、人工题型、任务要求和 Body Paragraph 1 职责，不信任客户端题目上下文。
- [x] 新增 `guided_writing_sessions`、`guided_writing_turns`、argument graph 与 origin；重复 turn 幂等，失败时保留答案且不推进节点，trace 不保存原始回答。
- [x] 备份升级至 v1.6，并兼容 v1.0–v1.5；写作 session、turn 与 coach trace 可完整往返。
- [x] 页面采用 Argument Chain + Current Question 工作台，不使用聊天气泡；切题答案接受后原句进入对应节点并显示实际 DeepSeek 模型。
- [x] Position 只判断总体立场，不提前索要 reason、mechanism 或 result；`missing_logic` 仅允许用于 Mechanism/Result。历史上与当前节点不匹配的反馈在读取时标为不可执行，不改写或删除原 turn，并把 learner 原回答带回输入框重检。
- [x] Claim 问题按可信题型与 Body Paragraph 1 职责生成：discussion 解释观点 A，opinion 支持总体立场，其他题型分别处理优势、问题/原因、影响或第一问；DeepSeek 以 `paragraph.role` 和 `paragraph.goal` 判定，不把公平解释反方误判为立场矛盾。Prompt 升级为 `guided-writing-coach-v1.1`。
- [x] 为不熟悉 IELTS 段落职责的 learner 增加紧凑的 Claim step guide：只说明当前要完成什么、暂时不要做什么，不提供观点。discussion 明示公平解释观点 A，无需赞同或立即反驳；问题改为要求 learner 自己说明理性的人为何可能持有该观点。Prompt 升级为 `guided-writing-coach-v1.2`。
- [x] 在继续改代码前冻结 `docs/guided-writing-coach-v1-teaching-contract.md` Proposed 教学契约：定义五节点职责、非因果 Development、提前内容复用、上游回改、帮助阶梯、全链复检、UI 边界与 8 类验收路径；本文档不代表功能已经实现。
- [x] 按教学契约补齐 Reason / Development / Result 第一层职责：Reason 要求新增支持而非重复，前台将内部 Mechanism 改称 Development 并容纳非因果关系，Result 只完成当前段落职责；discussion 全链不再要求支持总体立场或立即反驳。Prompt 升级为 `guided-writing-coach-v1.3`。
- [x] 增加受限 `development_relation`：Reason 通过时只允许因果、原则适用、比较、问题—回应、条件限定或 unclear；`guided-writing-coach.v1.1` 校验漏报、错误节点与关系漂移，本地 policy 选择 Development 问题，append-only action 支持刷新恢复且无需 SQLite migration。Prompt 升级为 `guided-writing-coach-v1.4`。
- [x] 增加 `guided-writing-chain-review.v1` 全链只读复检：Result 单节点接受后检查段落职责、节点重复、缺失关系、过度结论、范围漂移与矛盾；本地语义校验固定 reason code 与返回节点，只有 ready 才结束，否则保留历史并退回最早问题节点。失败或 cannot judge 保留输入且不推进。
- [x] 为 Position 等全部节点增加默认收起的跨主题回答形态示例，每步两条静态文案，不针对当前题目生成观点；同时将 provider 网络失败细分为 `PROVIDER_NETWORK_ERROR`。一次无关主题的真实 DeepSeek 端到端请求通过，测试 session、turn 与 trace 已按固定 ID 清理。
- [x] 根据 IELTS 官方 Task Response 的 ideas extended/supported 与 Coherence 的 logical progression，将 Reason 的抽象 `underlying reason` 改为 fact / principle / condition 问法，并增加默认收起的 `Logic lens · What makes this true?` sceptical-reader 检查；明确它是本地教学支架而非官方固定节点。Prompt 升级为 `guided-writing-coach-v1.5`。
- [x] 用户视觉复检后将 Reason Logic Lens 从上下文中的折叠标签拆成独立常显小板块：低饱和蓝紫底色、18px 阅读字体问题标题、三个编号检查项与轻量官方依据；普通任务说明和跨主题 examples 仍维持较低视觉层级。
- [x] 第二次视觉复检不再局部修补 Logic Check，而是完成整张 Guided Writing 页的可读性调整：写作说明、Essay Map、Argument Chain、feedback、form examples、Current Question 与按钮统一提升字号和对比度，learner 原句提升至 16px，页面放宽到 1280px；禁止为“一屏装下”牺牲正文可读性。
- [x] 根据首条真实 opinion 路径完成 Phase 2.5B 流程审计，确认 Claim 可混入结果、Reason 可提前包含 Development、固定节点仍机械追问，以及 Result 可能再次重复 Claim；最小重设计记录于 `docs/guided-writing-2.5b-flow-audit-2026-08-27.md`，当前只冻结方案，不改运行时代码或旧会话。
- [x] 用户确认 2.5B 流程审计后，以 fixture 冻结节点边界、精确下游 span 与“已经写出下一环时不机械从头回答”案例；Coach 升级为 Schema v1.2 / Prompt v1.6，本地拒绝伪造、改写、重叠或跨级 span。
- [x] 实现提前内容复用：当前节点只保存 `accepted_span`，下一节点候选随 action JSON 恢复；learner 可使用原文、先编辑或另答，未经确认不写 graph。历史 v1/v1.1 多句 Reason 以本地原句提供可拒绝兼容候选，无 SQLite migration。
- [x] Position 与 Body Paragraph 1 视觉分离，主体段改为 Main point / Reason / Development / Takeaway；Development 增加 Reason → Missing connection → Main point 关系条，问题改用具体关系语言。
- [x] 增加上游回改与下游待复检：已保存节点提供明确编辑按钮；reopen 只移动 current node，不删除 graph、turn 或 trace；新答案通过后逐环提供旧下游原文复检，UI 与 repository 双重禁止跳过尚未通过的上游依赖。
- [x] 修复刷新后跳回第一篇作文：当前 `sourceEssayId` 写入 `/writing?essay=`，服务端验证并恢复初始选项，切题用 `replaceState` 避免污染浏览历史；28 题服务端渲染验证第二篇在刷新请求后仍为 selected。
- [x] 建立 `docs/ielts-official-alignment-register.md` 作为贯穿后续阶段的官方依据与产品证据登记：记录官方来源、教学转译、discussed / specified / implemented / verified 状态、验证证据及非官方背书边界；首批登记 Task Response、Coherence and Cohesion、Introduction 与 Essay Map 讨论。
- [x] 18 项 Schema fixtures、151 个规则单元测试、37 个数据库集成测试、TypeScript 与生产构建通过；现有 discussion 会话继续按可信段落职责重算，旧 v1/v1.1 Guided Writing 记录保持可读。
- [x] 真实浏览器完成 DeepSeek 首轮 Position：英文回答被接受并进入 Claim；验收产生的 1 个 session、1 个 turn 和 1 个 trace 已按精确 ID 清理。
- [x] 用户实际完成首条完整论证链，并逐步复检 Main point、Reason、Development 与 Takeaway 的职责；确认继续进入 learner-written 段落草稿与逻辑/语言分开评价。

### Phase 2.5C Node Language Activation and Paragraph Weaving

- [x] 用户完成首条完整 Body Paragraph 1 论证链并明确继续；下一切片保持在一个主体段，不因后续 Introduction / Body Paragraph 2 讨论打乱既有 Phase 2.5 顺序。
- [x] 新增 `guided-writing-paragraph-evaluation.v1`：模型分别返回 Logic 与 Language 观察，每轴最多一个优先问题；不返回 Band、完整改写、替换句、观点或范文。
- [x] 本地语义校验拒绝 draft ID 不一致、clear 仍带 issue、needs-revision 缺少 issue，以及不属于 learner 草稿的 evidence span；本地 policy 只生成 KEEP / REVISE_LOGIC / REVISE_LANGUAGE / REVISE_BOTH / CANNOT_JUDGE。
- [x] 新增 append-only `guided_writing_paragraph_drafts`：只允许已通过全链复检的 `ready_to_draft` 会话提交；draft ID 幂等，模型失败仍保留 learner 原文，trace 不复制段落。
- [x] 写作工作台增加第 4 阶段“段落草稿”：左侧保留 learner Argument Chain，右侧显示单一段落编辑区、word count 与并列 Logic / Language 反馈；minor language issue 单独标作 local surface fix。
- [x] 备份升级至 v1.7，兼容 v1.0–v1.6；session、turn、paragraph draft、evaluation 与 trace 可完整往返。
- [x] 18 项内容 Schema fixtures、155 个规则单元测试、39 个数据库集成测试和 TypeScript 通过；新增测试覆盖精确 evidence span、两个评价轴、本地 action、幂等提交、provider fallback、敏感信息边界与备份恢复。
- [x] 纠正“跳过语料调用、直接空白成文”的产品顺序错误；段落批改只保留为最后一环。
- [x] 将主交互从 2×2 corpus grid 改为 Main point / Reason / Development / Takeaway 单节点语言激活，不再保留统一“其他候选”排行榜。
- [x] 节点检索只读取 approved 句子与 `recall_use` Core，并拆成两个独立层级：一个核心句子结构 / Rhetorical Move，零至三个与当前英文语义有直接重合的辅助 Collocation；无匹配不凑数，并支持确定性 `NO CORPUS FIT`。
- [x] 每个资产明确标记迁移单位为 Collocation / Sentence Frame / Rhetorical Move，并解释适配原因及迁移边界。
- [x] 首轮真实检索复检纠正 provenance 偏置：`cross_topic` 不再加分、`same_prompt` 不再扣分；来源只用于标签与 evidence 边界。当前动物保护 Main point 的首选由不匹配的 `ban ... until ...` 骨架调整为可用的 rhetorical move；新增排序回归测试。
- [x] 提示改为 Level 0 独立写 → Level 1 中文方向 → Level 2 目标表达 → Level 3 局部骨架 → Level 4 来源参考；未展示目标时 evaluator 必须返回 `target_usage=not_required`。
- [x] 新增 `guided-writing-node-language-evaluation.v1`，分别评价 meaning / logic / target usage / naturalness；通过文本必须逐字等于 learner 输入，模型不得返回替换句。
- [x] 新增 append-only `guided_writing_node_language_attempts` 与备份 v1.8；保存节点、learner 文本、资产引用、最高提示等级、评价与 trace，不覆盖原 argument graph。
- [x] 四个节点通过后自动进入 Paragraph Weaving；初始文本只按顺序拼接 learner 的节点语言实现，再检查重复、推进、合并、衔接和 Takeaway，模型不得直接重写整段。
- [x] 修复 ready 会话中“选择语言节点”和“铅笔回改构思”容易混淆的问题：回改按钮显示明确标签；若尚未提交任何新答案，可无模型调用保留原 graph 并返回逐节点表达，不能跳过真正发生修改后的下游复检。
- [x] 设计开发期 `Fresh-User UX Review Agent v1`：使用无项目历史的独立上下文、隔离数据库和真实浏览器任务，先冻结冷启动观察，再对照验收标准；允许提出产品反对意见但不自动改代码，也不替代用户验收。详见 `docs/fresh-user-ux-review-agent-v1.md`。
- [x] 根据实际耗时将 Reviewer 重定义为 v2 “用户体验替身”：凡原本要请用户亲自点击、填写或走一遍新功能的日常任务，改派 Rapid Trial Agent，限制为 5 分钟、8 个页面动作、一个恢复路径和最多 3 个明显问题；它不再重复代码审计、实现、全量测试或产品理论评审。仅在新核心交互、正式 Phase 验收、明确 Blocker / Major、安全边界或用户要求时另行启动 v1 Full Review。详见 `docs/fresh-user-ux-review-agent-v2.md`。
- [x] 根据首次 Fresh-User 审查修复两个正式 attempt 恢复缺口：刷新时恢复每节点最新 learner text 与已提交 hint level（含 provider 失败），错误与重试提示按节点隔离；不把尚未提交的纯 reveal 冒充正式 attempt。
- [x] 收紧 primary sentence 适配：拒绝与当前节点不兼容的 counterargument 等强角色，并要求可迁移结构的固定关系词与当前语义至少有最小重合；来源例句只有动物等主题词相同不再过门槛。当前真实 Main point 返回 `NO CORPUS FIT`。
- [x] 生产构建后的隔离浏览器回归确认：provider 失败的 Main point 文本和正式 hint level 刷新后恢复；错误只显示在 Main point，切到 Reason 后不串状态；真实 Main point 显示 `NO CORPUS FIT`。
- [x] 修正节点语言激活的上下文断裂：进入阶段时自动带入 learner 刚完成的论证节点原句，不再要求重复填写；展示基于原句的简短诊断与一个优化方向，但不提供替换句或新观点。
- [x] 修正语料分层误报：完整句型继续执行严格节点角色门槛，局部 Collocation 改按当前语义独立匹配；“没有合适完整句型”不再等同于“没有任何语料支持”。
- [ ] 保存“只展开提示但尚未提交”的 reveal / selection 状态；当前正式 attempt 已保存最高提示等级，但刷新前未提交的纯提示查看不会写入事实或 learner evidence。
- [x] 在隔离数据库完成 Phase 2.5C 完整冷启动体验审查：全新 Reviewer 以“语法可靠、表达普通”的画像独立完成四节点和 74 词 Paragraph Weaving，结论为“有条件通过”；结构拆解和 learner-owned 编织产生实质价值，但语料增益与最终 Language 反馈仍不足。完整报告见 `docs/fresh-user-ux-review-phase25c-2026-08-30.md`。
- [x] 2026-08-30 完成首次冷启动部分路径：Reviewer 按“语法可靠、表达普通”的真实画像输入 Main point 与 Reason，检查两级提示、失败提交、刷新与节点切换；发现 failed attempt 未恢复到编辑器、错误状态跨节点及 Main point 结构功能错位。Reviewer 对 Reason 中常识性权威包装提出异议，Product Owner 复核后判定本例可接受，不列为缺陷；只限制新增独立论点、具体虚构证据或不合理强因果。首次隔离服务的 DeepSeek 网络错误与随后浏览器交接失败均单独标为审查环境限制，未伪装成完整产品结论。详见 `docs/fresh-user-ux-review-phase25c-2026-08-30.md`。
- [x] 根据完整 Reviewer 复现修复两个确定性缺口：刷新后按正式 attempt verdict 恢复首个未通过节点，四节点全通过时恢复 Paragraph Weaving；关系代词不再冒充结构与节点的语义重合，动物保护 Takeaway 不再首选人口增长/废物句式。新增两项回归测试，规则测试现为 166 项；生产构建与隔离浏览器复核通过。
- [x] 面向 2026-08-31 比赛提交冻结现有语料，不临时扩库；增加 approved-only 的 DeepSeek 候选选择层。模型只能选正式候选 ID 或 no-fit，不能生成新语料；未知 ID、类型错位、重复、低置信度与需复核输出由本地拒绝，网络或格式失败保持安全回退。真实联网复核确认动物保护四节点不再硬塞错配句式；当前库对该真实论证链覆盖有限，留作赛后语料缺口而非临时伪造覆盖。
- [ ] 用户在真实页面完成首轮节点提交与 Paragraph Weaving 复检；通过后再决定是否把 hint=0 的成功尝试写入正式 spontaneous-use evidence。

### Phase 2.5D Body Paragraph 2

- [x] 用户明确选择继续推进第二主体段；本切片不实现 Introduction、Conclusion、全文组装或 Band 评分。
- [x] `body_1 | body_2` 成为 session 与 paragraph draft 的受限正式字段；两段使用独立 session、graph、turn、node attempt、draft 与 trace，备份 Schema 同步接受两个 paragraph key。
- [x] 第二段只允许从同题已完成的 Body Paragraph 1 开始；继承 learner 已确认的 Position，并从新的 Main point 开始，不要求重写第一段。
- [x] 复用可信题型地图：discussion 处理第二观点，advantages/disadvantages 处理另一侧，causes/solutions 处理对应方案，two-part 回答第二问；opinion 由 learner 选择第二支持理由、必要限定或有限让步，不强制正反各一段。
- [x] 第二段复用单节点 approved 语料选择、0–4 级提示、四维节点评价、Paragraph Weaving 与 Logic / Language 分开评价；模型权限未扩大。
- [x] 第一段段落 Logic 与 Language 均 clear 后显示第二段入口；页面明确展示当前段落职责与编号，第二段完成后只说明两段已保存，不冒充全文已完成。
- [x] 新增规则与数据库测试覆盖第二段题型问题、未完成第一段时拒绝启动、Position 继承、两段 graph 隔离、第二段 draft key 与备份导出。
- [x] 隔离数据库与真实浏览器验证 Body Paragraph 1 clear → 第二段入口 → Body Paragraph 2 Main point；刷新后仍停在第二段，Position 与当前段落职责正确恢复。全量 18 项 Schema fixtures、170 项规则测试、44 项数据库集成测试、TypeScript 与生产构建通过。
- [x] 补齐双观点题第二主体段的判断收束：Main point / Reason / Development 仍只公平展开观点 B，Takeaway 才明确要求依据已保存 Position 作有限判断，并禁止新增理由；Coach prompt 升级为 v1.7，Chain Review prompt 升级为 v1.1。全量 18 项 Schema fixtures、173 项规则测试、46 项数据库集成测试、TypeScript 与生产构建通过。
- [ ] 在真实页面完成 Body Paragraph 1 → Body Paragraph 2 入口、刷新恢复、第二段节点语料与 Paragraph Weaving 复检。

### Phase 2.5E Learner-owned Introduction

- [x] 对照 IELTS 官方公开 Band Descriptors、题目指导、Introduction 指南和官方 candidate response，确定 hook 只作为可选 Relevant opening，不是独立得分项；Task framing 与 Thesis 为必需教学部分。
- [x] Introduction 只在同题 Body Paragraph 1 / 2 最新正式草稿的 Logic 与 Language 均 clear 后开放；服务端重新读取可信题目、Position、两段职责、Main point 与 learner 段落，不信任客户端提供的文章地图。
- [x] 新增独立 append-only `guided_writing_introduction_drafts`，保存 learner 三部分与合并原文；幂等冲突、失败保留、安全 trace、刷新恢复与 v1.9 备份往返不复用主体段四节点表。
- [x] 新增受限 DeepSeek Introduction evaluator，Task Response / Language 分栏，每栏最多一个优先问题；禁止 Band、改写、替换句、范文、新观点和固定模板。
- [x] 页面在第二段清楚通过后显示 Introduction 入口、可信 Position / Body plan、可选 hook 边界、三个大字号输入区、unrelated form examples、learner-only preview 与双轴反馈。
- [x] 40 个规则文件 / 173 项测试与 5 个数据库文件 / 46 项测试通过；Introduction 覆盖前置条件、Schema 语义校验、幂等、trace 不含 learner 文本、v1.9 备份往返及 approved-only 开头语料检索。
- [x] 为 Opening / Task framing / Thesis 加入逐部分语言激活：首选只读 approved、可定位到第一段且来源角色为 IELTS 范文的句式卡，主界面最多一个首选结构；Core Collocation 次级折叠，0–4 级提示与 no-fit。真实页面复检曾发现语言丰富度语料被误选为 Opening 首选，现已收紧；32 张第一段卡中 11 张 IELTS 卡进入首选池，不虚报全覆盖。
- [x] Agent 只能从服务端正式候选 ID 中选择；learner 已写草稿时首次请求提示会重新匹配，新语料可进入学习卡但不冒充已掌握。新增开头部分规则与 approved-only / primary sentence / secondary collocation 集成测试。
- [x] 隔离真实页面复检确认两层回退边界：语言丰富度语料不得成为首选；DeepSeek 不可用时，跨主题 IELTS 句式也不得由宽松确定性排序直接成为首选，只保留同题强匹配或 no-fit。
- [x] 隔离页面完成可读性与输入联动复检：三个开头输入区改为上下排列，正文输入宽度由约 219px 扩至 427px，辅助说明提升到 15–16px；Task framing / Thesis 输入能即时合并到 learner-only preview，并将语言激活切换到当前部分。
- [ ] 在真实页面完成第二主体段 → Introduction、DeepSeek 反馈、修改与刷新恢复的用户路径复检。

## v0.2 Collocation 增量状态

| Phase | 状态 | 核心产出 | 完成门槛 |
|---|---|---|---|
| 0. 审计现有项目 | 已完成 | 架构、内容、队列、数据库、备份与 UI 审计 | 明确可复用模块和兼容风险，不重构旧功能 |
| 1. 规范与 migration 方案 | 已完成 | collocation guidelines、Schema、ADR、migration/备份方案 | 合法候选可表达，错误来源定位会被拒绝，迁移可恢复 |
| 2. 全量候选生成 | 已完成 | 28 篇范文、361 个正文句扫描；候选 JSON、去重统计 | 普通正文句不因没有句子卡而被排除；候选保持 candidate，不自动批准 |
| 3. 人工审核与入库 | 已完成 | 批准、修改、拒绝、合并；正式关系 | 只有人工批准项进入正式库且不影响句子记录 |
| 4. 语料库与句子页 | 已完成 | Collocation 索引、详情、来源关联 | 可搜索、筛选并从表达回到来源句；完成用户视觉复检 |
| 5. Learn 与单一 Recall | 已完成 | Collocation 学习卡、中文到英文 Recall | attempt 与 progress 独立持久化 |
| 6. `/today` 整合 | 已完成 | 带类型的统一任务流 | 一次一个主要动作，可恢复中断，不挤压句子学习 |

### Phase 0 审计记录

- 当前真实数据为 28 篇来源范文、152 张正式句子卡；
- 55 张卡带有 chunk，共 67 次标记、66 个完全不同的文本，不能把 chunks 机械复制成 Collocation；
- `/today` 当前是仅支持句子 ID 的单队列，后续需要带 `sentence:` / `collocation:` 类型的稳定任务键；
- 现有 `attempts` 和 `review_states` 外键固定关联 cards，Collocation 必须使用独立 attempts 与 progress；
- 语料库现有轻量 tabs、搜索高亮和句子浮层均可复用；
- 当前备份 v1.0 不包含 Collocation，migration 必须与兼容旧备份的 v1.1 同步发布。

### Phase 1 任务清单

- [x] 编写 `docs/collocation-guidelines.md`；
- [x] 定义 `schemas/collocation.schema.json` 与共享枚举；
- [x] 固定 canonical form、surface form、中文提示、accepted answers、去重与人工审核规则；
- [x] 编写 ADR 0007，确认 Collocation 是独立学习对象；
- [x] 提出 additive migration、备份 v1.1、rollback 与测试方案；
- [x] 增加合法候选和错误来源定位 fixture；
- [x] 完成 Phase 1 全量测试并记录验证结果；

### Phase 1 验证记录

- 完成时间：2026-08-17；
- `npm run test:schemas`：通过；合法 Collocation candidate 被接受，错误 source surface、错误 canonical hash、缺失 canonical accepted answer 与伪 approved 历史均被拒绝；
- `npm run validate:content`：通过，现有 28 个来源、153 个句子候选、152 张正式句子卡与 15 组 Use prompts 未受影响；
- `npm test`：25 个规则单元测试与 7 个数据库集成测试全部通过；
- `npm run typecheck` 与 `npm run build`：通过；
- 本阶段没有执行数据库 migration、没有生成正式 Collocation，也没有修改现有学习记录。

### Phase 2 任务清单

- [x] 扫描 28 篇范文的全部 361 个正文句，而不是只扫描 152 张正式句子卡；
- [x] 将正文句与正式句子卡和 chunks 做可选匹配，不为无高价值表达的句子强行生成候选；
- [x] 生成 `data/candidate_collocations.json`，全部 200 条保持 `candidate`；
- [x] 为每条候选建立可回溯的 essay / paragraph / sentence / surface 与唯一 primary source；
- [x] 对存在正式句子卡的来源额外保存 card 与 learning surface；普通正文句合法保留 nullable card 关系；
- [x] 完成 canonical form、中文提示、pattern、slots、accepted answers 与优先级的首轮整理；
- [x] 完成精确 hash 去重、跨来源聚合与近似表达分组；
- [x] 输出 `data/candidate_collocations.stats.json` 与 10 批人工审核清单；
- [x] 将真实候选文件接入 `npm run validate:content`，检查 Schema、来源定位、hash、slots 与重复项；

### Phase 2 生成与验证记录

- 完成时间：2026-08-17；
- 初版只扫描 152 张正式句子卡、得到 86 条候选；用户验收指出普通正文句也应提供 Collocation，因此该范围结论被撤销并重新执行 Phase 2；
- 完整扫描 28 篇范文的 361 个正文句，生成 200 条候选，覆盖 181 个来源句；其余 180 句不凑数；
- 86 条候选关联至少一张正式句子卡，115 条候选包含至少一个普通正文句来源；
- 类型分布：166 条 `collocation`、24 条 `fixed_phrase`、10 条 `sentence_frame`；
- 优先级分布：129 条 `core`、71 条 `supporting`；34 条可直接定位到现有 exact chunk，7 条聚合了多个来源；
- 六组近似表达只标记为存疑组，没有自动合并：`quality-of-life`、`importance-on`、`take-steps-response`、`emphasis-on`、`role-in`、`effort-to`；
- `sources/metadata/collocation-candidate-review.md` 按每批 20 条拆为 10 批；
- `npm run audit:collocation-scope`：通过，确认 361 个正文句中 152 个有正式句子卡、209 个没有句子卡，全部纳入扫描范围；
- `npm run validate:content`：通过，真实 200 条候选的 Schema、范文原句定位、可选卡片定位、hash、slot 与重复检查全部通过；
- Schema fixture 同时验证“有卡来源”和“普通正文句来源”；伪造 learning surface 或错误正文句定位都会被拒绝；
- `npm test`：25 个规则单元测试与 7 个数据库集成测试全部通过；
- `npm run typecheck` 与 `npm run build`：通过；
- 本阶段没有批准候选、没有执行数据库 migration、没有改变句子学习与复习数据。

### Phase 3 任务清单

- [x] 执行只新增 Collocation 表与索引的 migration，不修改现有句子表；
- [x] 将 200 条候选以独立 import hash 幂等写入 `collocation_candidates`；
- [x] 建立每批 20 条、按状态筛选的人工审核列表；
- [x] 建立单条编辑、保存、批准、暂缓、驳回与合并操作；
- [x] 在审核详情中区分普通正文句来源与正式句子卡来源，并展示原范文题目与原句；
- [x] 批准前重新执行 Schema、hash、pattern/slot、范文句定位与可选卡片定位检查；
- [x] 以单个事务发布正式 Collocation、主题、论证功能、来源关系和首次 `progress(new)`；
- [x] 将全量备份升级为 v1.1，并保持 v1.0 恢复兼容；
- [x] 验证保存、驳回和合并不会创建正式学习项目或改变句子学习数据；

### Phase 3 实现与验证记录

- 完成时间：2026-08-17；
- 新增 migration `0003_curly_phantom_reporter.sql`，只创建 8 张 Collocation 业务表及索引；重复 migration 通过；
- 工作数据库已导入 200 条候选、207 条候选来源记录；正式 `collocations`、`collocation_progress` 和 `collocation_attempts` 仍为 0，未发生自动批准；
- `/candidates/collocations` 按 20 条拆为 10 批，可按待审核、待修改、已收录、暂缓、驳回、合并和归档筛选；
- `/candidates/collocations/[id]` 支持编辑主要学习字段并查看完整来源、推荐分数与审核历史；批准以外的操作只更新候选；合并目标必须是已批准正式搭配；
- 首次批准会创建正式条目、可查询关系和独立 `progress(new)`；测试确认原有 152 张句子卡和 152 条句子复习状态不变；
- 备份 v1.1 包含候选、正式搭配、来源关系、进度与尝试；集成测试验证含正式 Collocation 的 v1.1 完整往返、旧 v1.0 恢复与 payload 篡改拒绝；
- `npm test`：Schema fixture、25 个规则单元测试和 9 个数据库集成测试全部通过；
- `npm run typecheck` 与 `npm run build`：通过；
- 本地浏览器复检审核列表、详情、理由门禁和 390px 窄屏布局；无控制台错误、无实质横向溢出；测试过程没有批准任何真实候选。

### Phase 4 任务清单

- [x] 将用户已经明确确认的原首批 86 条 card-linked 候选生成独立 approved seed；
- [x] 根据用户后续明确决定，追加批准剩余 114 条普通正文候选，使 approved seed 覆盖全部 200 条；
- [x] 发布前导出可恢复的 v1.1 工作数据库备份；
- [x] 幂等导入 200 条正式 Collocation、207 条来源关系和 200 条 `progress(new)`；
- [x] 在语料库增加“搭配”页签、正式条目数量和独立索引；
- [x] 支持中英文搜索高亮、主题、表达类型和文章来源筛选；
- [x] 建立 Collocation 详情页，展示中文提示、必要的搭配变化、使用边界和全部范文语境；
- [x] 从 Collocation 详情跳回范文原句，并在有正式句子卡时同时提供句子学习卡入口；
- [x] 在完整范文原句中以加粗标记已收录 Collocation，不在句后重复表达标签；搭配详情仍可反向定位范文原句；
- [x] 导出包含已批准正式内容的发布后 v1.1 备份；
- [x] 完成本轮浏览器桌面与 390px 窄屏视觉复检；

### Phase 4 当前实现与验证记录

- 开始时间：2026-08-17；
- 用户先确认原首批 86 条，随后又明确批准剩余全部 114 条；两次决定分别保留审核理由和时间，不把后一次决定伪装成最初批次结论；
- `data/approved_collocations.seed.json` 现保存全部 200 条 `approved` 记录、人工理由与更高 revision；`npm run validate:content` 同时校验候选和批准种子；
- 工作数据库当前为 200 条正式 Collocation、207 条正式来源关系、200 条独立进度；152 张句子卡与 152 条句子复习状态保持不变；
- `/library/collocations` 与 `/library/collocations/[id]` 已进入生产构建；搜索结果复用完整词形高亮逻辑；
- 完整范文为来源句增加稳定锚点；已收录 Collocation 直接在原句内加粗，不重复附加胶囊标签；句子卡对应整句继续保留荧光底色和句型标签，搭配详情仍可定位回范文原句；
- 加粗 Collocation 在鼠标悬停或键盘聚焦时显示“查看搭配”浮层，点击进入搭配详情；当它位于可点击的句子卡整句内时会优先打开搭配，点击整句其他区域仍打开句子学习卡。
- `npm test`：Schema fixture、25 个规则单元测试和 9 个数据库集成测试全部通过；`npm run typecheck` 与 `npm run build` 通过；
- 首次浏览器自动复检曾被桌面应用安全策略拒绝访问 localhost，当时没有改用其他浏览器或绕过；用户随后完成直接视觉评审，本轮修订后已通过内置浏览器补齐桌面与 390px 复检。
- 用户首次视觉复检指出英文表达字号过大、横线骨架与“可接受写法”没有教学价值，并以 `contribute to the economy` 指出对象固化问题；详情页已改为较小标题，只在确有迁移价值时用已审核 slots 展示完整“搭配变化”，固定短语和普通补语不强行显示，accepted answers 仅保留给 Recall 核对。
- 复检确认 `a compelling reason` 不再显示机械骨架或 accepted answers；`contribute to the economy` 展示 `economic growth`、`social development`、`environmental protection` 三条完整变化；1280px 标题为 44px、390px 标题为 30px，两种视口均无横向溢出。
- `npm test`：Schema fixture、29 个规则单元测试和 9 个数据库集成测试全部通过；`npm run typecheck` 与 `npm run build` 通过。
- 原句定位链接统一使用稳定的 `essay + paragraph + sentence` 锚点；针对 Next.js 页面内跳转早于正文挂载的问题，范文页在目标句渲染完成后主动重试定位并滚动到视口中央，再闪亮约 3 秒后渐退；从句子卡、搭配详情或复制的原句链接进入均使用同一机制，系统减少动态效果时改为静态定位高亮。
- 句子学习卡位于客户端组件中，开发环境实测其跨动态路由的 `Link` 跳转可能长时间停留在原页；来源入口改为原生文档导航，并将按钮文案明确为“定位到范文原句”，保证点击后立即交给浏览器打开带锚点的范文页。

### Phase 5 任务清单

- [x] 为 Collocation 增加“未学习 → 已理解 → 回忆中 / 能够使用”的独立进度更新；
- [x] 增加中文提示到英文搭配的唯一 Recall 页面；
- [x] 参考答案支持显示后再次收起；
- [x] 确定性核对仅忽略大小写、连续空格、首尾空格与句末标点；
- [x] canonical、accepted variant 与未匹配写法分别记录，未匹配写法仍由用户自评；
- [x] Collocation attempt、得分、连续成功、遗忘次数和次日复习时间独立持久化；
- [x] 搭配库增加未学习、学习中、今日到期和已掌握筛选；

### Phase 5 验证记录

- 完成时间：2026-08-18；
- 学习入口直接复用现有 Collocation 详情，不复制第二套内容页面；首次点击“我已看懂，开始回忆”后才进入 Recall；
- Recall 固定使用“中文提示 → 英文输入 → 显示答案 → 自评”，没有加入选择题、随机挖空、强制造句或运行时 LLM；
- 数据库集成测试确认 Collocation 学习不会写入句子 `attempts` 或 `review_states`；
- 规则测试覆盖 canonical、accepted answer 和未审核近义表达的边界。

### Phase 6 任务清单

- [x] 将今日队列升级为 `sentence:<id>` / `collocation:<id>` 的带类型任务键；
- [x] 保留现有句子每日新学与到期配额；
- [x] 每天固定安排 10 个新 Collocation，到期 Collocation 使用另一组独立配额，不互相挤占；
- [x] 句子和 Collocation 在同一队列中交替出现，并保持一屏一个主要动作；
- [x] 新 Collocation 先进入 Learn，已学习且到期的 Collocation 直接进入 Recall；
- [x] 完成 Collocation Recall 后可继续到下一条句子或 Collocation；
- [x] 今日总结统一展示句子与 Collocation，并保留完成状态；
- [x] 在隔离数据库中完成桌面与 390px 窄屏浏览器回归；

### Phase 6 验证记录

- 完成时间：2026-08-18；
- 空进度数据库首日生成 15 项任务：5 个新句子和 10 个新 Collocation；若存在句子或 Collocation 到期任务，则各自按独立复习配额追加；
- 浏览器实测通过“今日学习 → Collocation 详情 → 标记已理解 → 输入英文 → 展开/收起答案 → 自评保存 → 下一项句子”的完整链路；
- 390 × 844 视口下今日页与 Collocation Recall 无横向内容溢出；测试使用独立临时数据库，未写入个人正式学习进度；
- `npm run test:rules`：41 个规则测试通过；`npm run test:db`：10 个数据库集成测试通过；`npm run typecheck` 与 `npm run build` 通过。

## 第 1 步任务清单

- [x] 编写 `docs/content-guidelines.md`；
- [x] 定义 Sentence Card、Source Essay、Candidate Card、Backup 四个 JSON Schema；
- [x] 明确枚举、必填字段、`additionalProperties: false` 和版本迁移策略；
- [x] 固定来源展示、原句定位、学习句清理与修订历史规则；
- [x] 固定 AI/Codex 候选输出契约和人工审核门禁；
- [x] 准备合法/非法 fixture，为校验脚本和测试提供输入。

## 第 1 步验证记录

- 完成时间：2026-08-16；
- `npm run test:schemas`：通过，3 个合法 fixture 被接受；含未知字段的 Schema 错误和无法定位到学习句的 gloss 均被拒绝；
- `npm run validate:content`：通过，初始化数据文件结构有效；
- Schema 枚举集中在 `schemas/common.schema.json`；应用 TypeScript 类型将在应用地基阶段从同一契约生成或同步测试。

## 第 2 步任务清单

- [x] 建立 IELTS 官方与 Cambridge 一手来源候选清单；
- [x] 确认官方教育/社会 Band 8.5 与旅游/环境 Band 7.5 作答；
- [x] 验收用户提供的 Simon 28 篇打字合集，并建立合集来源说明；
- [x] 为 Simon 科技、环境、教育三篇开发种子生成段落索引与内容 hash；
- [ ] 确定科技主题的官方高分或 Cambridge model answer；
- [ ] 按语言密度、题型覆盖、来源完整性最终确定每类 1 篇开发种子；
- [x] 保存未经改写的 raw source；
- [ ] 生成段落索引、来源 metadata 与 SHA-256；
- [ ] 验证原文、URL、本地文件和 hash 能相互对应。

## Simon 合集验收记录

- 完成时间：2026-08-16；
- 全集 29 页，其中目录 1 页、打字范文 28 篇，全部页面已完成视觉检查；
- 文件 SHA-256：`ecfe7e05c3b2d7b36b694c51e1001ea668d03a73b2feb2f612f253b814a3115d`；
- 已入库全集 28 篇；电脑游戏、野生动物保护、大学专业选择三篇开发种子已经生成正式学习卡；
- `npm run validate:content`：通过，28 个 source essay 均符合 Schema；
- `npm run test:schemas`：通过；
- 合集无一手 URL 和考官评语，作者归属及 Band 9 均保持“待一手来源复核”，不作为官方评分展示；
- 官方 / Cambridge 优先策略不变；Simon 全集作为教师范文本地语料，任何新学习卡仍必须先进入候选态并通过人工审核。

## 来源材料何时需要

第 1 步不依赖具体范文。第 2 步优先由 Codex 查找 IELTS 官方公开文件；Cambridge 付费材料由用户从自己拥有的正版书籍或 Cambridge One 导出后放进 `sources/raw/`。Simon 材料暂不阻塞首批内容。

接收材料时优先提供原始 URL 或完整文件，不要只复制零散句子，因为系统需要保存段落上下文并验证原句定位。

## 第 3 步任务清单

- [x] 建立可重复执行的 Simon 候选生成脚本；
- [x] 从科技、环境、教育三篇开发种子中按实际语言密度筛出 16 张候选卡；
- [x] 为候选生成原句定位、中文翻译、chunks、轻量 glosses、pattern、slots 和练习种子；
- [x] 生成便于人工逐条阅读的审核清单；
- [x] 验证段落与全文 hash、句子序号、上下文、学习句修改链、标准化 hash 和重复项；
- [x] 用户完成首批审核决定：15 张 `approved`，1 张因研究出处不足 `deferred`；
- [x] 将 15 张通过人工审核的卡写入 approved seed。

## 第 3 步当前验证记录

- 生成时间：2026-08-16；
- `npm run generate:candidates`：生成 16 张候选，分布为科技 5、环境 5、教育 6；
- 训练重点：12 张 mixed、4 张 vocabulary；优先级：11 张 core、5 张 supporting；
- `npm run test:schemas`：通过，并验证错误 gloss、错误句子序号、错误 source hash、错误标准化 hash 和不可追溯学习修改均会被拒绝；
- `npm run validate:content`：通过，当前数据为 28 sources、16 candidates、15 approved cards；候选和正式卡仍只来自三篇开发种子；
- 审核决定由候选生成脚本稳定复现；暂缓卡不会进入正式学习卡集合。

## 第 4 步任务清单

- [x] 建立 SQLite 表结构与可重复 migration；
- [x] 建立 source、candidate、approved card 的幂等导入；
- [x] 建立 repository/service 边界；
- [x] 建立全量备份、hash 校验与恢复流程；
- [x] 用集成测试验证重启持久化、重复导入与空库恢复。

## 第 4 步验证记录

- 完成时间：2026-08-16；
- 初始 migration 建立 9 张业务表，并启用外键、WAL 与忙等待保护；
- `npm run db:seed`：当前写入 28 sources、153 candidates、152 approved cards 和 152 review states；重复执行命中相同 import hash，未产生重复数据；
- 暂缓候选保留在 `candidates`，不会写入 `cards` 或进入学习队列；
- 全量备份包含来源、卡片、候选、练习记录、复习状态和设置，恢复前校验 JSON Schema 与 SHA-256；覆盖已有数据前自动生成回滚备份；
- `npm run typecheck`：通过；`npm run test:db`：7 个集成测试通过，覆盖重复 migration、幂等导入、来源 metadata 安全修订、正文冲突拒绝、重启持久化、空库恢复、候选发布、覆盖前回滚和篡改拒绝。

## 第 5 步任务清单

- [x] 搭建 Next.js App Router 本地 Web 应用与五项主导航；
- [x] 完成今日学习、语料库、单句学习卡三个首批高保真页面；
- [x] 语料库支持中英文搜索、主题、训练类型和文章来源筛选；完整范文索引也支持按主题与文章来源筛选；搜索结果会在英文原句与中文释义中标出全部命中位置；
- [x] 学习卡支持中文显隐、chunk 高亮、gloss 轻标记、键盘可关闭的小型释义浮层；
- [x] 学习卡展示 pattern、slots、结构说明、使用提醒、来源类型、原文位置和上下文；
- [x] Simon 来源前台明确标作“教师范文 / 非 IELTS 官方评分样本”；
- [x] 根据首轮用户评审缩小并左对齐中英文正文，中文改为默认隐藏且强化显隐按钮；
- [x] 将 `{slot_name}` 骨架改为横线槽位，并移除冗余 slot 解释表；
- [x] 收紧 chunk/gloss 门槛，15 张正式卡升级至 revision 2，基础难度表达不再高亮；
- [x] 在语料库增加 Simon 合集 28 篇完整范文，展示原作文题目、完整正文、本地归档和可复制链接；
- [x] 将根路径改为独立产品首页，今日学习与完整范文库作为两个并列主入口；首页不提前展示待学英文句子，今日学习流保留在 `/today`；
- [x] 全局侧栏增加首页入口，品牌标志返回根路径；完整范文列表、原题和单篇页标题统一放大并加粗；
- [x] 完整范文按段落号与句子序号标出已制成正式卡的原句；整句可点击进入学习卡，并以小标签区分 structure、vocabulary 与 mixed sentence；
- [x] 学习卡底部主按钮接通中译英 Recall，支持参考答案、自评、尝试记录与按自然日复习；
- [x] 学习进度页接入真实 attempts / review states；总覆盖与四个学习阶段合并展示，保留近七天活动、训练类型、主题覆盖和最近练习句子，不展示意义不足的次日数量预测；
- [ ] 实现正式卡的新增、编辑、删除、收藏和置顶；
- [x] 实现候选卡逐字段编辑、收录、驳回和导入预览；
- [ ] 完成窄屏与无障碍检查，并冻结 design tokens。

## 延期事项：公开体验与比赛部署

- 已记录近期少量同学体验与比赛正式部署的两阶段路线，详见 `docs/deployment-plan.md`；
- 当前不执行公开部署；先完成个人自用 MVP、匿名体验者进度隔离、内部页面保护和范文展示范围复核；
- 近期体验优先使用独立演示数据库与临时安全通道；比赛版优先评估带持久卷的单实例托管，未来出现真实扩容需求后再迁移托管数据库。

## 第一阶段最新产品快照

- 更新时间：2026-08-18；
- 已新增 `docs/current-product-overview.md`，统一记录当前产品定位、内容规模、句子与 Collocation 学习闭环、语料库能力、内容工作流、技术边界、已知限制和下一阶段策略问题；
- 该文档作为与外部 GPT、同学或比赛指导者讨论下一阶段时的当前事实基线；旧需求文档继续保留设计演进记录，但讨论新策略时应优先使用该快照。

## 新概念英语 3 语言丰富度语料增量

- 开始时间：2026-08-18；
- [x] 决定把非 IELTS 教材单列为 `language_richness_corpus`，不计入 IELTS model essays、Band 或考官样本；
- [x] 扩展来源 Schema、前台来源标签与原文页面说明，并增加合法语言语料 fixture；
- [x] 登记第 18、27 课网页、标题、预期 raw 路径和按段落筛选规则；
- [x] 完成网页短篇预审，并与 152 张正式句子卡、200 条正式 Collocation 做第一轮规范化精确查重；
- [x] 用户提供两张保留教材原段落的清晰扫描图；扫描图和逐字转写均归档至 `sources/raw/new-concept-english-3/`；
- [x] 计算整课与逐段 hash，建立 2 个 `language_richness_corpus` source records；
- [x] 按 4 个原始段落生成 5 个句子 candidates 和 21 个 Collocation candidates，完成精确、近似与学习目标查重；
- [x] 输出 `sources/metadata/nce3-candidate-review.md` 人工审核批次；审核前所有新内容保持 `candidate`；
- [x] 用户明确确认本批都可以并要求发布；5 张句子卡与 21 条 Collocation 追加人工批准记录后进入正式库；
- [x] 发布前生成 `backups/mimicloop-0c250129-d360-4db0-988f-e841ad4768cf.json` 可恢复备份；
- [x] 将同一原句中重合的 5 条 Collocation 反向关联到本批正式句子卡；
- [x] 固定后续筛选优先级：完整句子的框架、信息组织与自然写法优先，Collocation 次之但仍单独处理；
- [x] 为 21 条新 Collocation 生成完整换场景中译英 Use 候选；校验目标表达、提示、答案、原句复用和跨题重复；
- [x] 用户在审核页查看本批后表示“暂时都通过”；21 题追加人工批准记录、写入正式 `exercise_seed` 并同步数据库；
- [x] 修复 5 张 NCE3 句子 Use 题“题干手写英文 + hints 自动插入”导致的重复括注，并在两个 Use 页面增加防重复渲染与单元测试；
- 当前无技术阻塞。接收、hash 与处理记录见 `sources/metadata/nce3-lessons-18-27-intake.md`。
- 本轮发布后规模：30 个来源、158 个句子候选、157 张正式句子卡、221 个 Collocation 候选、221 条正式 Collocation，全部 221 条正式 Collocation 均具备人工批准的 Use 题；既有学习尝试和复习进度保留。`npm run validate:content`、51 个规则单元测试和 10 个数据库集成测试通过；TypeScript 检查与生产构建通过。

## 第 5 步当前验证记录

- 开始时间：2026-08-16；
- `npm run build`：Next.js 生产构建通过；
- 已在本地浏览器逐页检查今日学习、语料库和学习卡；搜索“肥胖”正确缩小为 1 张卡；
- chunk 浮层同时显示词块义和重叠生词义，点击外部或按 Escape 可关闭；
- 浏览器控制台未发现页面错误或警告。

## 第 5 步首轮用户评审修订

- 修订时间：2026-08-16；
- 用户指出英文过大且居中排版不利于长句阅读，中文也应左对齐并默认隐藏；页面已按此重排并完成浏览器复检；
- 用户指出基础词组不需要注释；内容规范现要求 chunk 至少具备非透明搭配、论证功能、误用边界或练习价值之一；
- approved cards 以 `content_revision: 2` 更新，导入器只接受更高 revision 的内容替换，并保留收藏、复习状态和尝试记录；
- 首版完整范文使用已经归档、分段并校验 hash 的 3 篇 Simon 开发种子，不重新生成或改写原文；后续已按同一规则扩展至全集 28 篇；
- 为避免灰色假按钮，提前接通最小可用 Recall 垂直切片；完整 Recall/Use 练习阶段仍按后续计划继续扩展；
- `npm run test`：Schema 测试、4 个复习调度测试、3 个今日队列测试、3 个连续跳转测试、5 个数据库集成测试全部通过；`npm run build` 通过。

## 第 5 步第二轮用户评审修订

- 修订时间：2026-08-16；
- Recall 完成页的主操作改为“学习下一句”，今日队列最后一句改为“完成今日学习”并进入今日总结；
- 今日队列会保留当天已完成卡并定位到下一张未完成卡，刷新后不再回到第一句；
- 删除分钟级与按档位显示的精确复习时间，不使用页面停留时长推断学习时间；
- 每句完成后只确认记录并进入下一句；今日任务全部结束后才统一展示当天句子供快速回看，当天完成的句子在下一个 Asia/Shanghai 自然日重新进入任务；
- 自评仍保存掌握阶段与成功记录，当前复习间隔统一为 1 个自然日；决策记录见 ADR 0004。
- 2026-08-18 实际使用发现 `daily_new_card_limit=5` 被错误当成今日总任务上限，5 个到期旧句会导致新句为 0；现已拆为最多 5 个到期复习与 5 个新句的独立配额，未完成任务交替排列，当天已尝试卡继续保留在队列前部。

## 第 5 步第三轮用户评审修订

- 修订时间：2026-08-16；
- 用户指出学习卡多数中文说明字号过小、颜色过浅；
- 中文翻译提升至 17px，结构说明与使用提醒提升至 15px，栏目标题与提示提升至 13–16px；
- 加深全局辅助文字色，并同步提高语料库中文释义、Recall 操作说明和今日总结中文释义的可读性；
- 英文主句尺寸保持不变，继续维持“句子是主视觉”的信息层级。
- 句内释义浮层支持点击高亮词块与浮层之外的任意位置关闭，同时保留关闭按钮与 Escape 键操作。
- 句内高亮由不可拆行的原生按钮改为支持跨行的行内交互元素，避免长词块被整体挤到下一行；点击、Enter、Space 与焦点样式保持可用。
- 首页移除聊天式问候、宣传式口号及重复的流程说明，主标题改为直接表达产品价值。
- 用户提供的 MimicLoop 透明 Logo 已作为正式品牌资产：首页展示完整标志，全局侧栏展示机器人标志；标题与考试标签明确 IELTS Academic Writing Task 2 定位，并注明非官方关系。

## 第 5 步第四轮用户评审修订

- 修订时间：2026-08-16；
- 用户明确不同句子类型必须对应不同掌握目标，Use 不能使用同一种通用练习；
- structure/mixed 卡使用人工审核的骨架、槽位值与参考答案，突出结构和论证功能；mixed 同时提示尽量保留核心词块；
- vocabulary 卡使用目标词块完成简单造句，参考写法来自已审核的 `transfer_example`；今日队列中最近学过的结构可以作为可选支架，但不强制硬套；
- Recall 只记录阶段进度，完成类型匹配的 Use 后才算本句完成；刷新页面会从 Use 继续；
- 通过 `adaptive_use_started_at` 保留新流程启用前已经完成的学习进度；
- 新增 `/practice/[id]/use`，完成 `Learn → Recall → Use → 下一句 / 今日总结` 的确定性闭环。

## 第 5 步第五轮用户评审修订

- Use 主标题统一为“仿写练习”，具体结构或词块只在目标面板展示；移除重复目标、难度安慰和强行套用等冗余说明；
- 固定参考答案对应的练习改为引导式中译英：中文提示确定大致语义，较难产出的词汇以括号提示，用户作答后再显示参考答案；
- 新增 `guided_application` 与可选 `hints` 契约，页面只展示已经进入 approved card 的提示；
- 首批 15 组中文提示、括号词汇与参考答案已写入 `data/use_prompt_candidates.json`，完成批次审核并应用到 15 张正式卡；
- 校验器检查候选卡关联、训练类型、目标词块、参考答案和英文提示的一致性，避免开放题与固定答案失去对应关系。
- 第五轮补充确认：Use 作答前只展示完整中文句子，括号仅提示较难的非考点词；核心结构、目标词块和结构骨架在作答前全部隐藏，显示参考答案后再用于复盘。
- 连续学习实测发现，词汇卡自动展示上一张结构卡会造成“串卡”理解；已取消跨卡结构注入，词汇 Use 只围绕当前中文提示、参考答案和目标词块展开。
- Recall 与 Use 在揭晓参考答案后均提供“收起答案”；收起时保留用户输入，只隐藏答案、揭晓后的结构/词块复盘与自评区，再次显示后可继续核对和完成记录。
- 2026-08-17 验证：25 个规则单元测试、9 个相关数据库/Use 测试、TypeScript 检查与生产构建均通过；浏览器复测 `linked in part to` 练习不再出现上一张 `From a ... perspective` 骨架。

## 第 5 步 Collocation Use 补充实现

- 修订时间：2026-08-18；
- 用户指出“会写原搭配”不能证明会应用；Collocation 学习闭环改为 `Learn → Recall → Use`，Recall 只保存回忆表现，完成换场景 Use 后才更新 `application_score`、连续成功次数与下次复习日期；
- Use 使用完整中文句子引导中译英，只提示较难且非考点的词汇；目标搭配、迁移类型和参考答案在作答前隐藏；
- 新增独立 `collocation_use_started_at` rollout 标记，保留启用前记录；没有已审核 Use 题的旧搭配仍按 Recall 完成，避免 10 条新搭配日配额突然消失；
- 新增 Collocation Use 候选 Schema、可重复生成脚本、确定性校验、批准后应用脚本与候选预览页 `/candidates/collocations/use-prompts`；审核页按全部、待审核、已发布筛选并每批展示 20 条；
- 用户于 2026-08-18 先批准首批 10 条，随后在完整候选批次通过校验后明确要求全部发布；全库 200 条搭配现均具有正式 Use 题，其中 30 条复用既有已审核句子 Use 语境，160 条为新写并经本次人工整批批准；候选待审核数为 0；
- 每条 Use 候选保留 `created` 与 `approved` 审核记录、审核人、理由和时间；批准脚本只发布 `approved` 项，应用脚本以更高 `content_revision` 更新正式搭配，既有学习进度与尝试记录不被覆盖；
- 校验器除目标搭配、提示词与参考答案对应外，还拒绝重复中文题、重复参考答案、照抄来源原句以及退化为单独词义的非完整应用题；
- 测试覆盖 Recall 后未完成、Use 后才调度、旧条目兼容、半途刷新进入 Use、Use 后继续统一任务队列；`npm run validate:content`、47 个规则单元测试和 10 个数据库集成测试通过。

## 第 5 步候选审核台实现记录

- 候选列表按待处理、已收录和已驳回展示真实 SQLite 数据，并可进入单条详情；
- 详情页支持编辑中文释义、词块释义与说明、语法/使用说明、结构骨架、简化表达、迁移例句、slots、练习种子和待确认事项；
- 原句和学习句保持只读；右侧同步展示发布预览、作文题目、原文段落和完整审核历史；
- 保存草稿不会影响正式卡；批准在 Schema 与确定性规则验证后，通过单个事务发布或升级正式卡；暂缓和驳回保留审核理由；
- 集成测试在临时数据库验证“草稿不发布、批准才增加正式卡”，浏览器验证即时预览、理由门禁和页面无控制台错误。
- 产品复盘后明确：候选审核属于内部内容生产工具，不是普通学习者的主流程；`/candidates` 与审核 API 保留供维护时直接访问，但已从用户主导航移除，后续不再为其扩展普通用户功能。

## 第 5 步 Simon 全集批量入库记录

- 完成时间：2026-08-16；
- 新增可重复执行的 `scripts/import-simon-essays.py`，从同一份归档 PDF 中提取 28 篇题目、正文段落、合集篇号、PDF 页码和 Band 声明；
- 保留第 9、21、26 篇既有来源 ID，剩余 25 篇使用稳定 ID，避免破坏已有学习卡、复习状态和尝试记录；
- 全部 28 个正文页已重新渲染并逐页视觉核对；18 篇保存合集 Band 9 声明，10 篇不补写 Band；
- 来源导入允许在正文 `content_hash` 不变时修正标题、题型等 metadata，正文发生变化仍拒绝导入；该规则已有集成测试；
- 完整范文列表按原合集第 01–28 篇排序，页面实测显示 28 篇，并可打开新导入范文的题目和完整正文；
- 当前正式学习卡为 152 张。Simon 合集 28 篇均已完成首轮筛句与批次审核；唯一未发布条目是最早因研究出处不足而暂缓的候选。

## 第 5 步 Simon 前五篇校准批次

- 完成时间：2026-08-16；
- 从合集第 1–5 篇按学习价值筛出 26 个候选，各篇分别为 5、6、4、4、7 句，不设置固定配额；
- 训练重点分布为 18 个 structure、3 个 vocabulary、5 个 mixed；结构/论证句重点练可迁移骨架，词块句重点练目标表达；
- 每个候选均保留作文题目、段落与句子序号、上下文、原句 hash、必要的学习句指代修订和完整审核历史；
- Use 练习使用完整中文句子引导中译英，仅提示较难且非考点的词；核心结构或目标词块在作答前保持隐藏；
- 只标注少量确有理解门槛的表达，不为高中或基础四级难度词组添加解释；
- 用户于 2026-08-17 确认整批筛句密度、分类和练习方向；26 个条目追加 `approved` 审核记录并升级为 revision 3；
- 批次发布后正式学习卡由 15 张增加到 41 张，既有尝试记录和复习状态保持不变；
- `npm run validate:content`：通过，发布时数据为 28 sources、42 candidates、41 approved cards、15 approved Use prompts；
- `npm test`：Schema、内容规则与数据库集成测试全部通过；`npm run build`：Next.js 生产构建通过。

## 第 5 步 Simon 第二批五篇候选

- 开始时间：2026-08-17；
- 处理合集第 6、7、8、10、11 篇；第 9 篇已有开发种子正式卡，因此跳过重复生产；
- 按学习价值筛出 26 个候选，各篇分别为 4、5、5、6、6 句；训练重点为 18 个 structure、3 个 vocabulary、5 个 mixed；
- 新增通用 `scripts/simon-candidate-batch-lib.mjs`，统一执行来源定位、稳定 ID、原句 hash、学习句修改链、练习种子、重复检测和审核清单生成；
- 逐条自检后修正了仿写场景的逻辑一致性、提示与参考答案对应关系，并只为 `delight in`、`arouses`、`curable` 三处理解门槛添加轻量释义；
- 用户于 2026-08-17 确认整批内容可以；26 个条目追加 `approved` 审核记录并升级为 revision 3；
- 批次发布后正式学习卡由 41 张增加到 67 张，既有 19 条学习尝试保持不变；
- `npm run validate:content`：通过，发布时数据为 28 sources、68 candidates、67 approved cards。

## 第 5 步 Simon 第三批五篇候选

- 开始时间：2026-08-17；
- 处理合集第 12–16 篇，按学习价值筛出 26 个候选，各篇分别为 6、5、6、5、4 句；
- 训练重点为 20 个 structure、5 个 mixed、1 个 vocabulary；该批文章的高价值内容主要是比较、条件与论证链，因此不人为凑词块比例；
- 自检时删除了一个表达不够理想的博物馆句子，并修正远程医疗、护理教学、在线课程和供应商选择等仿写场景；
- 只为原句中的 `telegrams` 与 `technicalities` 添加轻量释义，基础表达不额外高亮；
- 用户于 2026-08-17 确认继续；26 个条目追加 `approved` 审核记录并升级为 revision 2；
- 批次发布后正式学习卡由 67 张增加到 93 张；当前数据为 28 sources、94 candidates、93 approved cards；
- `npm run validate:content`、`npm test` 与 `npm run build`：全部通过。

## 第 5 步 Simon 第四批五篇候选

- 开始时间：2026-08-17；
- 处理合集第 17、18、19、20、22 篇；第 21 篇已有开发种子正式卡，因此跳过重复生产；
- 按学习价值筛出 27 个候选，各篇分别为 5、5、6、6、5 句；训练重点为 20 个 structure、5 个 mixed、2 个 vocabulary；
- 混合类重点练 `face the dilemma of whether to`、`much more than simply a means of`、`in the short term / in the long term`、`play their part in` 和 `act as a deterrent`；词块类重点练 `take responsibility for` 与 `derive a sense of satisfaction from`；
- 只为 `exhaust fumes`、`peacefulness` 与 `preconditions` 添加轻量释义，基础词汇和普通四级表达不额外高亮；
- 自检时修正了数字基础设施、公共交通、农业多样性、招聘公平、社区活动、企业处罚与托育服务等仿写场景，确保中文提示、隐藏考点和参考答案互相对应；
- 第 22 篇原始提取文本有一句跨段误切，因此没有强行选入该句，避免破坏原文定位与可追溯性；
- 用户于 2026-08-17 确认整批内容可以；27 个条目追加 `approved` 审核记录并升级为 revision 2；
- 批次发布后正式学习卡由 93 张增加到 120 张，既有 21 条学习尝试保持不变；当前数据为 28 sources、121 candidates、120 approved cards；
- `npm run validate:content` 与 `npm run db:seed`：通过。

## 第 5 步 Simon 第五批五篇候选

- 开始时间：2026-08-17；
- 处理合集第 23、24、25、27、28 篇；第 26 篇已有开发种子正式卡，因此跳过重复生产；
- 按学习价值筛出 32 个候选，各篇分别为 6、5、7、6、8 句，不为保持固定篇均数量删除有价值句子；
- 训练重点为 21 个 structure、9 个 mixed、2 个 vocabulary；结构与论证句继续练骨架，词块句练固定目标表达；
- 只为 `utilities`、`accounting loopholes`、`indifferent`、`disparity` 与 `neighbourliness` 添加轻量释义，基础表达不额外高亮；
- 自检时移除一个边界不清的固定词块，修正私立学校成本、亲历者建议、垃圾分类、职业期待、邻里责任与城市规划等仿写场景；
- 每个 mixed/vocabulary 候选的参考答案均实际保留目标词块；中文提示只给非考点难词，不提前展示核心结构或词块；
- 用户于 2026-08-17 确认继续；32 个条目追加 `approved` 审核记录并升级为 revision 2；
- 批次发布后正式学习卡由 120 张增加到 152 张，既有 21 条学习尝试保持不变；当前数据为 28 sources、153 candidates、152 approved cards；
- `npm run validate:content` 与两次 `npm run db:seed`：通过，重复导入正确命中同一 import hash；`npm test` 的 23 个测试和 `npm run build` 全部通过。

## 第 5 步 Native-naturalness 全库审计

- 开始时间：2026-08-18；完成时间：2026-08-18；当前状态：已批准并应用；
- 新增 ADR 0009，并将审核优先级固定为：现代英语自然度、语义逻辑、IELTS/正式写作适用性、原结构保留程度；“语法正确但不够自然”不得批准；
- 该门禁已同步写入 `AGENTS.md`、Sentence 内容规范和 Collocation 内容规范，后续 `transfer_example`、Sentence Use 与 Collocation Use 均必须脱离来源原句接受 blind native-naturalness check；
- 已逐项阅读 157 条 Sentence Use / transfer examples 与 221 条 Collocation Use，共 378 条参考答案；
- 第一轮标记 47 条 Sentence Use 和 34 条 Collocation Use 为 `needs_edit`；用户于 2026-08-18 明确批准按整份清单修改；
- 新增幂等脚本 `scripts/apply-native-naturalness-audit.mjs`，同步修改候选档案、approved seed、Sentence/Collocation Use 候选、中文题干、hints、reference answer、transfer example、revision 与审核历史；
- 浏览器抽查发现自然化答案仍展示来源旧骨架；已为 Sentence Use 增加可选 `feedback_pattern`（sentence card schema 1.1.0），仅在参考答案偏离来源 pattern 时覆盖反馈区，来源原 pattern 保持不变；
- 6 条 canonical 复核项中，5 条保留来源事实但降为 `supporting` 并补充使用边界，`fulfil basic needs` 保持 core 并提示更常见的 `meet basic needs`；
- SQLite 已重新 seed；157 张句子卡、221 个 Collocation、57 条句子尝试、7 条 Collocation 尝试和全部进度记录均保留；
- 详细 ID、问题原因、最终英文和处理结果保存在 `sources/metadata/native-naturalness-audit-2026-08-18.md`；
- 新增规则测试，确保长期约束中的优先级顺序不被删除、审计 ID 能定位到正式内容、问题项不重复且批准应用状态可追踪。
- 最终验证：内容校验通过；18 项 Schema/语义 fixtures、55 个规则单元测试、10 个数据库集成测试与 Next.js 生产构建全部通过；浏览器实测修订句子展示新的 `feedback_pattern`，Collocation Use 的题干、提示、答案和目标搭配一致，控制台无警告或错误。

## 第 5 步《新概念英语 3》第二批扩展

- 完成时间：2026-08-19；处理第 29、38、41、44、45、47、51、53、55、59 课；全部作为 `language_richness_corpus`，不作为 IELTS model essay。
- 10 课网页正文已归档为 27 个段落并保存来源 URL、访问日期、整课与逐段 hash；网站转写异常忠实保留在 raw，但相关错误句未进入学习内容。
- 按段落筛选并发布 29 张句子卡、36 条 Collocation；完整句子的框架与自然写法优先，Collocation 次之，不按课次凑固定数量。
- 29 个 Sentence Use 与 36 个 Collocation Use 均在同批生成；65 个参考答案经过独立 native-naturalness check，并在浏览器验收中修正一处第 59 课题干与自然化答案未同步的问题。
- 用户明确允许在候选生成、查重、Use、自然度检查和确定性验证通过后整批发布；所有项目仍先进入 candidate 并保留审批历史，没有绕过内容工作流。
- 发布后规模为 40 个来源、187 个句子候选、186 张正式句子卡、257 个 Collocation 候选、257 条正式 Collocation；59 条句子尝试、13 条 Collocation 尝试及全部既有进度保留。
- 集成测试移除旧内容规模硬编码，改为从种子数据推导期望数量；18 项 Schema fixtures、55 个规则单元测试、10 个数据库集成测试、TypeScript 与生产构建全部通过。
- 浏览器验证来源筛选、原文句子/搭配链接、Learn、Sentence Use 和 Collocation Use；控制台无警告或错误。详细接收和审核记录见 `sources/metadata/nce3-lessons-29-59-intake.md` 与 `sources/metadata/nce3-lessons-29-59-candidate-review.md`。

## 第 5 步《新概念英语 3》Core / Appreciation 高召回升级

- 完成时间：2026-08-19；重扫现有 12 课，不再限制每课 3～5 条搭配，改为逐段高召回提取“中文容易懂、英文不容易主动写出”的自然书面表达。
- Collocation schema 升级至 1.2.0，新增 `learning_mode=recall_use|appreciation`；旧的 `priority=core|supporting` 继续只表示候选审核优先级，不再承担学习模式含义。
- 新增 144 条表达候选并按既有授权在验证后发布：40 条 Core、104 条 Appreciation；另将旧库中 11 条叙事性或迁移收益不足的项目降为 Appreciation。
- 发布后共有 401 条正式表达：286 条 Core、115 条 Appreciation。数据库仅保留 286 条 `collocation_progress`；Appreciation 无 Recall、Use、今日任务或搭配库入口。
- Core 维持正文加粗和详情链接；Appreciation 使用暖色点状下划线，只在原文通过悬停、焦点或点按显示简短中文释义。原文页新增标记图例并分别显示 Core / Appreciation 数量。
- 新增 40 条 Core 均附带独立换场景 Use；参考句按现代英语自然度、语义逻辑、正式写作适用性优先于结构复用的顺序复核。`go into raptures at the mere mention of` 等修辞性表达明确归入 Appreciation。
- 增加数据库迁移、导入防线和测试：Appreciation 不创建进度，练习接口直接拒绝其 ID；正式 Core 缺少 Use 或 Use 目标不在参考答案中时验证失败。

## 后续语言丰富度语料的固定接收标准

- 确认时间：2026-08-19；适用于后续《新概念英语 3》课文及可能引入的外刊、教材或其他可靠书面来源。
- 所有非 IELTS 内容统一标记为 `language_richness_corpus`，并按教材、刊物或出版方单列文章来源；不得展示为 IELTS model essay。
- 表达按段落高召回提取，不设数量上限；全库查重后分为 Core / Appreciation。Core 才进入 Recall → Use，Appreciation 只在原文以差异化样式和短释义标注。
- 完整句子同样提高召回率，尤其重视自然句子框架、信息组织、强调、对比、限定和结果表达；允许每篇形成比以往更多的句子卡。
- “可以更多”不等于降低门槛。每条句子仍须通过现代英语自然度、上下文独立性、明确学习目标、迁移价值和全库查重；不得为数量收录文学性强但无法教学、依赖前文或已高度重复的句子。

## 第 5 步原文阅读信息层级与返回行为修订

- 完成时间：2026-08-19；教师范文与《新概念英语 3》的来源免责声明由正文前移至文章末尾，避免打断标题与正文之间的阅读节奏。
- 《新概念英语 3》索引来源行统一简化为“新概念英语 3 · 第 N 课”，不再展示题目、网页核验说明或 URL；前台移除“语言丰富度语料”这一内部分类话术。
- Structure / Vocabulary / Mixed 标签改为深色实底白字，与句子本身的浅色荧光形成清晰层级。
- 原文详情的固定“返回原文阅读”链接改为“回到上一页”；主题与来源筛选均写入 URL，浏览器返回可恢复进入文章前的完整筛选结果。从句子卡或搭配页进入时同样返回实际上一页。
- 新增来源简化和筛选 URL 规则测试；浏览器实测“文化与媒体 + 新概念英语 3 → 第 59 课 → 回到上一页”后两个筛选及 5 篇结果均完整恢复，控制台无错误。

## 第 5 步使用导览动画原型

- 首轮完成时间：2026-08-19；先实现原五页规划中的第 2 页“原文里的三种标记”，暂不启用首次访问自动弹出或已读状态。
- 首页 Logo 下增加“使用导览”入口；导览使用真实文章局部 UI，通过约 12 秒循环依次演示 Core 悬浮、点击后学习卡滑入，以及 Appreciation 只显示中文释义。
- 动画完全由 HTML / CSS 构成，支持暂停、重新播放、点击遮罩关闭、Escape 关闭和正文滚动锁定；`prefers-reduced-motion` 下自动切换为静态说明。
- 根据首轮视觉反馈，将两个动画光标、悬浮提示和点击波纹改为直接锚定 Core / Appreciation 词组；删除底部重复的“关闭预览”，只保留右上角关闭入口。
- 第二轮修正光标到达目标前过早显形的问题，并延长 Appreciation 释义的展示阶段；系统启用“减少动态效果”时，改为常驻显示 Appreciation 静态释义。
- 第 2 页首轮曾在桌面与 390×844 窄屏浏览器完成视觉检查，无横向溢出；暂停状态保持、关闭后滚动恢复，控制台无错误。
- 用户于 2026-08-19 确认第 2 页原型暂时保留；入口、句子学习、Recall → Use、搜索定位等其余页面、首次显示和设置入口延后到比赛晋级后，不阻塞第一阶段冻结或智能体阶段讨论。
- 增补时间：2026-08-31；因 Guided Writing 已成为独立产品区域，导览规划从五页扩展为六页，并只新增第 6 页“写作练习”原型。该页保持高层概览，不解释复杂教练流程：明确可选择已有题目，也可粘贴自己的英文 IELTS Task 2 题目，确认后进入写作练习；真实入口链接到 `/writing`。
- 第 6 页沿用左侧短说明、右侧真实 UI 片段和 CSS / DOM 动画，演示“导入自己的题目”面板；不展示 Band 分数，不暗示模型自动代写，也不把模型的题型与主题判断冒充已确认事实。
- 完成时间：2026-08-31；补齐第 1、3、4、5 页，形成完整六页：① 首页三条独立入口；② 原文中的荧光句子、Core 与 Appreciation；③ 中文按需展开、词块短释义和可复用骨架；④ Recall → Use → DeepSeek 受控反馈；⑤ 中英文搜索、命中词强调和原文闪烁定位；⑥ 选择或导入题目后进入写作练习。
- 首页入口现在从第 1 页开始；页脚支持上一页、下一页、六个直接跳转点和末页“完成导览”，键盘左右方向键可翻页。每次换页或重播都会重新启动当前页动画；关闭、暂停、Escape、遮罩关闭和滚动锁定行为保持不变。
- 新增页沿用真实产品信息架构与既有视觉语义：第 3 页不把所有词都标成生词，第 4 页明确 Use 是换场景运用，第 5 页同时说明句子与搭配支持中英文搜索，并在回到原文后闪烁目标句；演示光标均锚定具体卡片或按钮，不使用容器百分比跨区域漂移。
- 完整六页通过新增规则测试、TypeScript 检查和本地浏览器逐页检查；1280×720 下六页标题、连续翻页、直接页码跳转、返回和完成按钮均可用，控制台无警告或错误。窄屏使用单列纵向滚动及四个新增演示区的紧凑布局；`prefers-reduced-motion` 下改为可直接理解的静态最终状态。
- Rapid Trial Agent 在 8 次页面动作内从首页打开导览、依次浏览第 1–6 页并通过“完成导览”退出；六页主题与页码均可理解，未发现明显问题。该短测未替代手机端、暂停和各真实功能入口的技术检查。
- 用户复检指出第 4 页遗漏当前差异化的 DeepSeek 批改能力；现改为三阶段动画，先回忆目标表达，再完成换场景 Use，最后点击“检查我的句子”并显示与真实 Use 页面同构的 `AI 反馈 · DeepSeek`、通过判断、成功点和下一步动作。导览同时说明失败时保留答案并回退，不展示 Band 分数，也不暗示模型 verdict 直接更新学习进度。
- 第 4 页 Rapid Trial 确认首次使用者能够理解“Use 写完后由 DeepSeek 检查”及反馈内容；同时发现结果停留过短，现将循环扩为 15 秒并把反馈阶段延长到约 6 秒。短测截图中的右侧裁切经 DOM 实测确认为 390px 测试截图裁切：1280×720 下对话框右边界为 1220px、页面无横向溢出、顶部阶段名与底部按钮均在可视范围内，因此未为该测试环境假象改动桌面布局。
- 仍延期：首次访问自动展示、“已看过”持久状态和设置中的重新打开入口；当前导览继续只由首页按钮主动触发。

## 下一阶段引导写作智能体人工原型记录

- 记录时间：2026-08-19；当前仅完成离线人工原型与缺口分析，没有进入运行时 Agent 实现，也没有改变第一阶段范围约束。
- 使用一题 Academic IELTS Writing Task 2 住房题，模拟“审题 → 选择立场 → 生成论证链 → 按论证功能调用正式句子和 Core 表达 → 渐进提示 → 完整成文”的教学过程。
- 334 词示范作文约有 15%–18% 为可明确追溯的固定表达或骨架；将受控换主题句计入后，库内语言驱动约 28%–32%；其余主要为现有库缺少的题目逻辑与基础衔接。
- 原型发现当前已具备语言资产层，但缺少任务理解、主题内容与逻辑、学生个人能力、跨条件检索排序、渐进提示状态和可靠反馈边界。
- 完整记录、正式卡 ID、Core 表达 ID、范文、占比口径、缺失问题与待讨论问题见 `docs/guided-writing-agent-prototype-2026-08-19.md`。
- 后续若正式进入运行时 Agent 阶段，必须先通过新的范围决策同步更新产品规范、ADR、实施计划、测试和内容审核流程；本次记录不构成对运行时 LLM、自动评分或开放式迁移评价的授权。

## 第 5 步 Appreciation 释义浮层文案精简

- 完成时间：2026-08-19；按用户视觉复检意见，从正式原文阅读和使用导览演示的 Appreciation 释义浮层中删除“表达欣赏”前缀，只保留当前语境的中文含义。
- 同步精简键盘与读屏标签，不再朗读重复类型前缀；Core / Appreciation 的视觉层级、学习模式和数据均未改变。
- 设计系统明确：Appreciation 浮层直接显示中文释义；新增文案回归测试，防止该前缀重新进入真实浮层或导览演示。

## 比赛评委链接部署准备

- 完成时间：2026-08-31；当前状态：本地实现与验证完成，等待用户连接 GitHub 和 Railway 账号。
- 新增比赛模式、内部页面保护、noindex、健康检查与评审环境文案；本地单用户模式保持原样。
- 评委首次访问获得签名会话，每个浏览器自动创建只含 approved 正式内容的独立 SQLite 数据库；避免不同评委互相看到 Today、进度和 Guided Writing 草稿。
- DeepSeek 调用新增每会话及全局小时限额；Key 仍只由服务端环境变量读取，模型失败继续使用既有保留输入与回退路径。
- Git 忽略范围已覆盖 `.env.local`、本机数据库、原始材料、产物和编译缓存；新增 GitHub Actions 全量验证。
- 验证结果：18 项内容 fixtures、187 个单元测试、49 个集成测试、TypeScript、普通模式生产构建、比赛模式生产构建全部通过；浏览器检查首页、学习入口和控制台，HTTP 检查 health=200、settings/candidate API=404。
- 下一步仅剩外部发布：创建 private GitHub repository、push `main`，在 Railway 连接仓库、挂载 `/app/data` volume、填写服务器变量并生成 HTTPS 域名。
