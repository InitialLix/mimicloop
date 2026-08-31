# IELTS 官方依据与产品证据登记

- 状态：Living document
- 建立日期：2026-08-27
- 适用范围：MimicLoop 中所有明确以 IELTS 官方公开标准、评分说明、题型说明或官方样本为依据的产品决策
- 目的：让教学功能的依据、产品转译、实现状态和验证证据可以追溯，并为产品评审或比赛展示提供可信材料

## 1. 统筹原则

凡讨论、设计或实现某项功能时，明确引用了 IELTS 官方公开资料，该关联都应进入本登记，而不是只留在聊天记录、代码注释或宣传文案中。

每条记录至少说明：

1. 官方来源及访问日期；
2. 官方标准实际关注什么；
3. MimicLoop 将它转译成了什么教学动作或产品功能；
4. 当前处于 `discussed`、`specified`、`implemented`、`verified` 哪个阶段；
5. 有哪些代码、测试、界面或用户复检证据；
6. 这项关联不能被夸大成什么。

登记的目标不是证明“功能来自官方指定的方法”，而是证明：MimicLoop 能把官方公开的评价目标转译成可练习、可观察、可验证的学习过程。

## 2. 对外表述边界

可以使用：

- “依据 IELTS 官方公开评分标准设计”；
- “与 IELTS 官方公开的 Task Response / Coherence and Cohesion 要求对齐”；
- “将官方强调的清晰立场、观点展开和逻辑推进转化为逐步训练”。

不得使用：

- “IELTS 官方认证 / 官方推荐”；
- “IELTS 官方教学法”；
- “获得 IELTS 官方背书”；
- 在没有相应验证时宣称“能准确预测 Band 分数”或“保证提分”。

MimicLoop 仍是独立、非官方学习工具。官方标准是设计依据，不构成合作、授权、认可或效果保证。

## 3. 记录范围

应登记：

- 官方评分标准直接影响的教学步骤、反馈标准和评价维度；
- 官方题目要求直接影响的审题、立场、段落职责或作答边界；
- 官方高分考生作答、考官评语或官方样本对内容选择与校准产生的影响；
- 已讨论但尚未实现、未来可能进入产品的官方对齐设计。

不必登记：

- 仅属于通用英语教学经验、且没有官方依据的建议；
- 纯视觉偏好、工程实现或供应商选择；
- 为帮助学习而自建的节点、术语或方法，除非同时明确说明它只是对官方目标的本地教学转译。

## 4. 状态口径

| 状态 | 含义 | 可对外证明的程度 |
|---|---|---|
| `discussed` | 已结合官方资料讨论，但尚未形成稳定规格 | 只能作为设计研究记录 |
| `specified` | 已写入产品或教学契约，尚未完整实现 | 可以展示设计依据，不能展示为现成功能 |
| `implemented` | 已进入实际产品 | 可以演示功能，但仍需区分是否完成验证 |
| `verified` | 已有自动测试、真实模型基线或用户路径复检 | 可以同时展示设计依据、运行功能和验证证据 |

状态只能按真实进展升级，不因准备比赛材料而提前标记。

## 5. 当前登记

| ID | 官方公开要求 | MimicLoop 的教学转译与产品体现 | 状态与证据 | 边界 |
|---|---|---|---|---|
| IELTS-TR-01 | Task Response 关注是否完整回应题目、立场是否清楚，以及主要观点是否得到展开和支持 | Phase 2.5A 从可信归档题目识别题型、任务要求和边界；Phase 2.5B 的 Position 只检查整题回答和立场，不因尚未给出理由而判错 | `verified`：28 题题型覆盖测试；Position 真实 DeepSeek 路径与本地语义校验；见 `docs/implementation-plan.md` | 不表示 Agent 能给整篇作文评分，也不表示 Position 是官方规定的独立步骤 |
| IELTS-IMPORT-01 | Task 2 的具体任务要求由题目末尾的 instruction / direct questions 决定，Task Response 必须覆盖题目要求 | Phase 2.5H 允许 learner 粘贴自带 Task 2 题目；DeepSeek 先提议本地题型与宽主题，learner 必须确认或修正后才建立可信 Essay Map，并继续既有 learner-owned 写作流程 | `verified`：新题 Schema、append-only analysis、确认覆盖测试、备份往返、真实远程办公双问题识别、文章地图和刷新恢复；见 `docs/implementation-plan.md` | 六类题型和十二个主题是本地产品分类，不是 IELTS 官方固定 taxonomy；模型识别不是官方判定，也不扩展为 Task 1、观点生成或 Band 评分 |
| IELTS-TR-02 | Task Response 要求 main ideas 被 extended and supported | Main point → Reason → Development → Takeaway 将“提出观点”拆为新增依据、补足关系和有限收束；Logic Check 用怀疑者追问检查是否只是重复观点 | `verified`：教学契约、节点规则、全链复检、规则与数据库测试；见 `docs/guided-writing-coach-v1-teaching-contract.md` | 四个槽位是本地教学支架，不是 IELTS 官方四句模板 |
| IELTS-CC-01 | Coherence and Cohesion 关注信息与观点的逻辑组织、顺序和关系是否清楚 | `development_relation` 区分因果、原则适用、比较、问题—回应和条件限定；完整链复检检查缺环、重复、范围漂移和矛盾 | `verified`：受限 Schema、本地 policy、`guided-writing-chain-review.v1` 与自动测试 | 不表示连词数量越多分数越高，也不把逻辑链等同于官方固定作文结构 |
| IELTS-INTRO-01 | 官方核心评分关注直接回应题目、清楚立场和全文逻辑推进；官方备考材料建议 introduction 可由相关的一般陈述逐步聚焦到题目，并清楚给出 position / thesis | Introduction 设计为可选的 Relevant opening + 必需的 Task framing + 必需的 Thesis consistency；两段主体段先完成，开头再核对是否准确预告真实立场与文章方向；三个部分各自只激活一个已审核开头句式，局部搭配次级展示，找不到则 no-fit | `implemented`：`guided-writing-introduction-evaluation.v1`、可信两段前置检查、append-only 保存、三部分输入、approved-only 逐部分语言激活与自动测试；待真实页面复检后升级为 `verified` | “Hook”只作为可选的相关开场，不是公开 Band Descriptors 的独立得分项；逐部分激活是本地教学设计，不是 IELTS 官方固定模板；不要求名言、反问、故事、惊人事实、空泛时代背景或固定 `This essay will...` 模板 |
| IELTS-MAP-01 | 清楚立场与逻辑组织需要贯穿全文，而不只存在于单个句子 | Body Paragraph 1 通过后按可信题型职责进入独立 Body Paragraph 2；opinion 题由 learner 选择第二理由、必要限定或有限让步，已确认 Position 保持可见但两段 graph 不合并；Introduction 再对照两段真实内容核对 thesis | `implemented`：Phase 2.5D–2.5E session 边界、题型问题、Introduction trusted context 与自动测试；待真实页面走完后升级为 `verified` | `To what extent` 不强制正反各写一段；当前仍未实现 Conclusion 或全文评分 |
| IELTS-DRAFT-01 | Task Response 关注观点是否得到展开和支持；Coherence and Cohesion 关注逻辑组织与推进；Lexical Resource 和 Grammatical Range and Accuracy 分别关注词汇与语法的准确、适切使用 | Phase 2.5C–2.5D 将 learner-written Body Paragraph 1 / 2 的 Logic 与 Language 分栏评价：逻辑轴对照题目、当前段落职责和 learner-owned graph，语言轴检查意义、自然度、词汇、语法与衔接；不合并成模糊总评 | `implemented`：`guided-writing-paragraph-evaluation.v1`、按 paragraph key 隔离的 append-only drafts、分栏 UI 与自动测试；待真实页面用户复检后升级为 `verified` | 不输出 Band 分数，不表示 IELTS 官方规定必须使用两栏反馈，也不把本地模型判断冒充考官评分 |
| IELTS-CLOSE-01 | Task Response 要求立场和主要观点贯穿回应，Coherence and Cohesion 关注全文逻辑组织与推进 | Phase 2.5F 让 learner 用 Conclusion 收束已写观点并禁止加入新主论点；Phase 2.5G 只拼接四段 learner 原文，再按 Task Response、Coherence、Language 做受限终检，并回看实际调用过的语料 | `verified`：受限 Schema、append-only 保存、176 项规则测试、47 项数据库测试、生产构建及真实 DeepSeek 四段页面复检；见 `docs/implementation-plan.md` | Conclusion 与三轴终检是本地教学转译，不是 IELTS 官方规定的固定步骤；不输出 Band 分数、官方评分或提分保证 |
| IELTS-LENGTH-01 | IELTS Academic Writing Task 2 要求至少写 250 词 | 完整文章页确定性显示当前词数；不足 250 词时提示回到已有论证继续展开，终检的 Task Response 轴标为需要修改 | `verified`：真实 223 词页面案例稳定显示还差 27 词；即使模型原判 clear，确定性 policy 仍将 Task Response 标为 needs revision；刷新恢复通过 | 不鼓励为凑字数加入新观点，也不把达到 250 词视为高分保证 |

## 6. 当前官方来源

以下链接只记录一手 IELTS 官方公开资料；前五项访问日期为 2026-08-27，Introduction 补充材料访问日期为 2026-08-30：

- IELTS Writing test preparation resources  
  https://ielts.org/take-a-test/preparation-resources/writing-test-resources
- IELTS Writing key assessment criteria  
  https://ielts.org/cdn/ielts-guides/ielts-writing-key-assessment-criteria.pdf
- IELTS Writing Task 2: how to understand question prompts  
  https://ielts.org/news-and-insights/ielts-writing-task-2-how-to-understand-ielts-question-prompts
- IELTS Academic Writing test format  
  https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing
- IELTS copyright and trade mark statement  
  https://ielts.org/legal/ielts-copyright-and-trade-mark-statement
- IELTS Writing Task 2 Band Descriptors（Updated May 2023）  
  https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf
- IELTS / IDP Writing Task 2: writing a good introduction  
  https://ielts.idp.com/prepare/article-writing-a-good-introduction-writing-task-2/
- IELTS / IDP: presenting a viewpoint and thesis statement  
  https://ielts.idp.com/prepare/article-ielts-writing-task-2-how-to-present-your-position
- IELTS official sample candidate responses and examiner comments  
  https://ielts.org/cdn/computer-delivered-sample-tests-academic-writing/ielts-academic-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf

以后新增记录时优先使用 IELTS、British Council、IDP 或 Cambridge 的一手页面和正式出版物。第三方教师解释可以作为设计参考，但不得在本表中冒充官方依据。

## 7. 决赛或评审材料的证据组织

展示时按以下顺序组织，不只截取一句官方标准：

```text
官方公开要求
→ MimicLoop 的教学转译
→ 实际交互或界面
→ 测试 / 模型基线 / 用户复检
→ 尚未覆盖的边界
```

这条链能够证明功能不是随意堆叠，也能让评委区分“有官方依据的设计”“已经实现的能力”和“仍待验证的效果”。
