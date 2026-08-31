# Phase 2.5C Fresh-User UX Review — 2026-08-30

- Review protocol：`Fresh-User UX Review Agent v1`
- 状态：Cold-start pass completed；full AI path incomplete
- 数据：`data/mimicloop.db` 的隔离副本
- 页面：独立 3100 端口；未写入个人正式数据库
- Persona：高中英语基础较好、语法通常正确，但词汇和句式丰富度不足的 IELTS learner

## 1. Verdict

Reviewer 原始结论为“当前无法完成”。该结论只适用于本次实际路径：Reviewer 完成页面理解、两个节点输入、两级提示、三次提交、刷新和节点切换，但因隔离服务当时无法访问 DeepSeek，未能通过节点或进入 Paragraph Weaving。

Primary Agent 复核后必须区分：

- 三次 `PROVIDER_NETWORK_ERROR` 来自首次隔离服务的网络权限，不足以证明用户正常运行的 3000 服务也存在相同故障；
- failed node attempts 的 learner text 实际已 append-only 写入隔离 SQLite，因此不是数据库事实完全丢失；
- 页面刷新后没有恢复该文本，却仍向用户承诺“draft has been saved and remains editable”，属于真实的恢复与状态表达缺口；
- 网络权限修复后，Reviewer 无法重新取得 in-app browser 控制权，第二轮没有产生新的产品结论。

## 2. Reviewer 使用的英语画像与输入

Reviewer 没有写成高级范文，也没有故意制造低级语法错误。

Main point：

> Wildlife protection also protects the natural systems that people need for a safe and healthy life.

Reason：

> This is because humans and animals depend on the same land, water and climate, so damage to wildlife can also weaken the environment that supports human life.

两个输入符合目标 persona：意思清楚、语法基本可靠、词汇常见、句式变化有限，逻辑关系可理解但仍有语言提升空间。

## 3. Cold-start timeline

1. Reviewer 能理解页面用于把已保存论证链逐节点转成自己的英文，并预期最终形成 Body Paragraph。
2. 启动后节点工作区已在长页面下方出现，但视口仍停在题目与文章地图；Reviewer 需要自行寻找当前任务。
3. Main point 的 Level 1 / 2 推荐为反驳型 rhetorical move：`there is no compelling reason why`。Reviewer 认为它不适合当前“生态相互依赖”中心句，因此没有采用。
4. Reviewer 提交自己的 Main point。页面显示 DeepSeek 不可达，并声称 draft 已保存且仍可编辑。
5. 刷新后输入框为空、已展开提示重置，只留下 revised-node 状态。数据库中 learner text 仍存在，但页面没有恢复。
6. 切换 Reason 后，Main point 的错误提示仍显示在空的 Reason 编辑区下方。
7. Reason 的提示加入“多数科学家都认同”这一原论证链不存在的证据性主张。Reviewer 判断它已经越过纯语言帮助边界。

## 4. Findings

### Major — failed attempt 没有恢复到编辑器

- 观察：失败 attempt 的 learner text 已保存在 SQLite；刷新后的输入框为空。
- 影响：用户虽然没有发生数据库级永久丢失，却无法从页面继续编辑已保存内容，体验等同于输入丢失。
- 当前边界：实施计划原本只承认“纯 reveal 未提交不持久化”；本次是已经正式提交并生成 attempt 的文本，不能由该已知限制解释。

### Major — 错误状态跨节点显示

- 观察：切换到尚未提交的 Reason 后，仍显示上一 Main point 的 “Your node draft has been saved” 错误。
- 影响：用户不能判断错误、保存状态和重试动作属于哪个节点。

### Reviewer product objection — Reason 提示加入常识性权威包装

- 观察：提示加入“多数科学家都认同”。
- Reviewer 原判断：这可能把“帮助表达 learner-owned reason”变成“补充原论证链不存在的事实或权威背书”。
- Product Owner 决定：本例可接受，不列为缺陷或待修项。IELTS Task 2 不是学术论文，允许用不改变原论点的常识性概括或一般性权威包装支撑表达，例如用科学界普遍认知引出温室效应正在增强。
- 产品边界：可以增加 broadly plausible、非具体、服务于同一节点的常识性背景；不得借此加入新的主体论点、精确统计、虚构研究或机构、无法从常识合理支持的强因果结论。该表达仍是可选语料，不能强迫 learner 使用。

### Product objection — Main point 首选结构功能错位

- 观察：当前中心句得到 `there is no compelling reason why`。
- 影响：它更适合反驳某项判断，而不是直接陈述当前段落的生态依赖中心理由。
- 需要人工决策：这进一步说明“句子/结构成为 primary”仍需可靠的节点功能适配，而不只是资产类型正确。

### Friction — 工作区出现后没有定位当前任务

- 观察：Start / Continue 状态变化后，长页面没有带用户进入下方节点编辑区。
- 影响：新用户可能以为操作没有生效。

## 5. What worked

- 题目、题型要求和文章地图清楚；
- Main point / Reason / Development / Takeaway 的职责比空白编辑器更能约束逻辑；
- 输入为空时检查按钮禁用，输入后启用；
- 提示逐级展开，没有一开始暴露整段答案；
- 已学与库内新语料标签清晰；
- AI 失败后当前页面没有立即清空输入；
- 节点可以切换，页面没有自动生成整段或预测 Band。

## 6. 产品价值初步判断

Reviewer 认为设计方向比直接空白写段落更有学习价值：节点职责能帮助逻辑推进，渐进语料有机会改善普通词汇与简单句式。但当前尚不能宣布完整闭环成立，因为：

1. failed attempt 无法在刷新后恢复到编辑器；
2. 错误状态没有按节点隔离；
3. Main point 的真实提示出现节点功能错位；Reason 的常识性权威包装经 Product Owner 复核判定可接受；
4. 尚未真实到达 Paragraph Weaving 与 Logic / Language 分开评价。

## 7. 下一轮

下一轮仍使用隔离数据库与目标 persona，但须重新建立 Reviewer 可控制的 in-app browser 会话，并从可访问 DeepSeek 的服务启动。第一轮报告冻结，不因后续成功路径删除本轮困惑。

下一轮目标：完成四个节点，进入 Paragraph Weaving，提交一次 learner-owned 段落，并单独审查 Logic / Language 反馈是否适合这一真实英语水平。

## 8. Confirmed-finding resolution

- Implemented：页面恢复每个节点最新正式 attempt 的 learner text 与已提交 hint level，包括 provider 失败记录；不再只恢复 `pass`。
- Implemented：提交与恢复消息按节点保存，切换节点不再显示上一节点的错误。
- Implemented：primary sentence asset 增加节点角色冲突过滤，并只用可迁移结构本身的固定关系词检查最小语义重合；来源例句中的 `animals` 等主题词不再使 `ban ... until alternatives ...` 误过门槛。
- Verified by read-only live retrieval：当前 Main point 与 Reviewer 草稿返回 `NO CORPUS FIT`，而不是先后推荐 `there is no compelling reason why` 或动物实验 ban frame。
- Browser verified：生产构建后刷新隔离页面，Main point 恢复 Reviewer 的完整 learner text、正式 hint level 与节点专属重试信息；切换 Reason 后 Main point 错误不再显示，未提交的 Reason 输入仍不冒充已保存事实。
- Browser verified：当前 Main point 首选区显示 `NO CORPUS FIT`，没有回退到 `there is no compelling reason why` 或 `ban ... until alternatives ...`。
- Pending：可访问 DeepSeek 的四节点完整 Fresh-User Reviewer 路径。

## 9. Full cold-start pass

- 状态：2026-08-30 完成；Reviewer 原始结论为“有条件通过”。
- 数据：第二份隔离数据库；独立 3200 端口；没有写入个人正式数据库。
- 模型路径：四次节点检查与一次 Paragraph Weaving 均可访问 DeepSeek，单次节点反馈约 2–3 秒，没有 provider fallback。
- 审查环境限制：子 Agent 可以在 IAB 中点击、输入、刷新、截图和 `markDeliverable`，但不能把标签设为主线程可见；该限制不计为产品缺陷。

Reviewer 实际提交：

Main point：

> Wildlife protection is not a waste of money because humans and animals depend on the same natural environment.

Reason：

> This is because people share air, water and land with wildlife, so harm to animals can also damage the environment around us.

Development：

> If the number of some wild animals falls, the food chain may be broken, and this can make the whole ecosystem less stable.

Takeaway：

> For this reason, money spent on wildlife protection also supports human well-being and should not be seen as a waste.

Paragraph Weaving 最终提交（74 词）：

> Wildlife protection is not a waste of money because humans and animals rely on the same natural environment. We share air, water and land with wildlife, so damage to animal populations can also affect the places where we live. For example, if the number of some wild animals falls, food chains may be disrupted and the whole ecosystem can become less stable. Therefore, resources used for wildlife protection also help to protect human well-being.

### Verified value

- 四节点职责使 Reviewer 补出了 `shared environment → ecological disruption → human well-being` 的中间关系，优于直接面对空白段落；
- Hint 0 可以直接独立作答，`NO CORPUS FIT` 没有为了使用率强塞表达；
- Paragraph Weaving 只机械拼接 learner-owned 节点，再由 Reviewer 自己从 83 词改成 74 词，没有发生整段代写；
- 最终 Logic / Language 视觉和数据上分开，正式输入与反馈在刷新后没有丢失。

### Confirmed product findings

1. **Major — 当前节点恢复不完整。** Main point 通过后已自动进入 Reason，刷新后答案和反馈仍在，但交互节点回到 Main point。原因已定位为客户端固定从 `claim` 初始化、恢复 attempt 时没有重算首个未通过节点。
2. **Major — Takeaway primary 语料错配。** 推荐 `As {driver} increases, ... which ...` 的人口增长/废物句式。实际检索证据显示，它仅因同属环境主题、包含宽泛的 `describe_result`，并由普通关系词 `which` 产生一次伪语义重合而越过 primary 门槛。
3. **Medium — 最终 Language 反馈过于笼统。** 本次只肯定正式、清楚、可读，没有指出 `protection / protect` 的局部重复，也没有为“词汇与句式不丰富”的目标画像提供一个可执行观察。该项保留为产品设计问题，不自动要求模型为了挑错而挑错。
4. **Medium — 恢复任务入口偏长。** 已有进度仍从完整审题和 Essay Map 展示，真正继续入口在页面下方；阶段条、`Start in English` / `Continue` 与实际状态的关系不够直接。
5. **Medium — 本次语料增益弱。** 前三节点独立完成，Takeaway 唯一展开的 primary 又错配；本轮主要价值来自逻辑结构和 Paragraph Weaving，而不是语言资产激活。

### Reviewer strongest objection

Reviewer 提醒：左侧已经展示完整英文论证链时，learner 可能只是在近距离换写，而不是从自己的思路主动调取语言；如果语料推荐又不贴合、最终 Language 反馈只给肯定，产品可能更容易训练“通过检查”而非可迁移写作能力。这是需要 Product Owner 讨论的产品风险，不等同于已确认实现缺陷，也不自动推翻当前 learner-owned argument graph。

### Resolution after full pass

- Implemented：正式 attempt 恢复后按最新节点 verdict 重算首个未通过节点；四节点均通过但尚未保存 paragraph draft 时，刷新直接恢复 Paragraph Weaving 与 learner 节点拼接稿。
- Implemented：`which / who / where / while` 等普通关系词不再计入 primary 结构的最小语义重合，防止人口增长句式凭 `which` 成为动物保护 Takeaway 首选。
- Verified：规则单元测试 38 个文件、166 项通过；TypeScript 与生产构建通过；生产构建重启后的隔离页面刷新直接恢复 Paragraph Weaving、74 词 learner draft 和 Logic / Language 反馈；Takeaway 检索返回 `primaryAsset=null`、`NO CORPUS FIT`，仅保留可选搭配 `maintain the natural balance`。
- Pending：最终 Language 反馈是否需要在“没有真实错误”时仍给一个非强制的语言丰富度观察；恢复任务入口的信息层级；用户在个人真实页面的最终验收。
