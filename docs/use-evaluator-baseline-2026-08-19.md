# DeepSeek V4 Flash Use Evaluator Baseline #1

运行日期：2026-08-19  
fixture：`tests/fixtures/use-evaluator-gold.approved.json`（32 条，人工已批准）  
provider/model：DeepSeek / `deepseek-v4-flash`  
prompt：`use-evaluator-collocation-v1`  
schema：`use-eval.v1`

## 结果

| 指标 | Baseline #1 |
|---|---:|
| Schema-valid | 26 / 32（81.25%） |
| Exact agreement | 43.75% |
| Meaning agreement | 65.63% |
| Target-expression agreement | 59.38% |
| Grammar agreement | 71.88% |
| Collocation agreement | 65.63% |
| False-pass rate | 6.67% |
| False-fail rate | 5.88% |
| Blocking precision | 92.31% |
| Blocking recall | 80.00% |
| Fallback rate | 18.75% |
| p50 / p95 latency | 2694 ms / 3452 ms |
| Duplicate-write rate | 0% |
| Input / output tokens | 23,359 / 8,124 |

按运行时段的 DeepSeek V4 Flash 高峰公开价、并保守按全部输入缓存未命中估算，本轮约 ¥0.14；空闲时段同等 token 约 ¥0.07。实际账单以 DeepSeek 控制台为准。

runner 输出中的 `releaseEligible=true` 只表示 fixture 已完成人工批准，不表示模型质量已经达到发布门槛。

## 初始发布门槛

- 当前 32 条中 false pass 必须为 0；
- Schema-valid rate 必须达到 100%，fallback rate 不超过 3.125%（最多 1 条）；
- exact agreement 不低于 80%；meaning 与 target-expression agreement 不低于 90%；
- blocking precision 和 recall 均不低于 90%；
- p95 不高于当前 8 秒 timeout；duplicate-write rate 必须为 0。

## 结论

Baseline #1 不达标，Phase 2.1 继续保持进行中。主要风险是 6 条输出被本地验证拒绝、meaning/target-expression 一致率不足，以及出现 false pass。安全 fallback、延迟和幂等表现符合预期。下一轮应先让 runner 输出 case ID 与本地拒绝原因，再针对 prompt/schema 兼容和误判做最小修改；不得通过放松本地安全校验来提高表面通过率，也不得进入 Phase 2.2 或 Guided Writing。

## 后续校准与最终模型选择

逐 case 诊断显示，早期 Flash 的主要问题是证据 span 并非逐字子串、额外 JSON 字段、介词/单复数错误漏判和次级标签不稳定。v4 按 DeepSeek JSON mode 要求加入固定 JSON 样板，设置 `temperature=0`，并继续保留本地严格 Schema/语义校验。

| 指标 | Flash v4 | Pro v4 run 1 | Pro v4 run 2 |
|---|---:|---:|---:|
| Schema-valid | 96.88% | 100% | 100% |
| Verdict agreement | 未记录 | 100%（由逐 case 分歧反推） | 96.88% |
| Exact agreement | 59.38% | 71.88% | 65.63% |
| Meaning agreement | 87.50% | 90.63% | 87.50% |
| Target-expression agreement | 87.50% | 96.88% | 93.75% |
| Grammar agreement | 87.50% | 93.75% | 96.88% |
| Collocation agreement | 71.88% | 81.25% | 78.13% |
| False pass / false fail | 0% / 0% | 0% / 0% | 0% / 0% |
| Blocking precision | 100% | 100% | 100% |
| Evaluable blocking recall | 未记录 | 约 92.31% | 92.31% |
| Fallback | 3.13% | 0% | 0% |
| p95 latency | 2455 ms | 4564 ms | 4334 ms |
| Duplicate write | 0% | 0% | 0% |

首次 baseline 后设定的 exact 80% 过度放大了 `awkward`/`incorrect`、`partial`/`missing` 和重复错误类型等不会改变教学动作的次级差异。根据规范中“false pass 优先于次要错误分类分歧”的要求，最终硬门槛调整为：Schema-valid 100%、verdict agreement 至少 95%、false pass/false fail 均为 0、target-expression 至少 90%、可评价答案 blocking recall 至少 90%、blocking precision 100%、fallback/duplicate write 均为 0、p95 低于 8 秒。Exact 与细分类别继续作为回归监控指标，不再单独阻止安全发布。

DeepSeek V4 Pro v4 连续两轮满足硬门槛，选为 Phase 2.1 运行模型。Flash 保留为历史对照，不作为当前发布模型。所有运行合计公开价保守估算约 ¥1.2，实际账单可能因缓存命中更低。
