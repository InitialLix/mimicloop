# Phase 2.1–2.2 Use Evaluator 与教学动作运行说明

## 当前状态

Collocation Use 和 Sentence Use 的结构仿写/词块应用已经接入同一套评价与最小教学动作，并通过 50 条 approved 合并 baseline。功能默认关闭；关闭或 provider 失败时，页面继续使用既有“显示参考答案 → 用户自评 → 确定性调度”流程。Phase 2.2S 已完成；Guided Writing 未开始。

## 启用配置

将 `.env.example` 复制为本地 `.env.local`，并显式设置：

```text
MIMICLOOP_USE_EVALUATOR_ENABLED=true
DEEPSEEK_API_KEY=<local secret>
MIMICLOOP_DEEPSEEK_MODEL=deepseek-v4-flash
```

可选项：

- `MIMICLOOP_AI_TIMEOUT_MS`：默认 8000，允许 1000–30000；
- `MIMICLOOP_USE_EVALUATOR_CONFIDENCE`：默认 0.65，低于阈值或 `needs_review=true` 时回退到中性反馈与原自评流程。

API key 只由本地服务端进程读取，不使用 `NEXT_PUBLIC_` 前缀。不要把 key 粘贴到聊天或交给 Agent，也不要让任何诊断命令打印 `.env.local`。运行 app 或 gold runner 时，程序自行加载被 Git 忽略的 `.env.local`；key 只进入发往 DeepSeek 官方 HTTPS API 的 `Authorization` 请求头，绝不能进入 prompt、模型上下文、请求 JSON body、浏览器、数据库、备份、日志或 trace。未配置 key 或 model 时不会调用 API，而是记录 fallback。当前只接入 DeepSeek；本地实际运行并通过合并 baseline 的组合为 `deepseek-v4-flash` + `use-evaluator-v11`。

## 数据与安全边界

- 浏览器只提交稳定 `attemptId`、版本化 `exerciseRef` 和学习者答案；Collocation 与 Sentence 的目标表达、中文题意、accepted variants 与参考答案都由服务端从 approved SQLite 内容重建；
- provider 使用 DeepSeek Chat Completions 的非思考 JSON mode；提示词包含完整输出结构，但 JSON mode 本身不等于 strict schema，因此返回值必须再经过本地 `use-eval.v1` Schema 与 attempt/span/pass 等语义规则校验；
- invalid output、低置信度、超时和 provider 错误都不能把尝试标记为成功，也不会修改 `review_states` 或 `collocation_progress`；
- trace 保存步骤、版本、provider/model、token 数和错误码，不保存隐藏思维链或原始 provider 输出；学习者答案保存在对应 evaluation run，和既有 attempt 数据一样进入本地备份；
- 备份 schema v1.5 包含 `agent_traces`、evaluation、上一版 attempt、重试序号、教学动作以及 Phase 2.4 decision/retest；仍兼容恢复 v1.0–v1.4。

## Phase 2.2 动作边界

- `PASS`：只表示本次 AI 检查建议通过，不自动修改学习进度；
- `GIVE_MINIMAL_HINT`：只显示一条最小提示，要求用户自己修改；
- `RETRY`：要求再改一次，但不会重复上一轮完全相同的提示；
- `SHOW_REFERENCE`：两次修改机会用完、provider 不可用或无法可靠判断时，允许用户主动查看 approved reference；
- provider 临时失败后的“重新检查”会创建新的 evaluation ID，保留原答案与当前学习者重试序号，不会被旧失败记录短路，也不会消耗修改机会；
- AI 在参考答案揭晓前判定 `PASS` 时，之后查看答案只算核对，仍按独立产出保存；先看答案或根据失败反馈/提示修改后完成，才标记为使用过帮助。最终仍由用户自评保存。
- `PASS` 包含完全正确和仅有轻微非阻断问题两种情况。完全正确时自动展开参考答案与自评；存在小语法、拼写或笔误时先保留原句供局部修改，不提前揭晓答案。
- `typo` 只表示一个意图明确的机械输入失误，例如 `simulationr → simulations`；它必须是非阻断问题，不能单独把 verdict 降为 retry。笔误修正不算内容提示，也不占两次纠错额度。
- `spelling` 表示常规拼写不稳或无法确定为键盘笔误；单个非目标词拼写错误可以非阻断，但修正仍按语言帮助记录。单复数、主谓一致、词形和错误实词不得标成 typo。
- 笔误与语法、搭配、指代或逻辑问题同时存在时必须拆成独立错误；主要问题决定 verdict，UI 另以一行显示笔误。

## Gold baseline

`tests/fixtures/use-evaluator-gold.approved.json` 包含 32 条 Collocation 标准答案，`tests/fixtures/use-evaluator-sentence.approved.json` 包含 18 条 Sentence 标准答案；50 条均已经用户确认。新增 Sentence 案例固定 `simulationr` 为非阻断 `typo`，并确认 `rather than gain` 的共享不定式结构合法。它们与 provider 无关：以后即使更换国内模型或本地模型，也必须使用同一份固定输入和人工标签。当前 runner 只调用 DeepSeek。

配置候选 provider/model 后，可运行：

```bash
npm run eval:use-gold
```

runner 使用临时数据库，不改工作数据库；输出 schema-valid rate、exact/per-dimension agreement、false-pass、false-fail、blocking precision/recall、p50/p95 latency、fallback rate、token 数和 duplicate-write rate。数值门槛应在首次 approved baseline 后决定，false pass 优先于次要错误分类分歧。

`use-evaluator-collocation-v4` 的历史对照见 `docs/use-evaluator-baseline-2026-08-19.md`。当前 `deepseek-v4-flash` + `use-evaluator-v11` 已通过 50 条合并风险优先门槛：Schema-valid 100%、verdict agreement 98%、false pass/fail 0、target-expression 98%、blocking precision/recall 100%、fallback/duplicate write 0、p95 2586 ms。完整校准过程见 `docs/use-evaluator-baseline-2026-08-20.md`。
