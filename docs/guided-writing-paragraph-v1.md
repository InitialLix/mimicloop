# Guided Writing learner-owned 段落草稿 v1

- 状态：Implemented；待用户真实路径复检
- 范围：Phase 2.5C–2.5D，分别完成 Body Paragraph 1 与 Body Paragraph 2
- 不在范围：Introduction、Conclusion、全文组装、Band 评分、全文改写、自动学习进度

## 1. 目标

Phase 2.5B 证明 learner 能自己补全 Main point → Reason → Development → Takeaway。Phase 2.5C 先逐节点激活语言，再检查 learner 能否把四个已经通过的语言实现编织成一段连贯英文，而不是让模型把提纲代写成正文。候选可以是已学或未学；未学项只是学习机会，不是已掌握证据。

Phase 2.5D 复用同一条已验证路径完成第二主体段，但不要求 learner 重新声明总体立场。系统从第一段的 ready session 复制已确认 Position，并按可信题型地图让第二段从新的 Main point 开始。两段使用独立 session、graph、node attempt 和 paragraph draft；opinion 题由 learner 自己选择第二理由、必要限定或有限让步，Agent 只检查角色匹配、与第一段不重复及内部论证是否完整。

```text
learner-owned argument chain
→ select one argument node
→ deterministic code prepares a small approved-only candidate set
→ DeepSeek selects candidate IDs or returns no-fit; validated locally
→ learner writes independently or reveals graded hints
→ evaluate meaning / logic / target usage / naturalness
→ write accepted learner text back beside that node
→ repeat until all four nodes are language-ready
→ Paragraph Weaving starts from the four learner texts
→ server reloads trusted prompt, paragraph role and saved graph
→ DeepSeek returns separate Logic / Language observations
→ Schema and semantic validation
→ local policy derives the next action
→ learner keeps or revises the same editable paragraph
```

## 2. 写作规则

1. 只有 `ready_to_draft` 会话可以提交段落。
2. learner 可以改变提纲的措辞和句序；成文不要求每个 graph node 对应一句话。
3. 不设置固定段落字数配额，只显示当前 word count。
4. 模型不得返回完整改写、替换句、新观点、范文、模板或 Band 分数。
5. 每轮最多指出一个优先逻辑问题和一个优先语言问题，避免把页面变成错误清单。
6. 草稿不产生 Learner Model evidence，不修改复习状态、Today 或既有调度。
7. 一个节点不等于一句话；learner 可用一句、多句或句中成分完成节点，Paragraph Weaving 再决定合并和边界。

## 3. 逐节点语言激活

- 主界面只处理当前节点。上层最多显示一个来自 approved 句子卡的核心句子结构或 Rhetorical Move；下层只显示零至三个能嵌入当前意思的 approved Core Collocation。两层不是同一排行榜，Collocation 不得替代核心句式成为首选。首选结构必须同时通过节点功能兼容与其固定关系词对当前语义的最小重合；来源例句中只有主题词相同不能证明适配。
- 比赛提交前冻结语料内容，不临时增加候选。确定性代码只从 approved 句子和 `recall_use` Core 中准备少量候选；DeepSeek 只能返回这些候选的 ID 或明确 no-fit，不能生成新表达、改写句或把模型输出冒充库内语料。本地校验拒绝未知 ID、用 Collocation 冒充首选结构、重复 ID、低置信度与需人工复核结果。
- DeepSeek 选择失败、超时或返回非法结构时不阻断写作，回退到现有确定性结果；错误类别不包含模型原文、API Key 或 learner 敏感内容。
- 核心结构必须说明当前适配原因和迁移边界；Collocation 只承担局部措辞，不得引入论证链中不存在的新理由。没有合适 Collocation 时整个辅助区不显示，不凑数。
- `same_prompt` / `cross_topic` 只表示来源与证据边界，不参与适配分加减；不能为了展示跨题迁移而把语义较弱的资产排到首位。
- Level 0 显示核心结构的类型与来源，但隐藏目标英文；核心结构与可搭配表达从 Level 2 才展示。适配说明使用“推荐依据与迁移边界”，不得把仅有主题重合写成已经语义适配。
- Level 0 为独立尝试；Level 1–4 依次展开中文方向、目标表达、局部骨架与来源参考。
- 进入节点语言激活时，输入框先带入 learner 刚完成的论证节点原句；正式 node attempt 可覆盖它，但不得要求 learner 无意义地重复填写。
- 若没有适配的完整句型但存在相关 Core Collocation，明确显示“没有合适的完整句型”并保留局部表达入口；只有两层都没有适配资产时才显示完整 `NO CORPUS FIT`。learner 仍可直接写，未使用目标资产时 `target_usage` 记为 `not_required`。
- Agent 可以针对当前原句给出一句已做到的观察和一个优化方向，但不得输出替换英文、补充观点或重写句子。
- 没有首选句型但存在局部搭配时，no-fit 保持不变；learner 可以单独展开局部表达，但搭配不能被包装成完整句式。
- `guided_writing_node_language_attempts` append-only 保存 learner 原文、节点、资产引用、最高提示等级、四维评价与安全 trace；不覆盖 argument graph。
- 页面刷新时恢复每个节点最新一次正式 attempt 的 learner 原文和已提交 hint level，包括 provider 失败的 attempt；恢复提示必须按节点隔离。只展开但尚未提交的纯 reveal 状态仍不在本规则内。
- approved 语料可以包含不改变原论点的常识性概括或一般性权威包装；不得借此加入独立主要观点、具体虚构证据或原链无法支持的强因果。该语料始终可不采用。
- 模型只能评价 learner 文本，不能返回替换句、新观点或完整参考答案。

## 4. Paragraph Weaving 与分开评价

Paragraph Weaving 的初始文本只按论证顺序拼接四个通过的 learner 文本。界面先明确要求 learner 自己处理重复、逻辑推进、可合并句、衔接和 Takeaway，再提交整体段落评价；模型不得直接重写。

### Logic

检查：

- 是否完成当前可信 Body Paragraph 1 / 2 职责；
- 是否保持 learner 已保存的中心主张和支持关系；
- 是否把观点展开而非并列罗列；
- 是否存在 unsupported jump、overclaim、重复或矛盾；
- 段落推进是否清楚。

### Language

检查：

- intended meaning；
- grammar 与 spelling；
- Collocation、word choice 与 register；
- cohesion 与 sentence boundaries。

局部 typo、小型词形或语法表面问题标为 `minor`；使意思、核心主张或句间关系无法可靠判断的问题才标为 `blocking`。语言轴不能覆盖或弱化逻辑轴的结论。

## 5. 结构化输出与本地 policy

模型输出使用 `guided-writing-paragraph-evaluation.v1`：

- `logic.status` / `language.status` 只允许 `clear | needs_revision | cannot_judge`；
- 每个需要修改的轴必须提供一个受限 `issue_type`；
- `evidence_span` 若存在，必须是 learner 草稿的精确 substring；
- feedback 只解释判断，不提供替换文本；
- 本地代码根据两个轴确定 `KEEP_DRAFT`、`REVISE_LOGIC`、`REVISE_LANGUAGE`、`REVISE_BOTH` 或 `CANNOT_JUDGE`。

## 6. 保存与失败行为

- `guided_writing_paragraph_drafts` append-only 保存每次 learner 原文、输入 hash、评价、trace 引用和状态；
- draft ID 幂等，重复 HTTP 请求不得产生第二条草稿或 trace；
- 模型超时、网络失败或非法 JSON 时仍保存草稿，评价保持为空，页面继续保留可编辑原文；
- trace 不复制 learner 段落，只保存 session/draft/turn 引用、模型版本、步骤、延迟、token 与错误码；
- 备份升级至 v1.8，并兼容 v1.0–v1.7；节点语言 attempt、段落草稿、评价和安全 trace 可完整往返。

## 7. 当前 UI

- 原 Argument Chain 保持在左侧，不被草稿功能改写；
- 论证链通过后，右侧先进入单节点语言激活；节点选择保留在左侧；
- 当前节点通过后，左侧显示 learner 的语言实现及该次最高提示等级；
- 四个节点通过后，右侧切换为 Paragraph Weaving，而不是自动生成段落；
- 反馈固定分成 Logic 与 Language 两个同级板块；
- minor language issue 显示为 `A local surface fix`，不冒充逻辑失败；
- 上游论证链若在评价后发生改变，旧反馈显示为 stale，必须针对当前链重新检查。
- 第一段 Logic 与 Language 均 clear 后才显示第二段入口；第二段继承 Position，不复制第一段其余节点；刷新恢复最新的 active 段落会话。

## 8. 当前边界与下一步

这一版验证“两个主体段能否各自从构思获得逐节点语言支撑，并转化为 learner 自己的段落”。尚未提交 attempt 的纯 reveal 状态还不能在刷新后恢复；Introduction 已在后续 Phase 2.5E 独立实现，见 `docs/guided-writing-introduction-v1.md`；Conclusion 和全文衔接仍未实现。spontaneous use、错误转训练和延迟迁移继续按 Phase 2 规范后续逐项进入，不能在节点或段落评价中伪装成已经实现。
