# MimicLoop Collocation 内容规范

- 规范版本：1.2.0
- 适用范围：Academic IELTS Writing Task 2 与辅助其写作训练的语言丰富度语料
- 状态：Accepted for candidate production
- 目标：把值得主动调用的自然搭配建设成可独立审核、关联来源、回忆和复习的学习对象

## 1. 基本原则

Collocation 位于单词和完整句子之间。它必须能帮助学习者解决“单词都认识，但写作时组合不自然或想不起来”的问题。

它不是：

- 所有连续出现的词组；
- 句子卡 `chunks` 的机械复制；
- 生词释义；
- 为了显得高级而截取的长字符串；
- 脱离原句、无法定位来源的模型生成表达；
- 可以绕过人工审核直接进入正式库的内容。

每个范文正文句通常提取 0～3 个候选，但这不是配额。没有足够学习价值时必须输出 0 个；同一句中有多个真正高价值表达时可以超过 3 个，但要在审核理由中解释。是否已被选为正式句子卡不影响 Collocation 的准入资格。

## 2. Collocation 与普通 chunk 的区别

句子卡中的 `chunk` 是局部教学标记；正式 Collocation 是独立学习对象。完整范文中的普通正文句也必须参与扫描，不能因为没有做成整句学习卡而被排除。

只有同时满足以下条件时，chunk 或任一范文正文句中的原文片段才值得升级：

1. 表达自然，且来源质量允许正面学习；
2. 固定部分和可替换部分边界清楚；
3. 中国学习者可能认识单词却难以主动、自然地组合；
4. 能用于 IELTS Task 2 的观点、原因、影响、比较、让步或解决方案；
5. 能设计明确且不泄露答案的中文回忆提示；
6. 至少能回到一篇正式来源范文中的真实原句；如该句另有正式句子卡，再建立可选卡片关联。

以下内容通常只保留为普通 chunk 或不标记：

- 含义完全透明、搭配边界很弱的基础表达，例如 `encourage creativity`、`lack of exercise`、`could lead to`；
- 仅仅是一个生词加常见宾语；
- 过度具体、离开当前原句几乎不能使用的长词串；
- 依赖代词、前文指代或省略才能理解的片段；
- 语法骨架很大，但没有可独立回忆的词汇组合；
- 考官或可靠来源明确批评为不自然、搭配错误或语体不当的表达。

## 3. 内部表达类型

前台统一称为“Collocation”或“表达”，内部使用三类：

### `collocation`

词与词之间存在稳定选择关系，通常可以替换部分对象。

```text
pose a threat to
widen access to
place pressure on
```

### `fixed_phrase`

整体较固定，主要承担语篇、时间或评价功能，可替换空间较小。

```text
in the long run
to a certain extent
```

### `sentence_frame`

比普通搭配更大，核心价值是可复用的句子框架。只有当它能作为一个独立、简短的表达单位时才进入本系统；大型论证骨架继续保留在句子卡 `pattern` 中。

```text
There is no guarantee that {claim}.
```

首批候选优先处理 `collocation` 和 `fixed_phrase`。不得为了覆盖类型而强行收录 `sentence_frame`。

## 4. 粒度与 canonical form

`canonical_text` 是去重、Recall 和正式展示使用的核心形式，应满足：

- 使用最自然、最小但意义完整的词形；
- 动词通常使用原形；
- 保留搭配所必需的介词、冠词和结构词；
- 不包含仅属于某个来源句的主语、时态、情态动词或可选程度副词；
- 不为了变短而删除决定搭配边界的成分；
- 默认使用小写，专有名词除外；
- 不带句末标点。

示例：

```text
来源形式：may pose a serious threat to local ecosystems
canonical：pose a threat to
pattern：pose a/an {degree} threat to {object}
```

下列情况不能自动合并：

- 形式相似但语义或搭配对象不同；
- 介词变化导致意义变化；
- 可数性、冠词或单复数变化会改变自然度；
- 一个是完整固定短语，另一个只是更大句型的一部分。

## 5. surface form 与来源定位

每个候选至少有一个 `source_links` 项，并且恰好一个标记为 `primary`。来源事实以范文中的具体句子为基础，句子卡只是可选的附加关系。

- `source_essay_id + paragraph_index + sentence_index + sentence_text` 必须准确定位到来源范文正文；
- `surface_form` 必须逐字出现在定位到的 `sentence_text` 中；
- 如果该来源句存在正式卡，必须填写 `card_id`，且 `learning_surface_form` 必须逐字出现在 `learning_sentence` 中；
- 如果该来源句没有正式卡，`card_id`、`learning_surface_form` 和 `learning_occurrence_index` 必须为 `null`；
- 同一句出现多次时，用各自的 `occurrence_index` 定位；
- 有卡片关联且原句与学习句形式相同时，两种 surface 仍都保存，避免以后内容修订破坏定位；
- 其他来源句使用 `supporting`，不得覆盖或删除 primary 来源；
- 找不到来源时只能保留为待确认信息，不能进入正式候选文件。

后续数据库可以计算字符 offset，但候选 JSON 以“文本 + occurrence index”为事实来源，避免句子修订后产生静默错位。

## 6. 中文 Recall 提示

`translation_prompt` 的唯一目标是让用户看到中文后主动找回英文 Collocation。

合格提示应：

- 表达 canonical form 的核心意义；
- 用 `……` 标记可替换对象；
- 在需要时说明强度、方向或语体差别；
- 尽量短，通常不超过 24 个汉字；
- 不包含英文、英文首字母或明显泄露答案的音译；
- 不用过宽中文使多个英语表达都同样合理；
- 不照搬生硬词典义，而要符合 IELTS 论证语境。

示例：

```text
对……构成威胁          → pose a threat to
扩大……的可及性        → widen access to
解决……的根本原因      → address the root cause of
在某种程度上与……有关  → be linked in part to
```

若中文不可避免地对应多个自然表达，第一版仍展示参考答案并由用户自评；不得把合理近义表达自动判错。

## 7. pattern 与 slots

`pattern` 用于说明固定部分与可替换部分，不是 Recall 阶段的提示。

- 占位符使用 `{snake_case}`；
- 每个占位符必须有同名 slot；
- 每个 slot 至少提供两个经过审核的替换例；
- 替换后必须保持冠词、数、介词和语义自然；
- pattern 过大、接近完整句子时，应重新判断是否其实属于句子卡结构；
- `pattern` 与 `slots` 可以为空，但 `sentence_frame` 必须同时具备两者。

前台展示补充：

- `pattern` 是内容审核和生成举一反三例子的内部依据，不应机械替换成一排横线；
- 详情页只展示由已审核 slots 组成的完整、自然表达，栏目统一称为“搭配变化”；
- 只有真正能扩展搭配对象或跨主题复用的表达才展示该栏目；固定短语、仅仅补足普通动作宾语或不足两个有效变化的表达不强行展示；
- `accepted_answers` 只服务于 Recall 核对，不在普通详情页重复展示；
- 新变化不得把来源中的一个具体对象固化为唯一骨架，例如 `contribute to the economy` 应能扩展到 `contribute to economic growth / social development / environmental protection`。

## 8. accepted answers

`accepted_answers` 至少包含 canonical form。

可以加入：

- 英美拼写差异；
- 对意义无影响的合法冠词或限定形式；
- 同一 canonical unit 的必要形态变体。

不得加入：

- 只是大意相近的另一个 Collocation；
- 搭配边界不同的较长或较短表达；
- 尚未人工确认自然度的模型建议。

确定性比较只忽略大小写、首尾空格、连续空格和句末标点。任何更宽松的接受规则都必须单独记录并测试。

## 9. 去重与聚类

去重分三层：

1. `normalized_text_hash`：canonical form 规范化后的精确重复；
2. `group_key`：词形、可选修饰语或 surface form 不同，但可能属于同一表达族；
3. 人工语义审核：决定合并、保持独立或暂缓。

自动化可以提出合并候选，但不能完成不确定合并。合并时必须：

- 保留所有 source links；
- 保留所有真实 surface forms；
- 指向稳定的 `merge_target_id`；
- 在 review history 中记录理由；
- 禁止对象合并到自身；
- 不删除已经产生的学习记录。

## 10. Core / Appreciation 学习分层

`learning_mode` 与候选审核的 `priority` 是两件事：

- `recall_use`（页面称 **Core**）：现代英语中自然、语义逻辑可靠、适合正式写作，并且有足够主动迁移价值；必须具备审核过的新场景 Use 题，进入每日 Recall → Use 和复习进度；
- `appreciation`（页面称 **Appreciation**）：中文容易理解、英文不容易主动写出，表达自然且值得认识，但叙事性、修辞色彩、时代感或使用范围使其不适合强制产出；只在原文以点状下划线标注并提供简短释义，不进入搭配库、今日队列、Recall、Use 或 `collocation_progress`。

《新概念英语 3》及以后引入的可靠外刊等语言丰富度语料不设“每课 3～5 条”或任何类似配额。先逐段高召回提取所有“中文容易懂、英文不容易主动写出来”且满足自然度门槛的书面表达，再做全库查重和 Core / Appreciation 分层；不得因数量多而丢弃好表达，也不得把普通、显而易见的词组当成高召回结果。不同教材、刊物和出版方必须作为独立文章来源保存。

判断顺序是：现代英语自然度与地道度 → 语义逻辑与典型搭配 → IELTS / 正式写作适用性 → 主动回忆与跨场景迁移收益 → 最后才考虑保留来源结构。例如 `go into raptures at the mere mention of` 地道且有欣赏价值，但修辞性强，不值得要求用户在 IELTS 中主动套用，因此归入 Appreciation。

## 11. 评分与候选优先级

每项按 1～5 评分：

- `naturalness`：来源中的自然度与可靠性；
- `active_recall_value`：认识但不容易主动产出的程度；
- `transfer_value`：跨主题或跨对象复用价值；
- `ielts_usefulness`：进入 Task 2 论证的实际价值。

`core` 候选通常四项中至少三项达到 4，且 naturalness 不低于 4。`supporting` 可以更主题化，但仍必须有明确学习价值。

## 12. 候选生产契约

离线生成流程：

```text
完整来源范文的全部正文句
→ 匹配可选的正式句子卡与已有 chunks
→ 逐段高召回提取达到门槛的全部候选，不设固定数量
→ canonicalize
→ Core / Appreciation 分层
→ 生成中文提示、pattern 与 slots
→ 建立 source links
→ 计算 normalized hash
→ 全库查重与聚类
→ Schema 与确定性校验
→ candidate
→ 人工审核
→ approved
```

Codex 只能写入候选态。任何 `approved` 记录必须包含人工 `approved` review event。

审核动作：

```text
批准 / 修改 / 暂缓 / 拒绝 / 合并 / 归档
```

所有修改提升 `content_revision`，并保留历史。

## 13. 首版学习与复习规则

第一次学习：

```text
中文提示
→ 英文表达
→ 固定与可替换部分
→ 来源原句
→ 标记已认识
```

正式 Recall 只有一种：

```text
中文提示
→ 输入英文 Collocation
→ 显示 canonical / accepted answers
→ 用户自评
→ 保存 Recall attempt，但不安排下次复习
```

通过人工审核的搭配随后进入 Use：

```text
换对象或换话题的完整中文句子
→ 只提示较难且非考点的英文词汇
→ 用户写出英文句子
→ 显示参考答案与目标搭配
→ 用户自评
→ 保存 Use attempt，并安排下次复习
```

所有 Core 必须配有正式 Use 题；缺少 Use 题的 Core 不得批准。Appreciation 不得携带 Use 题。Use 题同样遵循 `candidate → human review → approved`，运行时不调用 LLM，也不对开放式句子自动评分。Collocation 与句子的进度独立保存。复习时间沿用当前产品已经验证的 Asia/Shanghai 次日规则；若未来改为分档间隔，必须同时更新 ADR、文档和测试。

Collocation Use 不是把 slot 中的名词机械换掉。参考答案必须优先满足现代英语自然度、语义逻辑与正式写作适用性，再考虑保留来源结构。每题批准前必须脱离原句做 blind native-naturalness check，逐项检查名词搭配、数与可数性、介词、动词宾语组合、语体和模板感；“语法正确但不够自然”直接判为 `needs_edit`，不能批准。

每日队列固定加入 10 个新 Collocation；到期 Collocation 使用独立复习配额，不挤占新学习名额，也不减少既有句子任务数量。句子与 Collocation 使用带类型的统一任务键交替进入 `/today`，但每一屏仍只呈现一个主要动作。

## 14. 人工审核清单

批准前逐项确认：

- [ ] canonical form 粒度自然；
- [ ] 中文提示不会过宽或泄露答案；
- [ ] pattern 与 slots 边界正确；
- [ ] accepted answers 没有混入近义但不同的表达；
- [ ] primary source 可准确定位；
- [ ] supporting sources 确实是同一表达；
- [ ] 没有把普通 chunk 或大型句型误当 Collocation；
- [ ] 去重组和潜在合并项已检查；
- [ ] 使用提醒与常见错误简短、必要；
- [ ] 适合 IELTS Task 2 的真实写作场景。
- [ ] Core 确实值得主动 Recall → Use，且新场景参考句通过 blind native-naturalness check；
- [ ] Appreciation 没有练习数据，只保留准确、简短的原文释义。
- [ ] Use 中文句子完整自然，且确实改变了原搭配的对象或话题；
- [ ] Use 提示不直接泄露目标搭配，参考答案确实包含已审核的目标 surface form。
- [ ] 完全遮住来源原句后，Use 参考答案仍像受教育母语者在现代正式写作中会自然写出的句子；不存在更自然的常用表达被硬套结构替代。
