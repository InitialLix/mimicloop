# AGENTS.md

## 项目目标

第一阶段个人自用、中文界面、桌面优先的本地 Web MVP 已冻结。第二阶段只按 `docs/agent-phase2-spec.md` 的固定顺序增量实现 MimicLoop Learning Agent。Phase 2.0–2.4、2.5A–2.5H 已完成当前实现与自动验证；当前等待 learner-owned Conclusion、全文闭环与自带 Task 2 新题入口的用户产品验收。Band 评分未授权、尚未开始。

## 强制约束

1. 第一阶段继续保持无运行时 LLM 的确定性基线。Use Evaluator 与 Guided Writing Coach 继续受 feature flag、Schema 校验和完整回退约束；Phase 2.5C–2.5E 继续保持 learner-owned 主体段与开头。Phase 2.5F 只允许在两段正文和 Introduction 均 clear 后，由 learner 自写 Conclusion，并检查是否收束题目、保持立场一致和避免新观点。Phase 2.5G 只拼接四段已保存原文并分别检查 Task Response、Coherence 与 Language；不得重写全文、给替换句、提供新内容或 Band 分数。Phase 2.5H 只允许导入 IELTS Writing Task 2 英文题目；模型的题型与主题判断必须由 learner 明确确认或修正后才成为可信上下文，导入题目不得冒充范文、原文语料或已审核训练资产。全文页可以显示本次正式节点尝试实际使用过的 approved 语料，但不得把“用过”冒充“掌握”。禁止扩展为自动作文评分、观点供应、段落代写、通用聊天、账号或云同步。
2. 范文原文必须先进入 `sources/raw/` 并保存来源元数据、访问日期和内容 hash。
3. AI/Codex 生成内容只能进入候选态，禁止从 raw source 直接写入 approved cards 或正式数据库。
4. 第一批正文优先来自 IELTS 官方高分考生作答和 Cambridge 正版 model/sample answers；必须区分 candidate response 与 examiner-written model answer，并保留 band 与 examiner comments。Simon 后续仅作补充。
5. 每篇范文按学习价值筛句，不设固定数量配额，不因凑数收句，也不因超过估算数量丢弃好句。
6. 所有 schema、migration、审核规则和复习规则变更必须同步更新测试和文档。
7. `original_sentence` 必须能定位回原文；`learning_sentence` 的任何清理必须可解释、可追踪。
8. UI 必须遵守 `docs/design-system.md`；禁止 fork 完整 dashboard template，学习卡主视觉必须始终围绕一句话。
9. 不得为未来 Agent 阶段提前加入空目录、框架或抽象。
10. 《新概念英语 3》及以后引入的外刊等内容统一作为 `language_richness_corpus`，不得冒充 IELTS model essay；必须先完整归档 raw、来源元数据与 hash，再按段落处理。
11. 语言丰富度语料中的表达与完整句子均采用高召回候选策略，不设每课或每篇固定数量。表达必须分为 Core / Appreciation：只有 Core 进入 Recall → Use，Appreciation 只在原文标注；句子卡可比 IELTS 范文收录得更充分，但仍须通过自然度、独立完整性、迁移价值与全库查重门槛。
10. 任何仿写句、`transfer_example`、Sentence Use 与 Collocation Use 都必须通过独立的 native-naturalness check。审核优先级依次为：现代英语自然度、语义逻辑、IELTS/正式写作适用性、原结构保留程度；语法正确但不够自然不得批准。详细标准见 `docs/content-guidelines.md` 与 ADR 0009。
12. Phase 2 必须严格遵循 `docs/agent-phase2-spec.md`：2.1–2.4 与 2.5A–2.5H 已完成当前切片。Conclusion 必须对照服务端可信题目、Position、两段职责、两段 learner 原文和已通过 Introduction；模型只能指出一致性、收束、新观点与语言问题。全文检查只能引用四段已保存原文，最多分别给出一项 Task Response、Coherence、Language 优先问题，不生成修改稿、范文或 Band 分数。正式语料使用汇总只能来自两个主体段已保存的节点语言尝试，保留 asset、hint level 与 learned/new 事实。导入新题必须先保存 append-only 分析和安全 trace，再由 learner 确认题型与主题；仅确认后的服务端记录可进入既有 Guided Writing session，且必须从范文语料库列表过滤。模型失败时题目原文、手动确认路径、四段原文和提交记录必须保留。严禁提前实现整篇代写、多 Agent、向量数据库、自动生成正式训练内容、Band 评分或完整 Phase 2.7 Today 混排。
13. 模型只提供经过 Schema 与语义校验的语言观察；SQLite 事实、幂等、复习调度、自评和正式学习进度继续由确定性代码维护。模型失败时必须保留用户输入并回退到现有参考答案与自评流程。
14. Evaluator 必须从服务端读取已批准 Use 题、目标资产和参考答案。客户端提供的题干、目标表达、参考答案或 exercise type 不得成为可信事实来源。
15. AI 功能默认关闭；不得要求用户在聊天中粘贴 API Key，也不得通过命令读取、打印或回显真实 Key。Key 只能由本地服务端进程从被 Git 忽略的 `.env.local` 读取，并仅作为发往所选 provider 官方 HTTPS API 的 `Authorization` 请求头；严禁进入模型 prompt/上下文、请求 JSON body、浏览器、数据库、备份、仓库、日志或 trace。Trace 只保存必要版本、延迟、状态、错误码和引用。
16. 模型 verdict 不得直接更新 `review_states`、`collocation_progress` 或既有复习排程；现有 Use 自评继续完成本轮调度。经 Schema/语义校验并与正式 attempt 对齐的 evaluation 只可作为 append-only evidence 的观察来源和 2.4 确定性 policy 输入；当前 learner state 必须由版本化 reducer 重算，独立 `adaptive_retests` 不得冒充旧调度已变更。
17. 凡功能讨论、教学标准或评价规则明确以 IELTS 官方公开资料为依据，必须同步登记到 `docs/ielts-official-alignment-register.md`，记录官方来源、产品转译、真实状态、验证证据和表述边界。可以说明“依据或对齐官方公开标准”，不得表述为 IELTS 官方认证、推荐、合作、固定教学法或提分保证。

## 工作顺序

严格遵循 `docs/implementation-plan.md`。上一阶段未通过验收，不进入下一阶段。每次完成工作后更新计划状态，并报告：完成项、验证结果、人工审核项、下一步。

当 Primary Agent 原本准备让用户亲自点击、填写或走一遍新功能时，默认改派 `docs/fresh-user-ux-review-agent-v2.md` 的 Rapid Trial Agent 作为体验替身：最多 5 分钟、8 个页面动作和 3 个明显问题；它只代替用户操作页面，不读代码、不改代码、不运行测试，也不重新审查产品理论。代码审查和技术验证仍由 Primary Agent 完成。只有全新核心交互、正式 Phase 验收、Rapid Trial 发现 Blocker / Major、安全或不可逆边界，或用户明确要求时，才另行启动 v1 Full Review。不得把完整 Reviewer 当作每个小改动的固定门禁。

## 内容工作流

```text
raw source
→ source metadata + hash
→ AI/Codex extraction
→ schema validation + deterministic checks + duplicate detection
→ candidate
→ human review/edit
→ approved seed
→ SQLite
```

任何获取失败的来源只记录 URL 和待办，不得补写或伪造正文。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
