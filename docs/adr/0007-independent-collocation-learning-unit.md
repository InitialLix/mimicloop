# ADR 0007：Collocation 作为独立学习对象增量接入

- 状态：Accepted
- 日期：2026-08-17

## 背景

现有句子卡已经包含少量 `chunks`，但 chunk 只是句内教学标记，无法表达跨句去重、多来源关联、独立掌握状态和单独复习。当前 152 张正式卡中只有 55 张带 chunk，67 次标记对应 66 个完全不同的文本，因此不能把 chunks 机械复制为新卡。

来源范文共有大量未被选为正式句子卡的普通正文句，这些句子仍可能包含高价值搭配。Collocation 的来源资格因此以“可定位的范文原句”为准，句子卡关系只是可选增强，不能作为准入门槛。

## 决策

1. Collocation 使用独立 Schema、候选审核和正式内容表；现有 chunks 保留。
2. 句子与 Collocation 使用多对多关系，同时保存原句和学习句中的 surface form。
3. Collocation attempts 与 progress 单独建表，不把 Collocation ID 塞入句子 `attempts` 或 `review_states`。
4. Recall 首版只有“中文提示 → 输入英文 → 核对 → 自评”。
5. 确定性匹配只忽略大小写、空格与句末标点；合理近义表达由用户自评，不做运行时 LLM 判分。
6. 候选由 Codex 离线生成，只能进入 candidate；人工批准后才能进入正式库和学习队列。
7. 顶级导航继续使用“语料库”；内部增加 Collocations 访问方式。
8. `/today` 后续使用带类型的统一队列，不新增平级大型入口。
9. 数据库只做 additive migration，并与包含 Collocation 的备份升级一起发布。

## 后果

- 同一表达可以关联多个真实来源句；
- 用户可以会用搭配但不必记住完整原句，两套进度不会互相覆盖；
- migration 和备份工作量增加，但旧句子数据不需要重构；
- 首批内容必须重新扫描全部正式句子，不能只读取现有 chunks；
- 槽位替换、自主造句与 LLM 评价继续后置。

## 验证要求

- Schema 与确定性规则拒绝未知来源、错误 surface form、错误 hash 和不完整审核历史；
- migration、v1.0/v1.1 备份兼容与独立复习状态必须有集成测试；
- 浏览器验证语料库、Collocation 学习卡、Recall 与 `/today` 不破坏现有句子流程。
