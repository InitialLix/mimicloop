# Collocation 数据库与备份迁移方案

- 状态：Implemented，migration、候选导入、人工审核事务与备份 v1.1 已于 2026-08-17 验证
- 日期：2026-08-17
- 范围：为 Collocation 候选审核、正式内容、句子关联、Recall 和复习持久化提供增量数据结构

## 1. 当前约束

现有 `attempts.card_id` 与 `review_states.card_id` 都通过外键绑定 `cards`。把 Collocation ID 塞入这两张表会破坏外键和业务语义，因此不采用多态 ID，也不把现有表改造成通用 learning item 表。

当前备份固定为 `schema_version = 1.0.0`，只包含句子内容、句子 attempts 和句子 review states。Collocation migration 必须与备份 v1.1 支持在同一发布单元中完成，否则恢复操作会遗漏新增数据。

## 2. 新增表

### `collocation_candidates`

保存候选审核工作流，不进入普通学习队列。

```text
id                    primary key
workflow_status
priority
normalized_text_hash
dedup_group_key
raw_json              完整 collocation.schema.json 记录
created_at
updated_at
```

索引：`workflow_status`、`normalized_text_hash`、`dedup_group_key`。

### `collocations`

只保存审核通过或后续归档的正式学习对象。

```text
id                    primary key
canonical_text
translation_prompt
pattern
expression_type
difficulty
content_status
content_revision
normalized_text_hash  unique
raw_json
created_at
updated_at
```

正式发布时必须使用比现有 revision 更高的内容；不得覆盖用户进度。

### `collocation_topics`

```text
collocation_id         foreign key → collocations, cascade
topic
primary key (collocation_id, topic)
```

用于语料库主题筛选。主题仍保留在 `raw_json`，关系表是查询索引。

### `collocation_argument_functions`

```text
collocation_id         foreign key → collocations, cascade
argument_function
primary key (collocation_id, argument_function)
```

### `collocation_source_links`

保存正式 Collocation 在来源范文中的每个真实语境。范文原句是必需来源，正式句子卡只是 nullable 的附加关联。

```text
collocation_id                 foreign key → collocations, cascade
source_essay_id                foreign key → source_essays, restrict/cascade update
paragraph_index
sentence_index
sentence_text                  导入时与来源范文当前位置逐字核对
card_id                        nullable foreign key → cards, restrict/cascade update
surface_form                   原句真实形式
learning_surface_form          nullable；仅在 card_id 非空时填写
occurrence_index
learning_occurrence_index      nullable；仅在 card_id 非空时填写
start_offset                   nullable，导入时计算
end_offset                     nullable，导入时计算
role                           primary / supporting
created_at
primary key (collocation_id, source_essay_id, paragraph_index, sentence_index, surface_form, occurrence_index)
```

每个 Collocation 恰好一个 primary 关系，由 repository 事务校验；数据库索引覆盖 `collocation_id`、`source_essay_id` 和 nullable `card_id`。当 `card_id` 非空时，必须同时验证该卡与相同 essay / paragraph / sentence 对应；无句子卡的普通正文句仍可成为合法来源。

### `collocation_progress`

与句子 `review_states` 分开。

```text
collocation_id          primary key, foreign key → collocations
learning_stage          new / recognized / recall / replace / use
recall_score
application_score
success_streak
lapse_count
interval_days
due_at
last_reviewed_at
updated_at
```

首版只正式使用 `new`、`recognized`、`recall`。其余枚举只在真正实现对应训练时启用；migration 不写虚假的掌握状态。

### `collocation_attempts`

```text
id                      primary key
collocation_id          foreign key → collocations, cascade
exercise_type           首版固定 zh_to_en_recall
prompt_snapshot
user_answer
normalized_answer
match_result            exact / accepted / different
self_rating
hint_used
attempt_count
duration_ms              nullable
completed_at
```

确定性 match 只作核对信息，不替代用户自评。

### `collocation_imports`

```text
import_hash              primary key
candidate_count
approved_count
relation_count
imported_at
```

Collocation 内容使用独立 import ledger，避免修改现有 `content_imports` 的既有语义和幂等结果。

## 3. 暂不新增的结构

首版不新增独立生成例句表。多个真实语境已经由 `collocation_source_links` 提供；独立生成的迁移例句尚未进入当前闭环，提前建表会形成没有实际消费者的抽象。Phase 8 出现经过审核的独立例句后再增加。

不把句子和 Collocation 抽象成通用 `learning_items`。当前两套内容的生命周期、审核字段和练习状态不同，强行统一会造成破坏性重构。

## 4. 备份 v1.1

新备份增加：

```text
collocation_candidates[]
collocations[]
collocation_source_links[]
collocation_attempts[]
collocation_progress[]
```

`collocation_topics` 与 `collocation_argument_functions` 从 Collocation `raw_json` 重建，不重复写入备份。

兼容规则：

- v1.0 备份继续可恢复，新增集合按空数组处理；
- v1.1 导出必须包含五个新增集合，即使为空；
- v1.1 恢复先恢复来源和句子，再恢复 Collocation、关系、进度和 attempts；
- 恢复前同时校验 JSON Schema 与 payload hash；
- 覆盖现有数据库前的 rollback backup 必须使用能包含 Collocation 的 v1.1；
- 旧版本应用不得尝试恢复 v1.1 备份。

实现时 `backup.schema.json` 不再直接复用只允许 `1.0.0` 的通用版本常量，而使用备份自己的 `1.0.0 | 1.1.0` 条件分支。

## 5. migration 执行顺序

1. 在数据库副本上运行现有全部 migration；
2. 用当前 v1.0 导出升级前备份并验证 hash；
3. 执行只新增表和索引的 migration，不修改 `cards`、`attempts`、`review_states`；
4. 升级 repository 与备份代码；
5. 运行旧数据计数、外键和 attempts/review states 快照对比；
6. 使用 v1.0 备份恢复到空库，验证新增表为空且旧数据一致；
7. 导入少量已人工批准的 Collocation fixture；
8. 导出 v1.1 并恢复到另一空库，验证全量往返；
9. 只有以上检查通过后才允许对工作数据库执行 migration。

migration 本身不 backfill 正式 Collocation，也不把现有 chunks 自动发布。内容 backfill 必须经过 candidate → human review → approved 流程。

## 6. rollback

SQLite 不执行生产 down migration。回滚采用可恢复方案：

- migration 前生成并校验 v1.0 备份；
- 首次导入 Collocation 前生成 v1.1 备份；
- 失败时关闭应用，将出错数据库保留为诊断副本；
- 使用升级前备份恢复到新的数据库文件；
- 原文件不直接覆盖或删除；
- 报告恢复路径与各表计数。

如果只是新 UI 或 repository 失败而表结构正常，可以回滚应用代码并保留新增空表；不得用删除表来模拟回滚。

## 7. 发布与审核事务

候选批准必须在单个事务内完成：

```text
校验候选 Schema 与来源定位
→ 检查 normalized hash 与 merge decision
→ upsert collocations（仅更高 revision）
→ 重建 topics / argument functions
→ 写入 collocation_source_links，并为有卡来源保留 nullable card 关联
→ 若首次发布则创建 progress(new)
→ 更新 candidate workflow 与 review history
→ 提交事务
```

任何一步失败都不产生半发布内容。拒绝、暂缓和合并只更新候选，不创建正式学习对象。

## 8. 必须通过的测试

- migration 重复执行不改变数据；
- migration 前后 152 张 cards、来源、句子 attempts 和 review states 完全一致；
- v1.0 备份能恢复到新 schema；
- v1.1 含 Collocation 的备份能完整往返；
- payload 被篡改时拒绝恢复；
- 未知 source essay 或错误 paragraph / sentence 定位被拒绝；
- surface form 不在来源原句中时被拒绝；
- 普通正文句在 `card_id = null` 时可合法入库，且不得伪造 learning surface；
- `card_id` 非空时，卡片位置和 learning surface 必须同时匹配；
- normalized hash 重复不能创建两个正式 Collocation；
- 一个 Collocation 可以关联多个句子；
- 一个句子可以关联多个 Collocation；
- 合并不会删除来源或已有 progress；
- Recall attempt 只更新 Collocation progress，不修改句子 review state；
- 重复导入命中同一 `collocation_imports.import_hash`。

## 9. `/today` 后续兼容方向

Phase 7 将现有句子队列升级为带类型的联合视图，但不会修改句子 attempts 的含义。队列项使用稳定键：

```text
sentence:<card_id>
collocation:<collocation_id>
```

路由仍分别进入句子和 Collocation 页面。首次默认每天最多加入 1 个新 Collocation；具体总量和插入位置在真实内容与 UI 验证后冻结。

## 10. 实施结果

- additive migration：`src/db/migrations/0003_curly_phantom_reporter.sql`；
- 工作数据库迁移后保持 28 篇来源、152 张句子卡与既有句子 attempts / review states；
- 200 条离线生成内容只进入 `collocation_candidates`，正式表保持为空，等待人工逐条批准；
- `collocation_imports` 使用独立整批 hash；相同候选文件重复导入直接跳过；
- 批准事务会再次核对范文 paragraph / sentence / surface 和可选 card / learning surface；首次发布才创建 `collocation_progress(new)`；
- 拒绝、暂缓、保存与合并不创建正式条目；合并目标必须是已批准条目；
- 备份默认导出 v1.1；v1.0 缺失的五个 Collocation 集合按空数组恢复；
- 迁移、v1.0/v1.1 恢复、候选门禁、普通正文来源批准、拒绝与合并均有数据库集成测试。
