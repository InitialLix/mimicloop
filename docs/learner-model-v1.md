# Phase 2.3 Learner Model v1

- 状态：Implemented，待用户产品验收
- reducer：`learner-state-reducer.v1`
- evidence：`learning-evidence.v1`
- learner：单机 `local-default`

## 产品效果

“学习进度”新增只读学习能力档案，区分：

1. Recall：不看答案时能否回忆；
2. Guided Use：指定目标表达后能否完成；
3. Transfer Use：能否在换语境后迁移；
4. Delayed Retention：至少间隔 72 小时后能否再次独立完成；
5. Spontaneous Use：当前练习都会指定目标，缺少可信采集场景，因此保持 `unknown`。

该档案不参与 Today 队列、`review_states`、`collocation_progress` 或复习排程。Phase 2.4 之前不据此自动选择下一题。

能力卡片的大数字表示“已有该类正式作答证据”的项目数，而不是只统计 `developing + stable`。具体能力状态在卡片下方分别显示“需加强 / 发展中 / 较稳定”，避免将已保存的 weak evidence 误解为“0 条记录”。

最近学习项目不再直接跳回旧学习卡，而是先进入只读的单项学习记录页。底层仍保留 Recall / Guided Use / Transfer Use / Delayed Retention 四维证据，但前台不再并列四块技术状态。页面使用同一字号层级的紧凑事实行，仅展示学习状态、判定、独立验证、最近记录和练习次数；不使用“大标题结论 + 解释卡片”的报告式排版，也不使用“能……，但……”一类口语化结论。

历次答案、时间、自评、提示使用、AI verdict 和模型收入默认关闭的“查看全部学习记录”，只在追查判断时展开。Sentence 页额外标明当前真正训练的可复用结构或目标表达，避免把“掌握训练目标”误解为背诵整句。页面仍只提供学习内容、Recall 和 Use 显式入口，不自动选题，属于 Phase 2.3 inspection UI。

## Repository Audit 后的历史映射

| 现有记录 | v1 evidence | 保守限制 |
| --- | --- | --- |
| Sentence Recall | `recall` | 使用自评；看过参考答案后最多 `partial` |
| Collocation Recall | `recall` | 同时检查 canonical/accepted match；未匹配时不能成为 success |
| Sentence `guided_application` | `guided_use` | 只读取已经完成正式自评的 attempt |
| Sentence `slot_replacement` | `transfer_use` | 视为换槽位/语境迁移 |
| Collocation `slot_replacement` | `guided_use` | 目标表达已指定 |
| Collocation `cross_topic` | `transfer_use` | 内容已审核为跨主题应用 |

AI 关闭、旧版本或 evaluator fallback 的 Use 记录仍被保存，但自评成功最多映射为 `partial`，不能伪装成模型确认的独立成功。`cannot_judge`、`needs_review` 或 confidence 低于 0.75 的 evaluation 映射为 `not_judged`，reducer 完全忽略其能力影响。

## Append-only 与幂等

- 新表 `learning_evidence` 不修改旧 attempts；每条 evidence 通过 `source_kind + source_id + dimension` 唯一定位。
- evidence ID 由版本、来源 attempt 和 dimension 确定性计算；重复回填不产生新行，内容冲突直接失败。
- 新 Recall/Use attempt 与 evidence 在同一 SQLite 事务中写入。
- 旧 attempts 在首次读取档案、导出备份或显式同步时按完成时间幂等回填。
- `learner_model_evidence_started_at` 可设置能力档案的证据起点；早于起点的派生 evidence 会被删除且不再回填，原 attempts 与既有复习排程保持不变。
- 当前 state 不单独保存百分比或缓存表，每次从 evidence 通过版本化 reducer 重算。

## Reducer v1

- 状态只有 `unknown / weak / developing / stable`，不展示伪精确百分比。
- 独立 success 要求 `hintLevel=0`、`referenceShown=false`、`origin=user_independent`。
- Recall 中“先作答、后揭晓参考答案、再自评”是正常核对，不视为作答前帮助；揭晓后若收起答案并继续修改，才记为 assisted。揭晓时会暂时锁定输入框，使这个边界可验证。
- Transfer evidence 可以支持 Guided Use，反向不成立。
- 两次 assisted pass 且没有 failure，最多到 `developing`。
- `stable` 至少需要两个不同上海自然日的独立 success，且 success 数必须多于 failure。
- stable 后一次 failure 不降级；连续累积两次 failure 才降到 `developing`。
- 一次 success 不能覆盖两次及以上 failure。
- 新的独立、可判断 attempt 距上次已判断 evidence 至少 72 小时，才另外产生 `delayed_retention` evidence；即时重试不算延时保留。

## 备份与兼容

- 完整备份升级到 `1.4.0`，新增可选历史集合 `learning_evidence`；v1.4 必须包含该集合。
- 备份同时保存可选的 `learner_model_evidence_started_at`，恢复后仍遵守相同证据起点。
- v1.0–v1.3 备份仍可恢复；恢复完成后从旧 attempts 保守、幂等生成 evidence。
- 备份只保存 evaluator 版本、模型名、confidence 与 trace 引用，不包含 API Key。

## Phase 2.3 验收边界

- 可从 evidence 完整重算 state；
- 低置信、无法判断、看过参考答案的记录不能抬高独立 mastery；
- 原 attempts、现有进度和排程保留；
- 只读 inspection UI 可见；
- 未实现 Phase 2.4、Guided Writing、自动规划或额外模型调用。
