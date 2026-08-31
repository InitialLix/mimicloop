# 《新概念英语 3》Core / Appreciation 高召回复核

- 处理日期：2026-08-19
- 范围：第 18、27、29、38、41、44、45、47、51、53、55、59 课
- 来源角色：`language_richness_corpus`，不是 IELTS model essay
- 生成规则版本：`nce3-high-recall-core-appreciation-v1`

## 工作流

```text
已归档 raw source + source metadata/hash
→ 按段落高召回提取
→ 与既有句子卡和 Collocation 全库规范化查重
→ Core / Appreciation 分层
→ Core 新场景 Use + blind native-naturalness check
→ Schema、来源定位、目标短语与参考答案确定性校验
→ candidate
→ 用户既有整批发布授权
→ approved seed
→ SQLite
```

## 分层结果

- 新增 144 条：40 条 Core，104 条 Appreciation；
- 旧库复核降级 11 条：从强制 Recall → Use 调整为 Appreciation；
- 发布后共 401 条正式表达：286 条 Core，115 条 Appreciation；
- SQLite 中 `collocation_progress` 为 286 条，与 Core 数量一致；Appreciation 不创建学习进度。

Core 只保留在现代正式写作中自然、语义逻辑稳定、值得主动迁移的表达。所有新增 Core 都有完整中文新场景和参考答案。参考答案脱离来源原句逐句检查了名词搭配、单复数、介词、动词宾语、语域和模板感；结构迁移与自然表达冲突时，以自然表达为准。

Appreciation 用于中文容易理解、英文不容易主动写出，但叙事性、修辞性、语域限制或时代感使其不值得强制产出的表达。例如第 41 课的 `go into raptures at the mere mention of` 只在原文点状标注并显示“提到……便赞叹不已”，不进入搭配库、今日队列、Recall 或 Use。

## 旧库降级项

- `be lined up against`
- `get quite used to`
- `freedom from care`
- `grudge paying someone a high fee for something`
- `in times of real need`
- `live by doing something`
- `move from place to place with ease`
- `put someone in the same class as`
- `sleep in the open`
- `take one's mind off`
- `from humble beginnings`

这些表达本身没有被判错；调整的是学习负担和产出优先级。原文来源、canonical form、审核历史与 revision 均保留。

## 发布授权记录

用户此前已明确要求本轮新概念课文处理无需逐条人工点选，在原文归档、查重、Use、native-naturalness check 和确定性验证通过后默认发布。本批仍先生成 candidate，验证通过后才写入 approved seed；没有从 raw source 直接写入正式数据库。
