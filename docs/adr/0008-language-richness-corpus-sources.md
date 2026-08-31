# ADR 0008：把语言丰富度语料与 IELTS model essays 分开

- 状态：已接受
- 日期：2026-08-18

## 背景

MimicLoop 需要从《新概念英语 3》等非 IELTS 教材中吸收自然搭配和可迁移句式。这类文本有语言学习价值，但没有 IELTS prompt、Band 或 examiner comments，也不应被展示或统计为 IELTS model essay。

## 决策

1. 来源可声明 `content_role: language_richness_corpus`；现有范文继续视为 `ielts_model_essay`。
2. 教材来源使用 `answer_origin: published_language_textbook`，并要求：
   - `ielts_prompt: null`；
   - `question_type: not_applicable`；
   - `claimed_band: null`；
   - `examiner_comments: null`。
3. 前台文章来源显示教材合集名，例如“新概念英语 3”，并明确标注“语言丰富度语料，不是 IELTS model essay”。
4. 句子卡仍服务于 Academic IELTS Writing Task 2，但只收入能够迁移到书面表达的语言；来源角色不改变卡片的训练目标。
5. 原文必须先由用户以合法持有的文件放入 `sources/raw/`，再生成段落索引、内容 hash 和候选。公开网页可用于核对书目信息与短篇预审，不作为绕过 raw 归档的正式正文来源。

## 后果

- 范文数量、Band 和 model essay 展示不会被教材课文污染。
- 句子与 Collocation 仍能沿用现有候选、查重、审核、学习和原句定位流程。
- 旧来源不强制回填 `content_role`，缺省按 `ielts_model_essay` 读取；新的语言丰富度来源必须显式声明。
