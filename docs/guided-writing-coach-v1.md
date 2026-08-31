# Guided Writing Coach v1

## 当前范围

Phase 2.5B 已完成一个 IELTS Task 2 Body Paragraph 1 的英文构思链：

```text
Position → Claim → Reason → Mechanism → Result
```

问题、回答和逻辑反馈默认英语。Agent 不提供观点、改写句、例句或完整段落；小语法和拼写错误不会在构思阶段阻塞清楚的逻辑。

Phase 2.5C 在完整链通过后，不把检索结果作为卡片墙交给 learner。learner 每次选择 Main point / Reason / Development / Takeaway 中的一个节点，服务端以该节点的语义意图、论证功能、相邻上下文、主题、learner state 与当前草稿分别检索两层 approved 资产：上层最多一个句子结构 / Rhetorical Move，负责组织整句；下层零至三个 `recall_use` Core Collocation，只负责可嵌入的局部措辞。两类不在同一排行榜竞争。已学与未学语料都可被发现；未学项必须标为库内新语料并提供学习入口，不能冒充已掌握。

每个节点先让 learner 独立写。卡住时提示按 Level 1 中文方向、Level 2 目标表达、Level 3 局部骨架、Level 4 来源参考逐级展开；检索不足时允许 `NO CORPUS FIT`，不得强塞表达。提交后分别检查 meaning、logic、target usage 与 naturalness，通过文本必须逐字来自 learner 输入。四个节点通过后才进入 Paragraph Weaving；起始文本只拼接 learner 自己通过的节点语言实现，再检查重复、推进、合并、衔接与 Takeaway。草稿、评价、幂等、失败保留与备份规则见 `docs/guided-writing-paragraph-v1.md`；当前仍不包含第二主体段、Introduction、Band 评分或整篇作文。

每个节点只检查当前任务：Position 只要求明确回答总体立场，不提前要求理由或因果链；`missing_logic` 只允许出现在 Mechanism 和 Result。若历史模型输出跨越了当前节点，页面会忽略该反馈、保留原 turn，并将 learner answer 带回输入框重新检查。

Claim 不是固定“支持总体立场”。问题由可信题型与 Body Paragraph 1 职责确定：discussion 先解释观点 A；opinion 支持总体立场；其余题型分别分析优势、问题/原因、主要影响或回答第一问。Provider 必须依据 `paragraph.role` 与 `paragraph.goal` 判断；讨论题中公平解释 learner 不认同的一方不构成立场矛盾。

Claim 前显示一个紧凑的英文 step guide，只说明 learner 当前要完成什么及暂时不要做什么，不提供任何可提交的观点。discussion 的默认教学口径是先公平解释观点 A：learner 不必赞同，也不应在该节点立即反驳；“这个观点有道理”仍因缺少具体主张而不能通过。

每个节点的 step guide 提供一个默认收起的 `Unrelated form examples`。其中固定显示两条其他主题的静态回答，只帮助 learner 看清当前节点所需的回答形态；不读取当前题目生成观点，不进入模型 prompt，不作为参考答案，也不会自动写入 argument graph。

Reason 不再使用抽象的 `underlying reason` 作为主要指令，而是询问“什么 fact、principle 或 condition 使 Claim 值得相信”。`Logic check · What makes this true?` 使用独立、常显的小型面板，与普通任务说明和 form examples 分层；它执行三项检查：指出 Claim 依赖的事实/原则/条件；确认没有重复 Claim 或提前写 Result；用 sceptical-reader test 再问一次“为什么应当相信”。这不是 IELTS 官方规定的固定节点，而是从官方 Task Response 的 ideas extended/supported 与 Coherence 的 logical progression 转译而来的本地教学支架。

官方依据：

- https://ielts.org/take-a-test/preparation-resources/writing-test-resources
- https://ielts.org/cdn/ielts-guides/ielts-writing-key-assessment-criteria.pdf

上述官方要求与具体功能、实现状态和验证证据的对应关系统一登记在 `docs/ielts-official-alignment-register.md`；这里的 Reason / Development / Takeaway 是本地教学转译，不是 IELTS 官方固定模板或官方认证方法。

Reason 必须增加新的支持信息，不能换词重复 Claim；discussion 的反方 Reason 只需符合当前段落职责，不必支持 learner 的总体立场。内部 `mechanism` 在前台显示为 Development，不再默认物理式因果。

Reason 通过时，模型只能把后续展开关系观察为 `causal`、`principle_application`、`comparison`、`problem_response`、`qualification` 或 `unclear`。本地 policy 据此选择 Development 问题。前台将 Position 从主体段进度中分离，主体段显示 Main point → Reason → Development → Takeaway；Development 同时显示 learner 已保存的 Reason、缺失连接和 Main point，避免再用抽象术语猜任务。

`guided-writing-coach.v1.2` 新增 `accepted_span` 与 `forward_span`。每次 accept 必须指出 learner 原答案中只属于当前节点的精确 substring；如果同一答案另有清楚、独立的下一节点内容，可额外返回一个不重叠的精确 substring。Schema 与本地语义校验拒绝改写、伪造、重叠和跨级目标，action JSON 支持刷新恢复而无需 SQLite migration。下一步只显示 learner 原文，learner 可选择直接使用、先编辑或另答，未经确认绝不写入 graph。当前 Coach prompt version 为 `guided-writing-coach-v1.7`，Chain Review prompt version 为 `guided-writing-chain-review-v1.1`；双观点题第二主体段只在 Takeaway 要求 learner 将已公平解释的观点 B 与已保存总体立场作有限判断，前面三个节点不得提前索要判断。

已保存的 Position、Main point、Reason、Development 与 Takeaway 可以手动回改。回改只移动 session 的 `current_node`，旧 graph、turn 与 trace 保持 append-only；新答案通过后，原有下游节点按顺序作为 learner-owned 精确文本复检候选。当前更早节点尚未重新通过时，UI 与 repository 双重拒绝跳到更后的节点。最终仍必须重新经过 Result/Takeaway 和完整链复检才能恢复 `ready_to_draft`。

语言激活阶段点击节点正文只切换当前语言节点；“改构思”是单独标记的操作。若 learner 误点改构思且尚未提交任何新答案，可保留原 graph、turn 与 ready chain review 直接返回语言激活，不调用模型；一旦已经产生新的构思 turn，就不能用该出口跳过下游复检。

Result 单节点通过后不会直接进入 ready。服务端用完整 learner-owned graph 发起一次独立只读复检，输出必须通过 `guided-writing-chain-review.v1`：检查段落职责、Reason 是否重复、Development 是否缺环、Result 是否过度，以及跨节点重复、范围漂移和矛盾。模型只能返回 ready，或带受限 reason code 退回最早需要修改的节点；不能返回修订内容。退回时历史 turn 和原 graph 内容保留，界面标记当前修改节点与后续待复检节点；重走到 Result 后再次复检。模型失败或无法判断时保留 Result 输入且不推进。

## 可信边界

客户端只提交 `sessionId`、`turnId` 和 `learnerAnswer`。服务端按 `sourceEssayId` 从 SQLite 重新读取已归档题目，并用 `essay-task-analysis.v1` 重建题型、任务要求、限制词和主体段职责。新模型输出必须通过 `guided-writing-coach.v1.2` Schema 与语义校验；历史 `guided-writing-coach.v1` / `v1.1` turn 仍可读取。历史多句 Reason 若已进入 Development，页面只会把 learner 原文的末句作为可拒绝的兼容候选，不会自动推进或改写。

当前选中的作文通过 `/writing?essay=<sourceEssayId>` 保存。服务端先验证该 ID 确实属于 28 道可信归档题目，再把它作为 Client Component 的初始选项；切换题目使用 `history.replaceState` 更新 URL。刷新、复制链接或重新打开页面都会恢复同一篇作文，无效或缺失 ID 才回退到第一篇。

模型失败、超时、低置信或非法输出时，learner answer 仍保存在 `guided_writing_turns`，argument graph 不推进。Trace 只保存引用、状态、版本、延迟、token 与错误码，不保存 API Key 或 learner 原文。

Provider TCP / fetch 失败单独记录为 `PROVIDER_NETWORK_ERROR`，页面明确提示无法连接 DeepSeek；它不再与普通 `MODEL_ERROR` 混为一类。

## 配置

```dotenv
MIMICLOOP_GUIDED_WRITING_ENABLED=true
```

若该变量未设置，则为了兼容当前个人环境，跟随已有 `MIMICLOOP_USE_EVALUATOR_ENABLED`；新环境的两个开关默认均为关闭。Provider、模型、超时和服务端 API Key 继续复用现有 DeepSeek 配置。API Key 只进入官方 HTTPS 请求的 `Authorization` header。

## 尚未实现

- 只展开提示但尚未提交时，刷新后的 reveal / selection 恢复；正式 attempt 已保存最高提示等级；
- spontaneous use 与 delayed retest；
- 结论或整篇作文；
- Band 评分。
