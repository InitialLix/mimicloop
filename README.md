# MimicLoop

MimicLoop 是一款面向个人长期使用的 Academic IELTS Writing Task 2 句子模仿与迁移训练工具。

第一阶段本地 MVP 已完成并冻结：用经过人工审核的真实句子卡与 Core Collocation，跑通 Learn → Recall → Use → Review。Phase 2.1–2.4 已完成受控 Use Evaluator、最小教学动作、Learner Model 与确定性下一步；Phase 2.5A 完成可信审题，当前进入 2.5B 的英文构思问答与单个主体段论证链。它仍不是作文评分或段落代写，基础产品无需 API key。

## 当前状态

- 当前进度：Phase 2.0–2.4 与 2.5A 已完成；Phase 2.5B 已加入默认全英文的 Position → Claim → Reason → Mechanism → Result 引导
- 已完成：28 篇 Simon Task 2 范文、12 篇《新概念英语 3》课文、186 张正式句子卡、286 条 Core Collocation、115 条 Appreciation 表达，以及句子与 Core 的确定性 Learn → Recall → Use 闭环
- 已验证：28 道已归档 Task 2 题目全部覆盖六类题型；规则、数据库、TypeScript、生产构建和本地浏览器关键路径持续验证
- 已完成：可从首页主动打开的六页使用导览，依次覆盖首页入口、原文标记、句子学习、Recall → Use 与 DeepSeek 反馈、搜索定位和写作练习；首次访问自动展示与“已看过”状态仍暂缓
- 下一里程碑：用户验收 2.5B 的英文提问质量与论证链后，再讨论 learner-written 段落草稿及逻辑/语言分开评价

新对话应先阅读 [docs/agent-stage-handoff-2026-08-19.md](docs/agent-stage-handoff-2026-08-19.md)。详细进度见 [docs/implementation-plan.md](docs/implementation-plan.md)，当前产品说明见 [docs/current-product-overview.md](docs/current-product-overview.md)。

## 第一批内容

- 优先使用 IELTS 官方高分考生作答和 Cambridge 正版 model/sample answers；
- 官方 candidate response 必须保留实际 band 和 examiner comments，不能伪装成无瑕“官方范文”；
- Simon 28 篇完整范文已作为当前本地语料库；《Ideas for IELTS Topics》只作为观点素材，不作为 source essay；
- Simon 合集 28 篇均已完成首轮筛句与批次审核；加上 12 篇《新概念英语 3》课文后，共有 186 张正式卡，全部保留完整来源、上下文、训练目标和类型匹配练习；
- 首页设有独立范文库入口，可按 IELTS 写作主题筛选并直达完整范文；完整范文库会保留所选主题继续浏览；
- 每篇按学习价值筛句，不设硬性数量上限；
- AI/Codex 只生成候选卡，必须人工审核后才能进入正式库。
- 学习卡区分核心 chunk 与轻量 gloss；生词释义只辅助理解整句，不扩展成词典学习模式。

## 本地数据命令

```bash
npm run db:migrate
npm run db:seed
npm run generate:calibration
npm run generate:batch-02
npm run generate:batch-03
npm run generate:batch-04
npm run generate:batch-05
npm run db:backup
npm run db:restore -- backups/<backup-file>.json
npm test
```

默认数据库为 `data/mimicloop.db`，数据库、WAL 文件和备份目录均被 Git 忽略。可用 `MIMICLOOP_DB_PATH` 指定另一数据库路径。

Use Evaluator 的开关、服务端配置、fallback 和 gold runner 见 [docs/use-evaluator-operations.md](docs/use-evaluator-operations.md)。默认 `.env.example` 保持功能关闭，不包含 secret。

## 仓库约束

开始工作前先阅读 `AGENTS.md`。任何内容必须经过 `raw source → candidate → human review → approved`，不得绕过审核。
