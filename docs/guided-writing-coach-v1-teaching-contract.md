# Guided Writing Coach v1 教学流程契约

- 状态：Active；节点职责、受限 `development_relation`、精确下游片段复用与完整论证链复检已实现，上游回改仍待增量实现与用户复检
- 范围：Phase 2.5B，一个已归档 IELTS Task 2 题目、一个 Body Paragraph 1、全英文构思
- 不在范围：段落草稿、语言润色、表达检索、Band 评分、第二主体段、整篇作文

## 1. 最终效果

这一阶段结束时，learner 应得到一份由自己产出的、可以据此写段落的论证提纲，而不是五个彼此孤立的回答。

```text
清楚回答整题
→ 理解当前主体段的职责
→ 提出一个段落主张
→ 给出不重复的支持依据
→ 补全适合该论证类型的展开关系
→ 说明这一段最终证明了什么
→ 完整链条复检
```

五个节点是教学支架，不是 IELTS 官方规定的五句模板。内部继续保留稳定 key：

```text
stance → claim → reason → mechanism → result
```

其中 `mechanism` 在界面中应称为 `Development`。它可能是因果机制，也可能是原则适用、比较标准、问题与方案的对应关系或成立条件。

## 2. 不可违反的教学边界

1. Agent 只解释当前任务、诊断缺口和选择下一条有界问题，不提供题目观点、改写句、示范答案或段落。
2. learner 使用简单英语、小语法错误或普通拼写错误时，只要意思可判断，就不能阻止构思推进。
3. 每一步只要求当前节点所需的信息；不能因为尚未回答后续节点而判错。
4. learner 提前给出后续内容时不能因“答得太多”判错，也不能把 Agent 的概括当成 learner 原话保存。
5. discussion 中公平解释 learner 不认同的一方，不构成立场矛盾。
6. 一条答案不能仅凭模型判断自动写入多个正式节点；复用必须由 learner 确认，并保留原始文本与 origin。
7. 模型只返回结构化观察；问题选择、节点推进、回改影响、幂等和保存由确定性代码决定。
8. 单节点全部通过仍不等于论证完整；进入下一阶段前必须做一次全链条复检。

## 3. 节点职责

### 3.1 Position

**learner 要做什么**

回答整道题的总体问题。discussion 需要表明最终判断，但这里不要求解释 Body Paragraph 1 的细节。

**通过条件**

- 回应题目的实际问法，而不是只复述主题；
- 需要立场时给出清楚方向；
- 涉及程度、比较、两问或正负判断时，不遗漏决定总体答案的边界；
- 不要求 reason、development、result。

**不能做什么**

- 因没有提供原因而返回 `missing_logic`；
- 把 discussion 的 Body Paragraph 1 职责误当成 learner 的总体立场。

### 3.2 Claim

**learner 要做什么**

提出 Body Paragraph 1 要展开的一个主要主张。主张必须服从可信 `paragraph.role` 和 `paragraph.goal`，不固定为“支持自己的立场”。

**按题型的默认职责**

| 题型 | Body Paragraph 1 的默认 Claim 职责 |
|---|---|
| opinion | 支持总体立场的一个主要主张 |
| discussion | 公平解释观点 A 的一个核心理由 |
| advantages / disadvantages | 分析一个主要优势 |
| causes / solutions | 识别题目要求的一个主要问题或原因 |
| positive / negative development | 分析一个主要影响 |
| two-part / multi-part | 直接回答第一问 |

**通过条件**

- 与当前段落职责直接相关；
- 只有一个可展开的主要主张；
- 不是“这个观点有道理”“有很多影响”一类空标签；
- 不要求 learner 同时给出 reason 或 mechanism。

### 3.3 Reason

**learner 要做什么**

提供一条新的支持依据，回答“为什么这个 Claim 值得相信或认真考虑”。Reason 不能只是换词重复 Claim。

前台不得只使用 `underlying reason` 这一抽象术语。默认问题应改问：什么事实、原则或成立条件使 Claim 值得相信；通过独立、常显但紧凑的 Logic Check 板块做“怀疑者仍会追问为什么吗”检查。此 Lens 是依据 IELTS 对 main ideas 的展开、支持和逻辑推进所做的教学转译，不得冒充官方固定作文模板。

**通过条件**

- 给 Claim 增加新的解释信息；
- 与段落职责一致；
- 足够明确，可以继续展开；
- 可以是事实性原因、价值原则、比较依据或问题来源；
- 暂时不要求完整作用过程、现实结果或例子。

**discussion 特例**

如果 Body Paragraph 1 正在解释观点 A，Reason 只需支持观点 A 的内部逻辑，不必支持 learner 的最终立场。

### 3.4 Development（内部 key：`mechanism`）

**learner 要做什么**

补上 Claim 与 Reason 之间最容易被省略的关系。具体问题必须取决于论证关系，不能一律追问物理式因果。

| 关系 | 该节点应追问什么 | 不应要求什么 |
|---|---|---|
| causal | 原因通过什么过程产生影响？ | 再重复原因或只报结果 |
| principle_application | 为什么这个原则适用于当前对象或行为？ | 编造一个现实后果 |
| comparison | 依据什么共同标准判断一方更重要或更有效？ | 把比较写成单向因果 |
| problem_response | 方案具体作用于问题链的哪一步？ | 只说“会有帮助” |
| qualification | 这个主张在什么条件或范围内成立？ | 无条件绝对化 |

**最小实现约束**

- 模型可返回一个受限的 `development_relation` 观察；
- 本地 Schema 只接受上述枚举和 `unclear`；
- 本地 policy 根据枚举选择问题；
- 模型不能直接提供缺失的关系内容。

### 3.5 Result / Link

**learner 要做什么**

说明前面的分析最终证明了什么，以及它怎样完成当前段落职责。

它不总是现实中的“结果”：

- causal：直接后果及其与题目要求的关系；
- principle application：为什么据此前一种观点具有道德或规范上的分量；
- comparison：比较后可以作出的有限判断；
- problem response：方案预期改善了什么；
- qualification：限定后仍可保留的结论。

**discussion 特例**

解释观点 A 的段落只需完成观点 A 的内部论证，不能强迫 learner 在该节点反驳它或回到最终支持的观点 B。

## 4. 单轮评价与下一步

每轮只允许以下确定性动作：

| 状态 | UI 效果 | graph 变化 |
|---|---|---|
| accept | 保存 learner 原话，进入下一缺失节点 | 只写当前节点 |
| retry | 显示一条具体诊断，保留输入供局部修改 | 不推进 |
| cannot_judge | 说明无法判断并允许重试 | 不推进 |
| provider failure | 显示故障说明，保留原始回答 | 不推进 |
| earlier content detected | 展示 learner 自己的精确片段，询问是否复用 | 未确认前不写入 |

`feedback_en` 只回答：当前回答哪里已经满足、还缺哪一种关系。不得包含替换句、推荐观点或完整答案。

## 5. 提前回答的复用

如果 learner 在 Position 或 Claim 中已经写出后续内容：

1. 当前节点按自身标准判断，不因额外内容失败；
2. 模型只可返回 learner answer 中的精确 substring 及可能覆盖的节点；
3. 本地验证拒绝任何不属于原答案的 span；
4. 下一节点显示：`You may already have answered this: “…”`；
5. learner 可选择沿用、编辑或重新回答；
6. 只有确认后才写入节点，并保存真实 origin 与来源 turn；
7. 不能由模型概括、修正拼写或润色后冒充 learner 原话。

`guided-writing-coach.v1.2` 已实现保守复用：`accepted_span` 与 `forward_span` 都必须是 learner 原答案中的精确、不重叠 substring，且 `forward_span` 只能指向紧邻的下一节点。本地校验拒绝模型改写、伪造、跨节点跳跃或自动保存；UI 由 learner 选择沿用、先编辑或另答。历史 v1/v1.1 多句 Reason 只在本地按原句显示兼容候选，仍必须由 learner 确认。

## 6. 回改上游节点

learner 应可从 Argument Chain 选择已经保存的节点进行修改。

- 原 turn 保持 append-only，不覆盖历史；
- 新回答创建新的 turn；
- 修改 Position 后，所有下游节点标为待复检，但不立即删除；
- 修改 Claim 后，Reason / Development / Result 待复检；
- 修改 Reason 后，Development / Result 待复检；
- learner 可以看到哪些内容仍可沿用，哪些出现冲突；
- 只有本地复检 policy 决定下游重新有效，模型 verdict 不直接改数据库状态。

回改 UI 已实现：已保存 Position 和主体段节点显示明确的编辑按钮。选择节点只把 session 重新置为 `building_argument` 并移动 `current_node`，不删除 graph、turn 或 trace；编辑通过后，本地 action 依次把原有下一节点作为 learner-owned 精确复检候选。上游尚未重新通过时，客户端和 repository 都拒绝跳到更后的节点。

## 7. 卡住时的帮助阶梯

当前 Phase 2.5B 不提供题目观点，因此帮助只允许逐级改变问题形式：

| 层级 | 允许的帮助 | 是否改变 origin |
|---:|---|---|
| 0 | 原始问题 | 否 |
| 1 | 解释当前节点职责，并可展开两条其他主题的静态回答形态示例 | 记录 after question |
| 2 | 通用 reasoning lens，例如公平、成本、条件、直接/间接影响 | 记录 after hint |
| 3 | 建议回看或修改上游节点 | 不提供内容 |
| 4 | 暂停并保留会话 | 不改变 graph |

禁止在 2.5B 中出现当前题目的观点选项、英文半成品、完整表达或参考句。允许每个节点默认收起两条与当前题目无关的静态 form examples，但它们只能说明回答形态，由本地代码按题型或关系确定性选择，不能进入模型 prompt、argument graph 或正式学习记录，也不能被包装成当前题目的答案。

## 8. 全链条复检

单节点通过后，进入 `ready_to_draft` 前需要一次只读的完整性评价。它检查：

- Claim 是否完成段落职责；
- Reason 是否真正增加支持而非重复；
- Development 是否补上适当关系；
- Result 是否从前文推出且没有过度结论；
- discussion 的反方解释是否被错误当作立场矛盾；
- 五个节点是否存在内容重复、范围漂移或互相冲突。

模型只返回问题节点和短诊断。本地 policy 只能：

```text
READY_TO_DRAFT
或
RETURN_TO_NODE(node, reason_code)
```

不得在完整性评价中生成修订后的论证链。

## 9. UI 最小效果

- 继续使用 Argument Chain + Current Question，不新增聊天窗口或仪表盘；
- 每个节点最多显示两句 step guide：当前任务、暂时不要做什么；
- `Mechanism` 前台改称 `Development`，避免 learner 误以为所有论证都是因果；
- feedback 只保留一条短观察；
- Position 作为全文背景单独显示；主体段进度只显示 Main point → Reason → Development → Takeaway；
- 已接受节点显示 learner 原话；上游回改尚未实现时不得显示虚假的编辑入口；
- 提前内容只以 learner 原始片段显示；
- Development 显示 Reason → missing connection → Main point 的关系条，不提供当前题答案；
- 完整链通过后显示一份紧凑提纲，不自动生成正文。

## 10. 验收案例

以下案例由自动化 fixture 与少量真实 DeepSeek 运行共同验证，不要求用户逐条审核模型 JSON。

1. **discussion + 反方伦理论证**：learner 支持观点 B，但 Body 1 公平解释观点 A；不得判矛盾，也不得强迫伦理理由生成现实后果。
2. **opinion + 因果论证**：Reason 与 Development 各自增加新信息；重复 Claim 必须重试。
3. **causes / solutions**：Body 1 只诊断问题或原因，不能提前要求方案。
4. **two-part**：Body 1 只回答第一问，不能因未回答第二问而失败。
5. **提前回答**：Position 同时含简短 Claim；Position 可通过，Claim 未经 learner 确认不得自动保存。
6. **内容重复**：Claim、Reason、Development 三次换词表达同一内容；全链不能进入 ready。
7. **回改上游**：修改 Claim 后下游内容保留但待复检，不丢历史。
8. **provider failure**：输入和 graph 均保持可恢复，错误不算学习失败。

## 11. 实现顺序

1. 先修正 Reason、Development、Result 的职责与题型/段落角色边界；
2. ~~增加受限 `development_relation` Schema 与确定性问题选择；~~ 已完成：关系随 append-only turn 保存并在刷新时确定性恢复，不改 SQLite 表结构；
3. ~~增加全链条复检，避免“节点数量齐全”冒充完整论证；~~ 已完成：Result 单节点通过后执行独立只读复检，通过才进入 ready，否则确定性退回最早需要修改的节点；
4. ~~再实现提前内容复用；~~ 已完成：Schema v1.2 精确 span、本地校验、action 持久化恢复与三种 learner 确认动作；
5. ~~最后实现上游节点回改和下游待复检；~~ 已完成：append-only 回改、顺序复检、旧内容确认和跳级保护；
6. 用上述 8 类案例跑自动化与固定真实模型基线；
7. 用户只复检 2–3 条完整学习路径，通过后才讨论 learner-written 段落草稿。

任何一步未验收时，都不得提前加入段落代写、表达检索、作文评分或完整文章流程。
