# 本地数据库与恢复约定

MimicLoop 使用 SQLite + Drizzle ORM。第一阶段确定性流程只读取本地人工批准内容。Phase 2.1 可在服务端 feature flag 开启时调用受控 Use Evaluator；它不会把候选卡自动提升为正式内容，也不会直接修改复习状态。

## 数据边界

- `source_essays`：原始范文及可追溯元数据；
- `candidates`：全部审核候选，包括 `deferred` 和 `rejected`；
- `cards`：只允许 `content_status = approved` 的正式学习卡；
- `card_topics`、`card_argument_functions`：用于后续页面筛选；
- `attempts`、`review_states`：练习事实记录与当前复习状态；
- `settings`：本地设置；
- `content_imports`：用整批内容的 SHA-256 标识已导入版本。
- `collocation_candidates`：完整范文扫描得到的搭配候选，不进入学习队列；
- `collocations`、`collocation_topics`、`collocation_argument_functions`、`collocation_source_links`：人工批准后的正式搭配与可回溯来源；
- `collocation_progress`、`collocation_attempts`：与句子完全分开的搭配学习状态与尝试事实；
- `collocation_imports`：Collocation 候选的独立幂等导入记录。
- `agent_traces`：Phase 2 安全运行轨迹，只保存步骤、版本、模型、token 和错误码，不保存隐藏思维链或原始 provider 输出；
- `use_evaluation_runs`：以稳定 attempt ID 幂等保存当前答案、版本化 exercise ref、结构化评价、展示反馈和 trace 关系；模型评价不直接写入 `review_states` 或 `collocation_progress`。
- `learning_evidence`：由正式 Recall / Use attempts 幂等生成的只读能力证据；不反向修改原始作答或复习状态。
- `guided_writing_paragraph_drafts`：Phase 2.5C–2.5D append-only 保存 learner-written Body Paragraph 1 / 2、结构化 Logic / Language 评价、trace 引用和失败状态；不产生学习进度或调度更新。
- `guided_writing_introduction_drafts`：Phase 2.5E append-only 保存可选 Relevant opening、必需 Task framing、必需 Thesis、合并后的 learner 原文及 Task Response / Language 分栏评价；只引用已清楚通过的两个主体段 session。
- `adaptive_training_decisions`：以正式 Sentence / Collocation Use attempt 为幂等触发点，保存 `adaptive-policy.v1` 的受限动作、reason codes、候选动作、exercise guards、输入 evidence ID 与安全 trace 引用；不改写旧复习状态。
- `adaptive_retests`：由 decision 幂等安排的 quick-confirmation / lower-scaffold / retention 复测事实；Today 可只读纳入已经到期且尚未被后续 Use 覆盖的计划，但不会在读取队列时改写状态或历史记录。

复杂的内容对象同时保存在 `raw_json` 中，以保证导出时仍严格符合现有 JSON Schema；常用筛选字段单独建列和索引。

## 导入不变量

1. 句子输入固定为 `source_essays.json`、`candidate_cards.json`、`approved_cards.seed.json`；Collocation 输入分为候选 `candidate_collocations.json` 与人工批准 `approved_collocations.seed.json`；
2. 只有 approved seed 会写入 `cards`；
3. 相同整批 hash 再次导入直接跳过；
4. 已存在 ID 若对应不同内容，整次事务回滚并报告冲突；
5. 新卡自动建立 `new` 阶段的复习状态。
6. Collocation seed 只接受 `candidate`，不会直接写入 `collocations`；同一整批 hash 重复导入直接跳过。

## Collocation 候选审核写入

- 200 条候选按每批 20 条人工核对；普通范文正文句与正式句子卡句都可以成为来源；
- 保存、暂缓、驳回和合并只更新候选状态及审核历史；合并目标必须是已批准正式搭配；
- 批准前重新校验 Collocation Schema、canonical hash、accepted answers、pattern/slots、范文句位置和 surface occurrence；
- `card_id` 非空时还必须核对卡片的来源位置与 learning surface；`card_id` 为空时不得伪造学习句定位；
- 批准操作在单个事务内写入正式条目、主题、论证功能和全部来源关系；只有 `learning_mode=recall_use` 的 Core 才创建 `collocation_progress(new)`，`appreciation` 明确不创建或保留进度；任一步失败都会整体回滚；
- Collocation 的发布和练习不会修改句子 `cards`、`attempts` 或 `review_states`。
- 练习接口只接受 `learning_mode=recall_use`；即使直接请求 Appreciation 的 ID，也不会写入 Recall / Use attempt。

## 候选审核写入

- 候选编辑先写回 `candidates.raw_json`，并把状态更新为 `needs_edit`；不会直接修改已经发布的正式卡；
- 每次保存、批准、暂缓或驳回都要求人工理由，并追加 `review_history`；
- 原句和学习句在首版审核台保持只读，避免绕开来源定位与 `learning_edits`；
- 批准前同时执行 Candidate Schema、Sentence Card Schema、chunk 位置、pattern/slot、练习种子和内容 hash 检查；
- 只有批准操作会在同一 SQLite 事务中新增或升级 `cards`，并保留原有收藏、复习状态和练习记录；
- 已发布候选不能直接暂缓或驳回，避免无意删除仍有学习记录的正式卡。

## 今日队列与复习状态

- 今日队列优先保留当天已经完成的卡，再加入到期卡和新卡，避免刷新页面后跳回第一句；
- Recall 与 Use 分别保存事实记录；Recall 后卡片保持“进行中”，完成 `slot_replacement` 或 `guided_application` 后才算本句完成并更新复习状态；
- `adaptive_use_started_at` 记录新完成语义的启用时间，启用前的 Recall 保留原完成状态，避免升级后清空既有进度；
- 完成一张卡后不根据页面停留时间设置分钟级复习；
- 所有当天完成的卡统一在今日总结中提醒快速回看，并在下一个 Asia/Shanghai 自然日重新到期；
- 四档自评仍决定 `learning_stage`，但第一阶段的 `interval_days` 统一为 1。
- Today 的有界记忆排序先按到期 adaptive retest、到期时间和最久未复习，再用 Learner Model 状态作平局排序；不修改上述第一阶段调度事实。
- 当到期复习超过原复习名额时，最多把一半新内容名额临时让给复习；每日总上限与至少一半的新内容预算保持不变。该规则只决定当日选取，不回写旧自评、interval 或 mastery。

## 学习进度聚合

- 进度页只读取 `attempts` 与 `review_states`，不创建第二套统计事实表；
- Recall 之后但尚未完成 Use 的卡显示为“学习中”，不会计入当天完成；
- `slot_replacement` 与 `guided_application` 代表完成当前 Learn → Recall → Use 周期；`adaptive_use_started_at` 之前的 Recall 继续按旧完成规则保留；
- 最近七天按 Asia/Shanghai 自然日聚合，同一天同一卡重复提交只计一次完成；
- 主题与训练类型只显示“已接触 / 总数”，不把单次学习包装成掌握度；
- `attempts_completed_idx` 支持按完成时间读取最近练习与活动记录。

## 能力档案证据起点

- `settings.learner_model_evidence_started_at` 保存能力档案启用时间；只展示和回填该时间之后的 evidence；
- 调整起点只允许删除更早的 `learning_evidence` 派生行，不删除 `attempts`、`collocation_attempts`、`review_states` 或 `collocation_progress`；
- 2026-08-24 已按首次真实 AI evaluation 时间 `2026-08-19T13:21:16.859Z` 清理 74 条旧派生证据，保留 9 条新证据、63 条 Sentence attempts 与 20 条 Collocation attempts。

## 备份与恢复

备份遵循 `schemas/backup.schema.json`，并对除 `payload_hash` 外的完整 payload 计算稳定 SHA-256。当前默认导出 v1.9：除句子与 Collocation 数据外，还包含 Phase 2 的 traces、Use evaluation、learner evidence、adaptive training、Guided Writing sessions / turns、两个主体段草稿、节点语言 attempt 与 Introduction 草稿；Guided Writing 保存 learner 原始英文和结构化评价，trace 不保存原始答案、段落或开头。设置同时保存 Sentence / Collocation 的 Use rollout 时间及可选能力证据起点。v1.0–v1.8 旧备份缺失的新集合或字段按兼容规则恢复。恢复顺序为：Schema 校验 → hash 校验 → 若当前库非空则写回滚备份 → 单事务替换数据。任何校验、外键或写入错误都会阻止恢复或回滚事务。

默认文件不提交 Git：数据库位于 `data/mimicloop.db`，备份位于 `backups/`。
