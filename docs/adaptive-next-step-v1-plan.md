# Phase 2.4 Adaptive Next-Step v1 — Repository Audit 与最小方案

- 状态：最小实现完成，等待用户产品验收
- 前置阶段：Phase 2.3 已由用户于 2026-08-24 验收
- 边界：不实现 Guided Writing，不重排完整 Today 队列，不生成新正式练习，不增加模型调用

## 1. 当前流程

当前的“下一步”完全由页面路由固定：

```text
Sentence / Collocation Learn
→ Recall
→ 固定进入该项唯一的 Use
→ 固定进入 Today 下一项或总结
```

- `buildDailyPlan` 与 `buildCollocationDailyPlan` 只根据旧进度、当天 attempts、到期时间和数量上限构造固定队列；
- `study-navigation.ts` 决定 Recall → Use → 下一项的固定链接，不读取 Learner Model；
- Use 完成后，`nextReviewState` 仍按自评把 `review_states` / `collocation_progress` 安排到下一个上海自然日；
- `learning_evidence` 与 reducer 已可提供 Recall / Guided Use / Transfer Use / Delayed Retention 状态，但 `nextReviewAt` 尚未由自适应层维护；
- 现有 Use attempt ID、evaluation run 与 evidence 已能稳定对齐；Sentence / Collocation Recall 仍由服务端生成随机 ID，因此 v1 不把 Recall 提交作为决策触发点。

## 2. 现有已审核练习库存

| 学习资产 | 数量 | 当前唯一 Use 类型 | 可用性结论 |
|---|---:|---|---|
| Sentence structure / mixed | 171 | `slot_replacement` | 171 项都有且每项只有 1 套；当前映射为 Transfer Use |
| Sentence vocabulary | 15 | `guided_application` | 15 项都有且每项只有 1 套；当前映射为 Guided Use |
| Collocation Core | 286 | `guided_application` | 每项只有 1 套；162 项为 `cross_topic`，124 项为 `slot_replacement` |

库存限制：目前没有同一资产同时拥有“较低支架 Guided Use + 较高迁移 Cross-topic Use”的两套已审核练习。因此规则可以支持这种动作和 guard，但只有在目标 exercise 真实存在时才能选择；v1 不补写、不伪造练习。

## 3. v1 的实际产品效果

只在正式 Use 完成并保存自评后选择下一步。完成页不再永远显示“学习下一项”，而是根据本次正式 evidence 和该资产的历史状态显示一个主要动作：

- `继续下一项`：本次结果足够可靠，或评价不可用时保持旧流程；
- `回看原句 / 搭配`：本次仍未形成可用证据；
- `再做提示运用`：只有同一资产存在已审核的较低支架练习时；
- `换场景再用一次`：只有同一资产存在尚未完成的已审核 cross-topic exercise 时；
- `稍后复测`：独立成功或依赖帮助完成后，幂等保存未来复测时间。

界面保持紧凑：完成状态下只显示“下一步 + 一个主要按钮”；必要时附一行复测日期。reason codes、候选动作和 guard 只写安全记录，不堆到学习页面。用户始终可以选择“按原队列继续”。

Feature flag 关闭或自适应服务失败时，页面必须原样使用现有 `nextHref` / `nextLabel`。

## 4. `adaptive-policy.v1` 最小规则

| 优先级 | 条件 | 选择 | 附加效果 |
|---:|---|---|---|
| 1 | 最新 evaluation 不可判断、fallback 或低置信 | `ADVANCE` | 不生成 mastery，不安排自适应复测；保持旧流程 |
| 2 | 最新正式 Use 为 failure / incomplete | `RETURN_TO_SOURCE` | 不改旧复习状态 |
| 3 | Recall 已稳定、Transfer 失败，且同资产存在已审核 Guided exercise | `GUIDED_USE` | 当前库存不满足时 guard 拒绝并回到 `RETURN_TO_SOURCE` |
| 4 | Guided Use 独立成功、Transfer 缺失，且同资产存在已审核 Cross-topic exercise | `CROSS_TOPIC_USE` | exercise 不存在时不得选择 |
| 5 | 一次非阻断的局部语法或普通拼写修正后 pass | `ADVANCE` | 安排下一个上海自然日的 quick-confirmation retest |
| 6 | 目标表达、搭配、意义等实质反馈后 pass，或经过多轮修正 | `ADVANCE` | 安排下一个上海自然日的 lower-scaffold retest |
| 7 | 仅机械笔误修正，或 Transfer Use 无提示独立成功 | `ADVANCE` | 不降级能力证据；安排至少 72 小时后的 retention retest |
| 8 | 其他已判断结果 | `ADVANCE` | 不夸大状态 |

`RETRY_WITH_HINT` 保留在有界动作类型中，但 v1 不在正式自评后重复 Phase 2.2 已经执行过的即时修改链。只有以后存在独立、已审核的下一层提示入口时才能通过 guard。

## 5. 最小数据与服务方案

建议新增两个 additive 表，不修改旧 attempts、`review_states` 或 `collocation_progress`：

1. `adaptive_training_decisions`
   - 以正式 Use attempt ID 作为幂等 trigger；
   - 保存 `policy_version`、最终 action、reason codes、input evidence IDs、candidate actions、guard results 与安全 trace 引用；
   - 重复 HTTP 请求返回同一决策，不重复插入。
2. `adaptive_retests`
   - 保存资产、来源 decision、目的（`quick_confirmation` / `lower_scaffold` / `retention`）、`due_at` 与状态；
   - `schedule_delayed_retest` 以来源 decision 幂等创建或更新；
   - Phase 2.4 先保存并显示计划；产品验收修正允许 Today 只读纳入已经到期且尚未被后续 Use 覆盖的计划，但不改写复测、attempt 或旧复习状态；完整 Today Planner 仍留到 Phase 2.7。

新增 `MIMICLOOP_ADAPTIVE_NEXT_STEP_ENABLED=false`。策略为纯确定性代码，不调用 DeepSeek，不产生 API 费用。备份 Schema 与完整备份需同步升级并兼容 v1.4。

## 6. 最小接入点

1. Sentence / Collocation Use attempt 保存成功并生成 evidence；
2. feature flag 开启时，服务端读取可信 attempt、evaluation、approved exercise 与 Learner Model state；
3. `select_next_training_action` 运行固定规则与 guards；
4. 决策和可选 retest 在事务中幂等保存；
5. API 响应带回受限 action；完成页映射为紧凑按钮；
6. 任一步失败均回退现有固定 `nextHref`，正式 attempt 和自评不回滚、不丢失。

## 7. 测试与验收

- 规则单测：按优先级覆盖 unavailable、failure、assisted pass、guided success、transfer success、缺 exercise、重试 guard；
- 模拟 learner histories：同一组 evidence 必须稳定得到同一 action 和 reason codes；
- 数据库集成：attempt → evidence → decision → optional retest 的最终数据库状态；
- 幂等：同一 Use attempt 重放不新增 decision、trace 或 retest；
- 内容 guard：不存在 approved exercise 时不能返回 Guided / Cross-topic；
- 关闭开关：Today、Recall、Use、自评和次日旧调度与当前完全一致；
- 备份往返：决策和复测计划可恢复，v1.4 旧备份仍可恢复；
- 浏览器验收：Sentence 与 Collocation 各验证 ADVANCE、RETURN_TO_SOURCE、scheduled retest 和 fallback。

## 8. 实现顺序

1. 先实现纯函数 action / policy / guards 和模拟历史测试；
2. 再加 additive migration、repository、幂等 decision/retest 与备份；
3. 接入两个 Use attempt API，feature flag 默认关闭；
4. 最后修改两个 Use 完成态的紧凑下一步按钮并做浏览器验收。

## 9. 实现结果（2026-08-24）

- 已实现纯确定性 `adaptive-policy.v1`，不调用 DeepSeek；模型只继续负责原有 Use 语言评价。
- 已新增 additive `adaptive_training_decisions` 与 `adaptive_retests`；正式 attempt、旧复习状态和 Today 队列均未重构。
- Sentence / Collocation Use 保存后均可返回受限下一步；策略或存储失败时只降级为原固定导航，已保存的答案和自评不回滚。
- 完成页只展示一句下一步和一个主按钮；建议偏离原计划时保留“按原计划继续”。
- 正式自评前保存的 evaluation retry chain 会由确定性规则归类：一次非阻断的局部语法/普通拼写修正安排次日 quick confirmation；目标表达、搭配、意义或多轮修正安排次日 lower-scaffold；机械笔误仍按独立完成处理。
- quick-confirmation 与 lower-scaffold 均安排到下一个 Asia/Shanghai 自然日；独立成功的 retention 复测至少间隔 72 小时。完成页分别显示“快速确认 / 提示复测 / 保持复测”。
- 备份升级为 v1.5，并保持 v1.0–v1.4 恢复兼容。
- `MIMICLOOP_ADAPTIVE_NEXT_STEP_ENABLED` 默认 `false`；关闭时 API 返回和完成页行为保持旧逻辑。

验证结果：18 项内容 Schema fixtures、123 个规则单元测试、28 个数据库集成测试、TypeScript 与生产构建全部通过。数据库集成覆盖 decision / trace / retest 最终状态、重复提交幂等、无可靠 evaluation 的保守回退、局部修改链分类和 v1.5 备份往返。隔离数据库浏览器实测 Sentence / Collocation 两条正式 Use 保存后各生成 1 条 decision 与 1 条安全 trace，完成页均显示单一下一步，浏览器无警告或错误；测试数据库随后已删除。

当前限制仍由库存决定：每个资产只有一套 approved Use，因此 v1 的 Guided / Cross-topic guard 大多会保守关闭，不会临时生成第二道题。当前 Today 仅增加了只读的到期复测接入、旧到新排序和有限名额再平衡；不会改写 interval、自动完成 retest 或替代 Phase 2.7 的完整 Planner。Guided Writing 仍未开始。
