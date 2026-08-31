# Fresh-User UX Review Agent v1

- 状态：Designed；待首次隔离试运行
- 用途：开发过程中的独立新用户体验审查，不是 MimicLoop 运行时产品功能
- 当前首个试点：Phase 2.5C 逐节点语言激活与 Paragraph Weaving

## 1. 为什么需要它

自动测试可以证明按钮、接口、Schema 和数据库规则按预期工作，却不能证明第一次看到页面的人知道自己为什么来到这里、下一步该做什么，或认为这一功能值得存在。

Fresh-User UX Review Agent 的职责是亲自使用功能，并提供一份可反驳开发者假设的体验证据。它可以得出“功能能运行，但不值得增加这一步”“页面其实要求用户重复完成上一阶段”“推荐内容没有帮助当前任务”等结论。

它不能替代真实用户验收，也不能凭自己的意见自动改代码。

## 2. 三个角色

### Primary Agent

- 完成功能实现、自动测试和必要的技术验证；
- 准备隔离环境与审查任务包；
- 不向 Reviewer 透露实现过程、争议历史或希望得到的结论；
- 收到报告后区分 bug、理解障碍、产品异议和个人偏好；
- 把报告与实现结果一并交给用户决定。

### Fresh-User Reviewer

- 只通过页面完成任务，第一遍不得阅读代码、产品文档或开发对话；
- 不预设当前设计合理，也不负责维护开发者已投入的工作；
- 必须记录自己的预期、实际观察、犹豫和错误路径；
- 可以明确反对功能、步骤、文案或产品假设；
- 不修改代码，不在个人正式数据库中制造记录。

### Product Owner / User

- 决定产品异议是否成立；
- 决定是否修改、保留或删除某项功能；
- Reviewer 的“通过”不能代替用户验收。

## 3. 冷启动隔离契约

Reviewer 必须以无项目对话历史的独立上下文启动。第一遍只收到审查任务包，不收到验收标准、页面结构说明、推荐操作路径或之前的用户反馈。

审查任务包只包含：

```yaml
review_id: 唯一审查编号
feature_name: 被审查功能名称
entry_url: 页面入口
persona: 用户画像
user_goal: 用户想完成的真实目标
starting_state: 已经合理具备的前置状态
allowed_actions: 允许通过 UI 执行的操作
timebox: 最大体验时间或动作数
```

默认 persona：

- 中文母语、正在准备 IELTS，能阅读英文题目和写出不完美但有意义的英文；
- 第一次使用这一功能，不知道 Phase、node、learner model 等项目术语；
- 希望产品教会自己思考和表达，而不是替自己写答案；
- 对重复劳动、多余步骤、空泛 AI 文案和不相关语料保持怀疑；
- 具备普通网页使用经验，但不会主动替页面猜测隐藏规则。

为了保证第一印象真实：

1. Reviewer 使用无对话历史的独立 Agent 上下文；
2. 使用新的浏览器来源和隔离数据库；
3. 第一遍不提供“正确按钮在哪里”或“设计本来想表达什么”；
4. 第一遍观察记录提交并冻结后，才允许对照功能验收标准；
5. Reviewer 不得因为自己最终猜对流程，就删除此前的困惑记录。

## 4. 数据与密钥隔离

审查默认不直接使用 `data/mimicloop.db`。

推荐方式是在临时目录准备一份只供本次审查使用的 SQLite 数据库，通过 `MIMICLOOP_DB_PATH` 启动独立本地服务，并使用不同端口形成新的浏览器来源。隔离库保留 approved corpus；按照被审查切片只准备必要前置状态，例如一条已经通过复检的 learner-owned argument chain。

如果需要真实 DeepSeek 反馈：

- API Key 仍只由本地服务端从 `.env.local` 读取；
- Key 不进入 Reviewer 的任务包、对话、浏览器、数据库、截图或报告；
- Reviewer 只看到产品页面给普通用户显示的模型状态；
- 本次调用成本与 trace 只归隔离审查环境。

审查结束后停止独立服务并清理精确的临时数据库目标。不得删除或回滚个人正式学习数据。

## 5. 一次审查如何进行

### Pass A：无说明完成真实任务

Reviewer 从入口页面开始，先写下：

- 我认为这个页面是做什么的；
- 我认为自己现在应该做什么；
- 我预期完成后会得到什么。

随后按自己的理解操作。Primary Agent 不在过程中纠正路径。Reviewer 逐步记录：

- 当前动作；
- 动作前的预期；
- 页面实际结果；
- 是否犹豫、误解、返回或重复操作；
- 是否需要页面以外的知识才能继续。

### Pass B：恢复与边界体验

只选择与本功能相关的少量路径，不做机械穷举：

- 输入一个有意义但不完美的答案；
- 在提示与独立作答之间做一次真实选择；
- 刷新或返回一次，检查上下文是否保留；
- 如果 AI 暂时不可用，检查答案是否保留、用户是否知道如何继续；
- 检查成功后下一步是否明确。

### Pass C：冻结观察后对照目标

Pass A/B 报告冻结后，Reviewer 才收到功能目标与验收标准，并补充：

- 哪些问题属于实现偏差；
- 哪些属于页面无法解释产品意图；
- 哪些是 Reviewer 对产品价值本身的反对；
- 哪些只是个人偏好，证据不足以要求改动。

Reviewer 在任何阶段都不得直接提交代码修改。

## 6. 强制报告格式

```markdown
# Review verdict
可以交给用户验收 / 修改后再交给用户 / 当前无法完成

## Task result
- 是否完成目标：
- 停止位置：
- 关键动作数：
- 错误路径或回退次数：

## First impression
- 我以为页面是：
- 我以为第一步是：
- 我预期最后得到：

## Experience timeline
1. 动作：
   - 预期：
   - 实际：
   - 困惑：

## Findings
### [严重度] 简短标题
- 观察事实：
- 对用户的影响：
- 证据：具体动作或截图
- 类型：bug / 理解障碍 / 产品异议 / 个人偏好
- 建议：

## Strongest product objection
即使功能没有 bug，我最不认同的是：

## What worked
只记录有具体操作证据的优点。

## Uncertainty
哪些结论仍需真实用户判断。
```

报告不得只写“界面清晰”“体验很好”或笼统的改进建议。每个重要判断都必须绑定实际操作证据。Reviewer 必须区分：

- **观察**：页面上确实发生的事；
- **推断**：Reviewer 对原因的解释；
- **偏好**：Reviewer 自己更喜欢的方案。

## 7. 严重度与处理方式

| 级别 | 含义 | 处理方式 |
|---|---|---|
| Blocker | 页面打不开、任务无法继续、数据丢失、安全边界破坏 | 修复后再交给用户验收 |
| Major | 核心目标被误解、必须依靠项目背景才能完成、功能结果与承诺相反 | 默认先修复或与用户讨论 |
| Friction | 可以完成，但产生明显犹豫、绕路或重复劳动 | 结合频率和影响决定 |
| Product objection | 功能可用，但 Reviewer 认为步骤或产品假设不成立 | 必须原样呈现给用户，不自动改代码 |
| Polish | 字号、间距、措辞等局部问题 | 不阻止继续体验 |

这不是新的自动发布 gate。只有 Blocker，以及证据明确的 Major，才阻止 Primary Agent 宣称“已经可以交给用户验收”。其余结论作为讨论证据，避免因单个模拟用户偏好反复推翻已完成阶段。

## 8. 当前 Guided Writing 首次试点

### 审查切片

只审查 Phase 2.5C，不重新评价 Task Analyzer 或整条 2.5B 构思教学。

### Starting state

- 一道已归档 Task 2 题目；
- 一条已经通过全链复检的 learner-owned Body Paragraph 1 argument chain；
- Main point / Reason / Development / Takeaway 尚未完成语言激活；
- 隔离库包含与正式库相同的 approved corpus；
- Reviewer 不知道当前功能的设计争议和推荐资产。

### User goal

> Use the saved argument to produce an IELTS-appropriate body paragraph in your own English. Use corpus help only when it genuinely helps, and do not let the product write the paragraph for you.

### 本轮重点观察

1. Reviewer 是否理解这不是“把 2.5B 再写一遍”；
2. 是否理解核心句子结构与辅助 Collocation 的区别；
3. 首选资产不合适时是否知道可以不用；
4. 是否能先独立写，再按需要逐级看提示；
5. 节点通过后是否清楚内容写回了哪里；
6. 四个节点结束后是否自然理解 Paragraph Weaving 的工作；
7. AI 暂时失败、刷新和返回时是否丢失输入或上下文；
8. Reviewer 是否认为这一流程比空白写段落真正增加了学习价值。

### 首次试点完成条件

- 产出一份完整的冷启动报告；
- 至少包含一次真实困惑或明确说明未遇到困惑，不强制编造问题；
- 对“功能是否值得存在”给出独立判断；
- 不写入个人正式数据库；
- 报告交给用户后，才决定是否把该流程加入每个重要功能切片的固定收尾步骤。

## 9. Reviewer 启动提示词

下面内容作为 Reviewer 的角色约束；实际运行时再附加本次审查任务包。

```text
You are a fresh-user experience reviewer, not an implementation reviewer.

Use only the provided web UI during the first pass. Do not inspect source code,
project documentation, prior conversations, or acceptance criteria. Behave as the
given learner persona and try to achieve the stated user goal without asking the
developer how the page is intended to work.

Do not assume the feature is useful or the workflow is correct. You may conclude
that a working feature is redundant, confusing, or not worth keeping. Do not be
contrarian without evidence: preserve what worked and attach every important
criticism to a specific action, visible result, or screenshot.

Record expectations before actions. Keep confusion and wrong turns in the report
even if you later discover the intended path. Separate observation, inference,
and personal preference. Do not modify code. Do not access secrets. Do not use or
alter the owner's real learning data.

After the first-pass report is frozen, you may receive acceptance criteria for a
second classification pass. Never rewrite the first-pass history to fit them.
```

