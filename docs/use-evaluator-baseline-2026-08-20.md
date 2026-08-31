# DeepSeek V4 Flash Combined Use Evaluator Baseline

运行日期：2026-08-20  
fixtures：32 条 Collocation + 17 条 Sentence，共 49 条，均经用户确认  
provider/model：DeepSeek / `deepseek-v4-flash`  
最终评价契约：`use-evaluator-v10`  
schema：`use-eval.v1`

## 验收门槛

沿用风险优先门槛：Schema-valid 100%、verdict agreement 至少 95%、false pass / false fail 均为 0、target-expression agreement 至少 90%、可评价答案 blocking recall 至少 90%、blocking precision 100%、fallback / duplicate write 均为 0、p95 低于 8 秒。Exact、meaning、grammar 与 collocation 细分类继续监控，但不因 `partial` / `missing` 或 `awkward` / `incorrect` 等不改变教学动作的分歧单独阻止发布。

## 校准过程

| 版本 | Schema-valid | Verdict | False pass / fail | Target | Evaluable blocking recall | Fallback | 结论 |
|---|---:|---:|---:|---:|---:|---:|---|
| v6 | 93.88% | 85.71% | 3.85% / 0% | 87.76% | 86.96% | 6.12% | 不通过：证据 span、目标内部单复数漏判 |
| v7 | 97.96% | 95.92% | 0% / 4.35% | 95.92% | 95.65% | 2.04% | 不通过：attempt ID 回抄和轻微错误 verdict |
| v8 | 100% | 97.96% | 0% / 4.35% | 93.88% | 100% | 0% | 不通过：普通拼写小错被要求重写 |
| v9 | 100% | 97.96% | 3.85% / 0% | 97.96% | 95.65% | 0% | 不通过：语法归一化过宽，出现危险误放行 |
| v10 | 100% | 95.92% | 0% / 0% | 97.96% | 100% | 0% | 通过 |

v9 的宽泛语法归一化已删除。v10 只做三类窄且确定性的 provider 输出归一化：attempt ID 使用服务端可信输入、所有 evidence span 清空为 `null`、仅在全部错误都是非阻断 spelling 且无任何阻断错误时，把不必要的 retry 归一为 pass。目标词块本体拼写错误若带 `target_expression` 阻断错误，仍必须修改。

## v10 最终结果

| 指标 | 结果 |
|---|---:|
| Total / valid | 49 / 49 |
| Schema-valid | 100% |
| Verdict agreement | 95.92% |
| Exact agreement（监控项） | 67.35% |
| Meaning agreement（监控项） | 91.84% |
| Target-expression agreement | 97.96% |
| Grammar agreement（监控项） | 93.88% |
| Collocation agreement（监控项） | 79.59% |
| False pass / false fail | 0% / 0% |
| Blocking precision | 100% |
| Blocking recall / evaluable recall | 100% / 100% |
| Fallback | 0% |
| p50 / p95 latency | 2142 ms / 2900 ms |
| Duplicate-write rate | 0% |
| Input / output tokens | 87,694 / 13,180 |

## 结论

`deepseek-v4-flash` + `use-evaluator-v10` 通过 49 条合并 Use baseline。Sentence structure、Sentence vocabulary 与 Collocation Use 可以使用同一条 evaluator / teaching-action 链路。该结论只覆盖当前 Use 评价范围，不覆盖 Recall、Learner Model、Adaptive Next-Step、作文评分或 Guided Writing。

## 2026-08-24 v11 笔误分级回归

用户确认机械笔误不得与真实拼写不稳、语法或逻辑错误混为一类。`use-evaluator-v11` 在 `use-eval.v1` 中新增 `typo` error type，并固定以下边界：

- 单个、意图明确、位于非目标词的机械增删/重复/替换/颠倒字符为非阻断 `typo`；
- 常规拼错或无法确认是键盘失误时仍为 `spelling`；
- 单复数、主谓一致、词形和错误实词不是 typo；
- 目标表达内部的表面错误仍可产生阻断 `target_expression`；
- typo 与逻辑等问题并存时必须分开报告，主要问题决定 verdict。

固定集新增 `sentence-pattern-obvious-typo`：`simulationr` 被要求判为 `PASS + grammar minor_issue + non_blocking typo`，同时确认 `rather than gain` 合法。用户于 2026-08-24 批准该标签。

| 指标 | v11 结果 |
|---|---:|
| Total / valid | 50 / 50 |
| Schema-valid | 100% |
| Verdict agreement | 98% |
| Exact agreement（监控项） | 66% |
| Meaning / target / grammar / collocation | 88% / 98% / 96% / 80% |
| False pass / false fail | 0% / 0% |
| Blocking precision / recall | 100% / 100% |
| Fallback / duplicate write | 0% / 0% |
| p50 / p95 latency | 1927 ms / 2586 ms |
| Input / output tokens | 98,188 / 12,465 |

新增 typo 案例完全匹配，包括 error type。一个历史 prompt-injection 案例仍在 `cannot_judge` / `retry` 次级分类上分歧，但没有造成 false pass、false fail 或阻断问题漏判；风险优先门槛全部通过。
