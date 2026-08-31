# 引导写作智能体：人工原型测试与问题清单

- 记录日期：2026-08-19
- 文档性质：下一阶段产品讨论材料，不是已批准的运行时 Agent 设计
- 测试范围：Academic IELTS Writing Task 2
- 目标水平：帮助学生写出以 Band 6.5–7.0 为目标的完整作文，但不承诺或自动判定真实考试分数
- 当前产品基线：186 张正式句子卡、286 条 Core 表达、115 条 Appreciation 表达

## 1. 背景与用户要求

用户已经完成当前产品的第一步，希望开始探索下一阶段的“引导写作智能体”。目标不是让模型直接代写，而是尝试让智能体像课外老师一样，指导学生调用：

1. 产品中已经学过的句子骨架；
2. 产品中已经学过的短语与 Collocation；
3. 学生自己掌握的基础英语；
4. 学生自己的观点和生活常识；

最终写出一篇至少以 IELTS Writing Task 2 Band 6.5–7.0 为目标的作文。

用户同时指出，现有语料库主要解决“怎么表达”，还没有系统教授：

- 怎样审题；
- 怎样判断题目中的限定词；
- 怎样产生和筛选观点；
- 怎样建立因果与让步逻辑；
- 怎样组织段落和全文。

本次先以人工方式模拟一次完整教学过程，用于观察现有语料能够承担多少工作，以及未来智能体还缺少哪些能力。

## 2. 当前约束与本次边界

当前 `AGENTS.md` 仍规定第一阶段不得引入运行时 LLM API、Agent、自动作文评分或开放式迁移评价。因此，本次工作仅为离线、人工原型和产品研究：

- 没有修改运行时代码；
- 没有调用或接入运行时 LLM；
- 没有将本次作文写入正式语料库或数据库；
- 没有把模型生成内容标记为 approved；
- 没有给出真实 IELTS 分数，只讨论目标水平与文本特征。

如果后续正式进入 Agent 阶段，需要先明确结束或修改当前范围冻结，并同步更新产品规范、实施计划、ADR、测试和内容工作流。

## 3. 测试作文题目

> The best way to provide enough homes in large cities is to build tall apartment blocks. To what extent do you agree or disagree with this statement? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.

## 4. 审题示范

### 4.1 题目真正要求判断什么

题目不是简单询问“高层住宅是否有用”，而是要求判断：

> 建造高层公寓是不是在大城市提供足够住房的 **最佳办法**。

决定全文方向的限定词是 `the best way`。学生即使承认高层住宅有效，也仍然可以反对它是唯一或整体上最好的方案。

### 4.2 本次选择的立场

采用“部分同意”立场：

> 在土地紧缺、人口密集的大城市，高层住宅是重要且往往必要的办法；但它只能解决住房数量问题的一部分。更好的政策应同时包含区域发展、空置建筑改造、可负担住房要求和公共交通投资。

这个立场适合本次测试，因为它能够自然调用库内的让步、权衡、机制解释和解决方案语言，而不需要为了使用素材而歪曲观点。

### 4.3 论证链

支持高层住宅：

```text
城市土地有限
→ 同一块土地可以容纳更多家庭
→ 增加住房供应
→ 有助于缓解房价和租金压力
→ 更多居民可以住在工作地点和公共交通附近
```

指出局限：

```text
人口在少数大型项目中过度集中
→ 道路、学校、医院和公共空间承受额外压力
→ 高层公共设施带来维护费用
→ 住房数量增加不一定等于生活质量提高
```

提出组合方案：

```text
发展较小城镇和外围中心
+ 将部分产业与就业移出核心城市
+ 改造合适的空置办公楼
+ 要求大型项目包含可负担住房
+ 投资公共交通
→ 在增加供应的同时减轻大城市压力
```

## 5. 教师式引导流程

理想的智能体不应在第一步直接展示完整范文，而应让学生逐步作出决定和产出语言。

### 第一步：圈出决定立场的词

教师提问：

> 题目中哪个词使“高层住宅有用”不足以构成完整回答？

期望学生发现：`the best way`。

### 第二步：让学生选择立场

教师可以提供三个清晰选项，但不替学生决定：

1. 完全同意：高层住宅总体上是最佳方案；
2. 部分同意：高层住宅必要，但必须配合其他措施；
3. 基本不同意：其他方案更有效或更可持续。

本次人工原型选择第二项。

### 第三步：先让学生说内容，不急于追求英文

教师依次追问：

1. 为什么高楼能增加住房？
2. 住房供应增加可能怎样影响租金？
3. 人口集中可能给哪些公共服务造成压力？
4. 除了高楼，还有什么办法？

只有在学生产生基本内容后，系统才检索可用语言资产。这样可以避免“先看到高级句型，再为句型编观点”。

### 第四步：按论证功能调用正式语料

本题优先检索：

- `concession`：有限承认；
- `state_position`：表明立场；
- `explain_mechanism`：解释作用机制；
- `compare_or_weigh`：比较收益与代价；
- `propose_solution`：提出组合方案；
- `qualify_claim`：限制过强结论。

检索时不能只使用 `cities_housing_transport` 主题标签。一个来自游戏、乡村生活或独居话题的自然结构，只要论证功能合适，也可以迁移到住房题。

### 第五步：渐进式提示

下面四句可以作为第一轮学生练习。智能体应先隐藏答案，并按需要逐级给提示。

1. 立场句：

   > While I accept that ________, I believe that ________.

2. 价格机制句：

   > From the financial point of view, a shortage of ________ is likely to push up ________.

3. 转折句：

   > However, providing more ________ is not the same as creating ________.

4. 替代方案句：

   > A further option would be to ________, in order to reduce pressure on ________.

建议的提示层级：

```text
只给中文意思
→ 给非考点关键词
→ 给学生学过的目标表达名称
→ 给句子骨架
→ 最后才展示完整参考答案
```

### 第六步：组段而不是拼句

每个主体段至少需要完成一个完整推进：

```text
段落主张
→ 为什么
→ 怎样发生
→ 结果或例子
→ 必要时加限制
```

库内句子只能承担其中某个论证动作，不能自动替代整段逻辑。

## 6. 本次调用的正式语言资产

### 6.1 句子卡

| Card ID | 来源 | 库内骨架或原句 | 本题用途 |
|---|---|---|---|
| `32e7fe21-e97e-5ac3-a5b0-fc9e2763abf6` | Video games: benefits and drawbacks | `While I accept that {concession}, I believe that {main_claim}.` | 引言中有限承认高层住宅的必要性，再否定其为完整方案 |
| `0ce13c63-10ff-5163-8cfd-9b9a174ad918` | Illusions of Pastoral Peace | `{positive_indicator} is only part of the picture.` | 限制“高层住宅解决全部问题”的结论 |
| `934be959-cfa7-5b6f-ae39-95ad62e27a51` | The rise in one-person households | `From the {dimension} point of view, a rise in demand for {resource} is likely to push up {prices}.` | 迁移为住房短缺对房价和租金的影响 |
| `519ce1be-b51f-509c-aaf4-050882cc37d3` | City problems and government solutions | `A further option would be to {policy}, by {mechanism}, in order to {goal}.` | 提出发展较小城镇和外围中心的替代方案 |
| `939103a2-8a9a-5f32-832e-0d869250df08` | Can stricter punishments improve road safety? | `{actor} could reduce {problem} by investing in {service} ...` | 提出地方政府投资公共交通 |

### 6.2 Core 表达

| Collocation ID | 表达 | 本题中的使用方式 |
|---|---|---|
| `b98ee4ff-9f1b-58a1-8881-a83e66769fdb` | `only part of the picture` | 原样使用 |
| `c0acbd87-94c8-5a62-bf15-282258a7d492` | `affordable housing` | 原样使用 |
| `abcd3978-35aa-5f1e-adac-db68bde7f1bc` | `be faced with rising costs` | 迁移为 `be faced with rising service charges` |
| `f11f7926-55e4-59ca-965c-eaf051747080` | `a range of measures` | 原样使用 |
| `4e666b50-4fb1-5fbc-9ab0-b34e22f7f870` | `implement a range of measures` | 用其语义和搭配边界构造组合政策段 |
| `fcfaca52-7a72-5634-80c2-9b7fc6a2c02b` | `reduce pressure on` | 原样迁移为 `reduce pressure on major cities` |

此外，`push up property prices`、`enhance quality of life` 等已批准表达参与了检索和规划，但最终成文没有为了提高使用数量而机械塞入所有候选。

## 7. 完整示范作文

字数：334 词。

> It is often argued that constructing tall apartment blocks is the most effective way to meet housing demand in major cities. While I accept that such developments are necessary where land is scarce, I believe that they are only part of the picture and should be combined with other measures.
>
> The main advantage of high-rise housing is that it makes efficient use of limited urban land. A thirty-storey building can accommodate far more households than low-rise houses on the same site. This lets more people live near jobs and public transport instead of moving to distant suburbs. From the financial point of view, a shortage of housing is likely to push up property prices and rents. Increasing the supply of apartments can therefore make affordable housing more widely available, although the outcome will depend on local demand.
>
> However, providing more units is not the same as creating a good place to live. Large concentrations of residents can put additional pressure on roads, schools, hospitals and public spaces. Residents may also be faced with rising service charges because lifts and shared facilities in tall buildings are expensive to maintain. If these developments are poorly designed, cities may gain housing at the cost of overcrowding and a lower quality of life.
>
> A better policy would therefore involve a range of measures. A further option would be to develop smaller towns and outer urban centres by moving some industries and jobs there, in order to reduce pressure on major cities. Local councils could also convert suitable empty offices into homes, require large developments to include affordable housing, and invest in better public transport. Together, these policies would increase housing supply without relying entirely on high-rise construction.
>
> In conclusion, tall apartment blocks are a practical and often necessary response to housing shortages in densely populated cities. Nevertheless, they are not the single best solution; a balanced policy combining high-rise development with regional planning and transport investment is more likely to provide enough homes while maintaining acceptable living conditions.

## 8. 库内内容占比分析

“来自库里的比例”必须先定义口径，否则同一个结果可能被描述为 15%，也可能被描述为 30%。

| 口径 | 本次估算 | 解释 |
|---|---:|---|
| 原样短语和固定骨架占全文词数 | 约 15%–18% | 只计算能明确标回正式卡或 Core 表达的固定部分 |
| 加上基于库内 pattern 完成的换主题句 | 约 28%–32% | 把整个受控迁移句视为库内学习成果的激活 |
| 观点与论证内容来自现有库 | 约 10%–15% | 现有库没有系统覆盖高层住宅的土地、维护成本和规划逻辑 |
| 新补逻辑与基础语言 | 约 68%–72% | 为完成题目而新增的内容和自然衔接 |

因此，本次可以概括为：

> 库内语言驱动约 30%，新补逻辑与基础语言约 70%。

这不是精确的文本相似度结果，而是产品研究中的功能归因。若强行将库内比例提高到 50% 以上，当前语料条件下容易出现为句型编观点、段落重复或表达生硬的问题。

### 不建议把“全文库内词数占比”作为主要成功指标

更有教学价值的指标包括：

1. **激活数量**：本篇成功调用了多少条学生已经学过的资产；
2. **独立产出率**：学生在多少次提示前就能主动写出目标表达；
3. **论证覆盖**：每个主体段是否至少有一项已学资产承担真实论证功能；
4. **自然度通过率**：迁移句能否通过独立 native-naturalness check；
5. **跨作文覆盖率**：在多篇作文中逐步覆盖已学库，而不是一篇作文强塞全部内容；
6. **学生所有权**：最终观点和句子有多少由学生先产出，而不是由智能体直接提供；
7. **可追溯性**：每个被建议的表达能否返回学习卡、来源原句和学生掌握记录。

## 9. 本次发现的主要缺失

### 9.1 审题能力缺失

当前库能按题型和主题存储素材，但不会主动识别：

- `best`、`only`、`all`、`more important` 等强限定；
- 题目究竟要求评价手段、结果、程度还是双方观点；
- 学生是否回应了 `to what extent`；
- 文章是否在讨论“提供足够住房”，而不是泛泛讨论住高楼的利弊。

### 9.2 内容知识与观点生成不足

现有语料可以提供 `affordable housing`、`reduce pressure on` 等语言，但没有形成可复用的主题知识网络。本题至少需要以下内容节点：

- 土地稀缺与垂直开发；
- 住房供应、需求、房价和租金之间的关系；
- 高密度居住对学校、医院、道路和公共空间的影响；
- 高层建筑的维护成本；
- 就业和人口的区域分布；
- 空置建筑改造和保障性住房要求。

需要进一步决定：这些知识由人工策划的 topic idea bank 提供，还是由运行时模型生成后接受事实与逻辑检查。

### 9.3 逻辑教学不足

句子卡提供单句结构，但目前没有显式教授：

- claim → reason → mechanism → result；
- concession → qualification → final position；
- 问题 → 原因 → 对应解决方案；
- 如何判断两个句子只是并列，还是构成真正的因果推进；
- 如何发现观点跳跃、循环论证和不受支持的结论。

未来需要独立的“论证动作”和“段落状态”，不能把若干 structure cards 顺序排列后称为段落。

### 9.4 缺少学生个人能力模型

“学生自己的基础”目前没有数据结构。系统还不知道：

- 哪些词和句型学生能独立使用；
- 哪些内容只会 Recall，尚不能 Use；
- 哪些表达刚学过，适合本篇强化；
- 哪些表达已经过度使用；
- 学生常见的语法、搭配和逻辑问题；
- 学生在没有提示、轻提示和完整骨架下分别能做到什么。

没有这层模型，智能体只能从整个库选“看起来适合”的内容，不能真正做到个性化教学。

### 9.5 检索目标不完整

未来检索至少需要同时考虑：

```text
题目主题
+ 题型与当前论证动作
+ 学生学习状态
+ 迁移难度
+ 现代英语自然度
+ 与本段已有内容的兼容性
+ 本篇已使用次数
```

只按关键词检索会遗漏跨话题可迁移结构；只按主题检索则会给出许多与当前段落动作无关的表达。

### 9.6 缺少素材取舍机制

本次城市主题共有 23 张相关句子卡和 46 条相关 Core 表达，但真正进入作文的只有一小部分。智能体必须能够解释：

- 为什么推荐某一项；
- 为什么另一个看似相关的表达不适合当前观点；
- 为什么不能为了提高库内占比而强行使用；
- 两个结构若功能重复，应保留哪一个。

“使用所有句子和短语”更适合解释为长期覆盖目标，而不是单篇作文目标。

### 9.7 迁移后的自然度与语义检查

现有规则已经要求所有仿写通过独立 native-naturalness check。Agent 阶段还需要检查：

- 替换后的名词与动词是否形成自然搭配；
- 句子虽然自然，是否真的支持当前观点；
- 限定词是否足够，是否把“可能”写成“一定”；
- 多个库内句子拼在一起是否重复；
- 是否为了保留原 pattern 牺牲了更自然的表达。

### 9.8 教学交互状态缺失

真正的课外老师会记住学生已经完成到哪一步。未来产品至少需要区分：

```text
尚未审题
→ 已选立场
→ 已产生观点
→ 已形成段落逻辑
→ 正在独立写句
→ 正在接受提示
→ 已完成草稿
→ 正在复盘已激活资产
```

如果没有明确状态，运行时对话容易反复解释、过早给答案，或者在学生卡住时不知道应给哪一级提示。

### 9.9 目标分数与自动评分之间的边界

“帮助学生达到 6.5–7.0”不等于系统可以可靠地自动给出 Band 分数。可以先做：

- 任务是否完整回应；
- 立场是否一致；
- 每段是否存在基本展开；
- 是否成功使用目标句型或表达；
- 确定性的语法与拼写检查；
- 人工定义的段落检查清单。

若以后加入开放式作文评价或自动评分，需要单独验证可靠性、解释方式和误导风险，并通过新的范围决策，不能从当前练习功能自然外推。

## 10. 建议讨论的最小 Agent 体验

第一版不必尝试成为完整 IELTS 老师，可以只做一次受控写作会话：

1. 用户输入一道 Task 2 题；
2. 系统识别题型、主题和关键限定词，要求用户确认；
3. 用户选择立场；
4. 系统通过中文追问帮助用户产出 2–3 个观点；
5. 系统把观点整理为可编辑的因果链；
6. 每个论证动作只推荐少量已学资产，并说明推荐原因；
7. 用户先独立写句；
8. 用户卡住时按层级获得提示；
9. 系统帮助组段，但保留用户原句和修改记录；
10. 完成后展示本篇激活了哪些已学资产、哪些仍依赖完整提示；
11. 新生成的迁移内容保持 candidate，不直接进入正式语料库。

一个重要原则是：

> Agent 的首要目标应是提高学生的独立产出能力，而不是提高作文中由 Agent 提供的语言比例。

## 11. 建议与 GPT 继续讨论的问题

1. 审题模块应该采用固定规则、题型模板，还是运行时模型判断？
2. 主题知识应建立人工审核的 idea bank，还是允许模型按题生成？
3. 怎样表示学生的“个人基础”和不同提示层级下的真实能力？
4. 检索排序中，主题匹配、论证功能、掌握状态和自然度应该如何加权？
5. 一篇作文推荐多少张句子卡和多少条 Collocation 最合适？
6. 如何让学生先产生内容，又不因缺少背景知识而长时间卡住？
7. 如何记录从学生原句到最终句子的修改链，避免 Agent 直接接管写作？
8. 如何衡量长期语料覆盖，而不鼓励单篇作文堆砌表达？
9. 在不做自动 Band 评分的前提下，怎样给出有用、可靠且可解释的写作反馈？
10. 当前第一阶段约束需要怎样正式变更，才可以安全进入运行时 Agent 实验？

## 12. 本次结论

本次人工原型证明：现有句子卡和 Core 表达已经能够为一篇新题作文提供有价值的语言支架，尤其适合立场、让步、机制解释和提出方案。但库本身还不能完成审题、观点生成、因果组织和个性化教学。

现阶段最准确的产品判断是：

> MimicLoop 已经拥有可供智能体调用的“语言资产层”，但尚未拥有“任务理解层”“内容与逻辑层”“学生能力层”和“教学对话层”。

下一步优化不应只是扩大语料或提高拼装比例，而应先定义这四层怎样协作，以及哪些判断必须经过人工策划、确定性规则或新的审核流程。
