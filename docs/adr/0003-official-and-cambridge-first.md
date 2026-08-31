# ADR 0003：IELTS 官方与 Cambridge 优先的来源策略

- 状态：Accepted
- 日期：2026-08-16
- 取代：ADR 0002 中的 Simon-only 决策

## 背景

Simon 的旧博客已下线，当前完整 model essays 多位于会员站；用户取得的《Ideas for IELTS Topics》是观点素材书而非完整范文。此外，教师范文的语言与论证质量仍需要外部标准校准。用户决定先从 IELTS 官方或 Cambridge 材料建立种子库。

## 决策

来源按以下优先级处理：

1. IELTS 官方公开的 Academic Task 2 高分考生作答，必须同时保存 band score 和 examiner comments；
2. Cambridge IELTS 正版材料中的 examiner-written model answers 或带评分与评语的 candidate answers；
3. IELTS 官方合作方 British Council / IDP 发布并明确标注用途的 sample answers；
4. Simon 等可靠教师作者的完整范文，后续作为补充和对照；
5. 来历不明的合集、转载 PDF 和“某某方法仿写”不得作为正式来源。

## 质量门槛

- “官方”只代表来源和评分可信，不代表每个句子都值得模仿；
- 官方 candidate response 必须记录实际 band，不能显示成“官方范文”；
- 优先从 Band 7.5 及以上作答选句；Band 7.0 以下默认只用于错误对照，不进入首批正式卡；
- 考官明确批评的表达、搭配、衔接或段落问题不能被抽成正面学习卡；
- 官方文件声明样本不是某个分数的唯一或绝对范例，产品必须保留这一限定；
- Cambridge 付费内容只能由用户从自己拥有的正版书籍或 Cambridge One 导出后放入 `sources/raw/`。

## 后果

- 开发种子仍尽量覆盖教育、科技、环境，但来源可靠度高于机械满足主题配额；
- Sentence Card 页面显示 `官方高分考生作答 · Band 8.5` 或 `Cambridge examiner model answer`，不得统称“官方范文”；
- Simon《Ideas for IELTS Topics》只作为 idea bank 候选，不作为 source essay；
- 首批卡片数量继续由学习价值决定，不设单篇硬配额。
