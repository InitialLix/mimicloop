# ADR 0006：按学习目标分流 Use 练习

- 状态：Accepted
- 日期：2026-08-16

## 背景

不同句子被收录的原因不同。结构型和论证型句子的目标是掌握逻辑骨架；词汇型句子的目标是自然使用目标词块。若所有卡都做同一种仿写题，练习会偏离内容价值，也会诱导用户为了复杂而复杂。

## 决策

1. `structure` 与 `mixed` 的 Use 读取卡片中人工审核的 `pattern`、`slots` 和 `slot_replacement`，要求替换内容但保留论证逻辑。
2. `mixed` 同时显示核心 chunk，作为新句中应尽量保留的次级目标。
3. `vocabulary` 的 Use 选取首个经审核的 chunk，要求用户换话题写一个自然的简单句；参考写法依次取 `transfer_example`、`simplified_version`、`learning_sentence`。
4. 词汇卡不再自动展示今日队列中上一张 structure/mixed 骨架。实际使用发现跨卡支架容易被理解为当前题目的目标结构；词汇 Use 只围绕当前中文提示、参考答案和目标词块展开。
5. Recall 只记录阶段尝试。完成与卡片目标匹配的 Use 后，才更新复习状态并将本句计为今日完成。
6. 用 `adaptive_use_started_at` 保留规则启用前的完成记录，避免升级后要求用户补做已完成任务。

## 后果

- 用户看到的练习与该句真正值得掌握的部分一致；
- 词汇学习不会被上一张卡的结构干扰；
- 刷新页面时，完成 Recall 但未完成 Use 的卡会直接恢复到 Use；
- 新增确定性练习类型 `guided_application`，不调用运行时 LLM，也不做自动作文评分。

## 验证

- 单元测试覆盖 structure、vocabulary，并确认 vocabulary task 不携带跨卡 scaffold；
- 今日队列测试覆盖 Recall 进行中、Use 完成和旧进度兼容；
- 数据库测试覆盖 Recall 不调度、Use 才更新次日复习状态；
- 浏览器分别检查 structure/mixed 与 vocabulary Use 页面。
