# IELTS 官方与 Cambridge 来源材料接收说明

第一批开发种子需要教育、科技、环境各一篇完整高可靠度作答或 model answer。IELTS 官方公开文件优先由 Codex 获取；Cambridge 付费内容请提供你有权访问的原始页面导出或文件，不要只复制挑选后的好句。

## 推荐格式

按优先级：

1. Cambridge One 或正版电子书导出的完整 sample/model answer 页面；
2. 正版 Cambridge IELTS 书中包含题目、答案、band/评语的清晰扫描页；
3. IELTS / British Council / IDP 官方页面保存的 PDF 或 HTML；
4. 保留完整题目、正文、标题、来源和页码的 UTF-8 文本。

文件放入：

```text
sources/raw/
```

建议命名：

```text
ielts-official-education-band-8-5.pdf
cambridge-technology-examiner-model.pdf
ielts-official-tourism-environment-band-7-5.pdf
```

## 必须保留

- IELTS prompt；
- 完整 model answer；
- 页面标题；
- 原始 URL 或 ebook 书名与页码；
- 段落顺序；
- 页面中明确写出的 band 与 examiner comments（若有）；
- Cambridge 书名、版本、Test 编号和页码。

## 不要做

- 不要在提供前让其他模型改写或润色；
- 不要删除看起来普通的句子；
- 不要用第三方合集或盗版 Cambridge PDF 替代一手官方原文；
- 不要把多篇作文混在一个无标题文本中。

材料进入 `sources/raw/` 后，Codex 负责抽取正文、生成段落索引和 SHA-256、建立 metadata，并按内容规范生成候选卡。原始文件保持只读语义，不会被学习化文本覆盖。官方 candidate response 不会被改名为“官方范文”。

## 非 IELTS 的语言丰富度语料

《新概念英语 3》等教材可以作为自然搭配与可迁移句式的补充来源，但必须显式标为 `language_richness_corpus`，不能计入 IELTS model essays、Band 或考官样本。仍需由用户把合法持有、保留原始段落的正文放进 `sources/raw/`，再走相同的候选、查重和人工审核流程。第 18、27 课已完成 raw 归档、来源入库和候选生成，当前接收状态见 `sources/metadata/nce3-lessons-18-27-intake.md`，人工审核清单见 `sources/metadata/nce3-candidate-review.md`。
