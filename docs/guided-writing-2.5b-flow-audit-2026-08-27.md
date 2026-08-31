# Phase 2.5B 论证链流程审计（2026-08-27）

- 状态：已确认并完成最小实现；精确下游 span、复用确认、Position 视觉分离、Development 关系条、上游回改与下游顺序复检均已落地
- 范围：一个已归档 IELTS Task 2 题目、Body Paragraph 1 的 learner-owned 英文构思
- 不扩展到：段落草稿、观点供应、语言润色、Band 评分、第二主体段或整篇作文

## 1. 审计结论

当前问题不是某一句英文指令难懂，而是固定的
`stance → claim → reason → mechanism → result`
把论证拆成五个节点后，没有处理 learner 在上游答案中自然地提前写出下游内容的情况。
因此每个节点可以被模型单独判为相关，整条路径却仍会出现职责重叠、重复追问和勉强补环。

稳定的内部 key、append-only turn、可信题目读取和失败回退都可以保留；不需要先迁移 SQLite，也不应重构其他学习功能。需要调整的是教学职责、模型观察字段、本地推进 policy 和对应 UI。

## 2. 真实路径暴露的问题

本次 learner 路径中：

- Claim 已同时包含价值判断和预期结果，但仍被当作一个边界清楚的段落主张接受；
- Reason 用两句话同时给出共享环境这一前提，以及伤害会反映到人类环境这一展开；
- 系统仍强制进入 Development，再次询问中间过程；
- `development_relation=causal` 是根据一个已经混入展开内容的 Reason 推断出来的，后续问题因此不一定对应真正缺失的逻辑；
- 若继续进入 Result，很可能再次要求 learner 换一种说法重复 Claim 中已经写过的结果。

这说明“每个节点各有一段文字”不能等同于“每段文字只完成一个逻辑职责”。

## 3. 逐节点审计

| 当前节点 | 应有职责 | 当前漏洞 | 最小修正 |
|---|---|---|---|
| Position / stance | 回答整道题的总体立场 | 在左侧与主体段四个逻辑节点并列，容易被误解为段落中的第一句 | 保留内部 key 和数据；视觉上改为段落任务上方的 Essay position/context，不计入主体段论证步骤 |
| Claim | Body Paragraph 1 只发展一个可论证的中心判断 | `relevant + specific` 不足以拒绝空泛价值词、含混结果或已经塞入整条因果链的答案 | 增加“是否构成清楚段落命题”和“是否含下游内容”的受限观察；额外内容不判错，但必须识别精确原文 span |
| Reason | 给 Claim 增加一条独立前提，回答为什么值得相信 | 当前可接受同时包含 reason、development 和 result 的多句答案；接受后仍机械进入下一节点 | 判断是否真的增加 premise；若答案已包含后续关系，先让 learner 确认复用，而不是重复追问 |
| Development / mechanism | 补上当前 Claim 与 Reason 之间实际缺失的 warrant、过程、标准、适用关系或条件 | 先固定有一个 Development，再让模型为它分类；可能在逻辑已经完整时制造一个缺口 | 先判断“是否仍有缺环”，再决定追问；问题使用可见的 A → ? → B 关系，而不是抽象的 `intermediate process` |
| Result / Link | 说明这一段由前文可以推出什么，以及怎样完成段落职责 | 对 opinion/causal 路径经常与 Claim 的结果部分重合；容易逼 learner 发明第二个结论 | 前台改为 Paragraph takeaway / Why it matters；允许复用上游精确片段，只要求有限收束，不要求新增事实或独立结尾句 |

## 4. 正确的教学关系

五个数据库 key 暂时不变，但 learner 看到的结构应区分全文背景和主体段推理：

```text
Essay position（全文背景，不属于本段四步）

Body Paragraph 1
Main point / Claim
→ Why is it true? / Reason
→ How does it work here? / Development
→ What does this paragraph establish? / Takeaway
```

这些是构思槽位，不是 IELTS 官方规定的四句话，也不要求最后写出的段落逐句对应。

## 5. 动态推进规则

### 5.1 单节点评价不能只返回 accept / retry

在不允许模型生成内容的前提下，模型需要额外返回受限观察：

- 当前节点是否已完成；
- 是否存在重复上游内容；
- learner 原答案中是否包含可能属于下游节点的**精确 substring**；
- 当前 Claim 与 Reason 之间是否真的仍有缺环；
- 若有缺环，它属于 causal、principle application、comparison、problem response 或 qualification 中哪一类。

所有 span 必须由本地代码验证确实属于 learner 原答案；模型概括、改写或新增文本一律拒绝。

### 5.2 本地 policy 的最小动作

```text
ACCEPT_CURRENT
RETRY_CURRENT
OFFER_REUSE_EXACT_SPAN(next_node)
RETURN_TO_UPSTREAM(node)
ADVANCE_TO_NEXT_MISSING_NODE
READY_FOR_CHAIN_REVIEW
```

如果 Reason 已经清楚包含 Development，UI 应先展示 learner 自己的原句并提供：

- Use this part
- Edit it first
- Answer separately

未经 learner 确认，不把同一答案自动写入第二个 graph 节点。

### 5.3 全链复检应提前发挥作用

当前只在 Result 通过后复检，发现上游弱点太晚。最小方案不是每一步都增加第二次模型调用，而是：

- 单轮评价增加节点边界观察；
- 本地先处理精确 span 复用；
- 完整链结束后仍保留一次只读全链复检；
- 全链复检发现 Claim 本身含混时，确定性退回最早的 Claim，而不是让 learner 在 Development/Result 中继续补救。

## 6. 页面最小效果

1. 左栏顶部单独显示 `Essay position`，主体段进度只显示四个构思职责。
2. 当前问题上方显示一条紧凑的关系图，不提供答案，例如：

   ```text
   Your claim  ←  [missing connection]  ←  Your reason
   ```

3. 问题不用术语猜谜，Development 根据关系改为：
   - cause：`What changes between these two ideas?`
   - principle：`Why does this principle apply here?`
   - comparison：`What standard makes this comparison valid?`
   - response：`Which part of the problem does this response change?`
   - condition：`When is this claim true, and when might it not be?`
4. 若上游已经回答，显示独立的 `You may already have this` 板块，只引用 learner 原文并让 learner 决定是否复用。
5. feedback 不再只显示 `Accepted`；应区分：
   - `Clear and ready`
   - `Clear, with a later step already included`
   - `Relevant, but the main claim is still too broad`
   - `The connection is still missing`
6. Result 前台改名为 `Takeaway` 或 `Why it matters`，明确它是构思收束，不是必须写进作文的固定结尾句。

## 7. DeepSeek 最小验收标准

| 节点 | 接受 | 退回 |
|---|---|---|
| Position | 清楚回答题目需要的立场、程度或两问边界 | 只复述题目、漏答决定性部分、内部矛盾 |
| Claim | 一个明确、可争论、符合 Body 1 职责的段落命题 | 空泛价值判断、只有主题标签、范围过大、无法继续论证 |
| Reason | 增加一条不同于 Claim 的可理解 premise | 只是换词重复 Claim、例子代替理由、与段落职责无关 |
| Development | 补上已识别的具体关系，且没有只重复两端 | 没有解释关系、跳到无关例子或新增另一主张 |
| Takeaway | 从现有链条有限推出，并完成当前段落职责 | 过度结论、引入新主张、与 Claim 重复而没有完成段落职责 |

普通 typo、小语法错误和不够高级的词汇，只要逻辑可恢复，均不阻断构思。

## 8. 实现顺序与停止线

1. ~~先用 fixture 冻结节点边界、提前内容和“无需再从头回答 Development”的案例；~~ 已完成；
2. ~~扩展 Coach Schema，加入精确下游 span 观察；~~ 已完成，Schema v1.2；
3. ~~扩展本地校验和 policy，不改 SQLite 表；~~ 已完成；
4. ~~实现复用确认 UI，并把 Position 从主体段进度中视觉分离；~~ 已完成；
5. ~~实现上游回改与下游待复检；~~ 已完成，保留 append-only 历史并禁止跳过尚未复检的上游依赖；
6. 跑 Schema、规则、数据库、生产构建，并只用 2–3 条真实 DeepSeek 路径验收；
7. 用户确认完整构思真正有帮助后，才讨论 learner-written 段落草稿。

本审计未授权段落生成、内容提示、语言评分或任何后续 Phase 功能。
