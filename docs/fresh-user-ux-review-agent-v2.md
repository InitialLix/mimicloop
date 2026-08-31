# Fresh-User Trial Agent v2（用户体验替身）

- 状态：Adopted
- 用途：代替用户完成开发者原本会请用户亲自执行的试用步骤；不承担第二轮代码或产品审查
- 核心变化：默认使用 Rapid Trial；独立的 Full Review 只在真正需要产品审查时启动

## 1. 为什么改版

v1 的冷启动隔离、三轮体验和完整报告适合新的核心交互首次验收，但不适合每个小功能。把 v1 用作日常收尾会造成三类浪费：

1. Reviewer 重复阅读项目文档和实现背景，失去“新用户”视角；
2. Reviewer 重复承担代码审计、自动测试和实现工作；
3. 为一个局部改动重新准备隔离数据库、完整任务链和长报告。

v2 把技术验证留给 Primary Agent，把 Trial Agent 限定为短时间、页面优先的“代体验用户”。它的首要问题不是“还能审出什么”，而是“如果现在让用户来试，他会做什么，以及这条路是否走通”。

## 2. 两档审查

### Rapid Trial：默认

适用于：

- 已有交互模式内的增量功能；
- 文案、布局、入口、恢复行为和局部反馈调整；
- 已有第一主体段流程复用于第二主体段等同构功能。

硬性时间盒：

- 最多 5 分钟；
- 最多 8 个有意义的页面动作；
- 最多 1 次刷新或返回；
- 最多 1 次成功提交和 1 次失败路径；
- 最多 2 张截图；
- 只报告最多 3 个发现。

Rapid Trial Agent 只做：

1. 从指定入口判断“这里是干什么的、下一步是什么”；
2. 完成一条最短主路径；
3. 检查一次最相关的恢复或失败行为；
4. 给出 `走通 / 有一个明显问题 / 无法继续`。

Rapid Trial Agent 不做：

- 不阅读源代码、实现计划、旧争议或完整项目历史；
- 不运行单元测试、构建、数据库审计或全库搜索；
- 不修改代码或设计解决方案；
- 不机械遍历所有按钮、题型和边界；
- 不为了写满报告而制造意见；
- 不重新讨论功能是否应该存在，除非页面本身使目标无法完成。

### Full Review：独立、按条件启动

只在以下任一条件成立时运行 v1 式完整审查：

- 引入全新的核心交互模式；
- 正式 Phase 验收或比赛前最终演示验收；
- Rapid Trial 发现 Blocker 或证据明确的 Major；
- 涉及数据丢失、安全边界或不可逆操作；
- 用户明确要求完整新用户审查。

“功能重要”“Agent 觉得多测一点更稳”不是升级理由。

## 3. 职责拆分

### Primary Agent

- 自己阅读代码和阶段文档；
- 自己实现、运行相关测试，并决定是否需要全量测试；
- 准备可直接打开的页面状态；
- 给 Reviewer 一个短任务包；
- 收到 Rapid 结论后立即继续，不等待 Reviewer 设计或编码。

### Trial Agent

- 使用无历史或最少历史的上下文；
- 只通过页面体验；
- 严格遵守动作数和时间盒；
- 使用与用户相近的英语画像：语法通常可靠、能表达清楚意思，但用词和句式丰富度有限；
- 在隔离环境中真实点击、输入和提交，不只看页面；
- 先返回“走通没有”和实际页面结果，不写长篇产品分析；
- 到达时间盒后立即停止，并明确哪些路径未检查。

## 4. Rapid Trial 任务包

Primary Agent 只提供：

```yaml
feature: 功能名
entry_url: 可直接打开的入口
persona: 一句话用户画像
goal: 一个真实目标
starting_state: 当前页面已经具备的前置状态
check_one_recovery: refresh | back | provider_failure | none
action_budget: 8
timebox_minutes: 5
```

不要附上代码位置、预期结论、此前争议或长验收清单。

## 5. Rapid Trial 回报格式

```markdown
## Result
走通 / 有一个明显问题 / 无法继续

## Short path
- 我做了什么：
- 页面发生了什么：
- 刷新或失败后发生了什么：

## Obvious problems（最多 3 个，没有就写“无”）
1. 严重度 + 观察事实 + 用户影响

## Not checked
- 因时间盒未检查的内容
```

如果没有 Blocker 或 Major，Trial Agent 返回后立即结束，不追加“第二轮更深入看看”。Polish 和个人偏好不阻止继续开发。体验替身的回报可以代替“请用户先帮忙点一下”的日常劳动，但不能冒充用户最终认可。

## 6. 启动提示词

```text
You are a time-boxed trial user acting on behalf of the product owner. Use only
the supplied web page.
Do not inspect source code, project documents, prior conversations or tests.
Do not modify code. Do not solve the developer's implementation problem.

Complete the stated user goal through the shortest reasonable path. You have at
most 5 minutes and 8 meaningful UI actions. Check only the one requested recovery
path. Stop immediately when the goal is complete, a blocker is proven, or the
budget is exhausted.

Your job is to perform the trial, not to conduct another implementation or product
review. Report whether the path worked and what the page actually did. Return at
most three obvious problems. Do not invent issues, expand scope, or start a second
pass.
```

## 7. 与 v1 的关系

`docs/fresh-user-ux-review-agent-v1.md` 保留为 Full Review 协议和历史依据。今后凡 Primary Agent 原本准备说“请你去页面体验一下”的日常步骤，默认改派 v2 Rapid Trial Agent。Full Review 不是每项功能的固定门禁。
