# ADR 0010：Phase 2 从受控 Use Evaluator 开始

- 状态：Accepted
- 日期：2026-08-19

## 背景

第一阶段已经具备经过人工审核的 Sentence Use、Collocation Use、参考答案、自评、尝试记录和次日复习。现有开放式答案只能由用户对照参考答案自评，不能可靠识别自然改写、语义遗漏或搭配错误。

`docs/agent-phase2-spec.md` 将第二阶段的首个能力固定为 Phase 2.1 Open-ended Use Evaluator，并要求现有确定性流程在模型不可用时仍可完整运行。

## 决策

1. Phase 2.0 只完成仓库审计、范围门禁和进入新 migration 前必须修复的备份兼容问题，不建立通用 Agent 基础设施。
2. Phase 2.1 首先在一条现有 Collocation Use 垂直链路中接入受控 Evaluator，验证后才复用同一契约覆盖 Sentence Use。
3. AI 功能由服务端 feature flag 控制并默认关闭；未配置、超时、网络失败、拒绝或输出非法时，保留用户答案并回退到现有参考答案与自评。
4. 服务端根据稳定 exercise ref 从 SQLite 读取 approved 内容、目标资产、accepted variants、中文题意、参考答案与 revision。客户端字段不作为这些事实的来源。
5. 模型只返回 `use-eval.v1` 观察结果。严格 Schema 校验后还必须执行 attempt ID、evidence span、pass/blocking issue 和置信度等语义校验。
6. 模型评价不直接修改现有复习状态。用户仍通过原 Use 自评完成 `attempts` / `collocation_attempts` 写入和次日调度。
7. 稳定 attempt ID、evaluation 和 trace 必须幂等；重复 HTTP 请求返回既有结果，不能重复写 attempt、evidence 或复习调度。
8. 不保存隐藏思维链。Trace 只保存必要步骤、版本、模型、延迟、状态、错误码和数据引用；原始 provider 输出遵循最小保留原则。

## 非目标

- Guided Writing、作文规划或 Band 评分；
- Learner Model、mastery reducer 或自适应 Today；
- 多 Agent、通用聊天、工具循环、向量数据库；
- 自动生成或批准正式语料和训练题。

## 结果

- 第一阶段确定性产品继续是可独立运行的基线；
- Phase 2.1 只增加完成首个 evaluator 垂直切片所需的 provider adapter、版本化 Schema、可信上下文、幂等持久化、fallback、trace 和测试；
- 每个后续 Phase 必须在上一阶段退出条件通过后另行更新实施计划。
