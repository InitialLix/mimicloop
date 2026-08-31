# Native-naturalness 全库审计（2026-08-18）

- 状态：`approved_applied`
- 审核对象：157 条 Sentence Use / transfer examples；221 条 Collocation Use
- 审核方式：遮住来源原句，只判断参考答案本身是否像受教育母语者在现代正式写作中自然产出
- 当前处理：用户已于 2026-08-18 批准整批修改；修订已写回 approved seed 与 SQLite

## 结论

378 条参考答案已完成第一轮逐项阅读。其余未列出的项目在本轮视为可保留；这不表示它们是唯一写法，只表示没有达到“语法正确但自然度不足，必须退回”的门槛。

本轮发现的问题主要分为六类：

1. 动词与宾语或名词与介词并非典型搭配；
2. 单复数、可数性或指代虽然可解析，但母语者不会优先这样组织；
3. 为保留原句 pattern 造成冗长、重复或不必要的被动结构；
4. 迁移主题后逻辑链失效；
5. NCE 等来源中的文学性或旧式表达被误当成现代 IELTS 主动输出模板；
6. 中文题意本身带有翻译腔，诱导出不自然英文。

## Sentence Use：建议退回修改

| 卡片 ID | 问题 | 候选参考答案 |
|---|---|---|
| `4c57ddce-4151-5fe4-bc60-90e3b85b78f7` | 末尾 `when` 从句机械附着 | This kind of overwork can cause problems ranging from persistent fatigue to serious ill health, especially when people sacrifice rest to work longer hours. |
| `c32302d0-ea7c-5000-bc58-f971b91e0228` | gaps 不与 `cover` 自然搭配 | By funding training for shortage occupations, governments can help fill critical labour and skills gaps in essential services. |
| `a5aa0712-c50c-5dc9-9e64-cc7676238df1` | `more workers ... than workers ...` 模板感强 | If employers placed greater value on adaptability than on narrow technical expertise, they might prefer workers with broad problem-solving skills to those trained for a single task. |
| `2398dd45-ce3f-5679-9a01-e6df5b9b7700` | 强行保留强调式 `did help`，结果主语也不自然 | If local governments helped small businesses cover the cost of digitalisation, this could create jobs, raise productivity and increase tax revenue. |
| `8a890de8-ad30-59d2-b08b-1fa9ff4d984f` | `count on ... as much` 生硬 | Secure full-time jobs are becoming less common, so workers can no longer rely on a stable monthly income to the same extent. |
| `b5b83dce-1988-5f3c-846e-c5457d387ce2` | `join volunteering projects`、`unfamiliar people` 搭配不自然 | Young adults may choose to take part in long-term volunteer programmes rather than remain in familiar surroundings. Working with new people to solve practical problems can help them become more confident. |
| `3bf4d575-d2bd-539a-afa1-4be54d990189` | 小企业通常说 financially viable | If small businesses choose projects solely on the basis of public attention, they may struggle to remain financially viable. |
| `47cb32a0-3618-5aba-b384-7143221aa483` | `tend towards the viewpoint` 明显套模板 | While public surveillance can threaten privacy, I would still support the limited use of cameras in high-risk areas to improve security. |
| `46c73496-5a73-555f-9e70-9ada1c6a927e` | `necessary evil where ... are concerned` 在该语境刻意老派 | I support restricting private cars in historic centres, but emergency vehicles must still be allowed access. |
| `b25abf6a-d7c4-512b-bf8c-9bdc687f9390` | `delight in` 与 `it would appear that the act of` 过度书面化 | Residents often enjoy taking part in local festivals, and celebrating together can create a sense of belonging across age groups and backgrounds. |
| `30a941a1-8abf-50ee-9181-76681ece5767` | `proportion ... smaller` 与后半句组合机械 | If the proportion of fee-paying students falls, universities will receive less tuition income relative to the cost of running their courses. |
| `6d47d05e-d337-5c0e-860e-7fa08f62b150` | access 与 `much more difficult` 不如 limited 自然 | Access to specialist education was far more limited when distance learning relied solely on printed materials and radio broadcasts. |
| `c807759d-5d76-57b7-9efc-477f13e6c0b4` | `walking` 被描述为 easy to organise 不典型 | Although it requires little planning, walking in a local park is still a valuable form of exercise. |
| `17b39b8e-269d-5fd8-a21c-d384afe71e83` | `accelerate the advancement of employees` 生硬 | Unequal access to career mentoring can improve promotion prospects for employees in large offices while harming those of staff in smaller regional branches. |
| `2161555a-cd67-56d7-8e29-0355efff4538` | management posts 不能自然地“装入 candidates” | If a company decided to appoint equal numbers of internal and external candidates to management roles, it would need a sufficiently large pool of qualified applicants from both groups. |
| `45148b83-50ef-592d-842a-a1b4baa1ea39` | 宣传活动通常 inform 而非 teach citizens something | The aim of a public-information campaign should be to give citizens information they did not previously have. |
| `472d9154-7880-5486-9f65-bf1af775a89a` | `Making public decisions transparent` 不自然 | Ensuring transparency in public decision-making usually requires the evidence behind major policy choices to be published and explained, which can be done in various ways. |
| `412621a2-9508-511e-a015-d4d303b25a63` | `gain practical confidence` 不典型 | In terms of early career development, school-leavers who enter an apprenticeship rather than pursue a purely academic route may gain practical skills and confidence more quickly. |
| `f52a20db-6eeb-53c5-991a-f88133683c5f` | `vital connection with equal access` 是结构硬套 | Public transport does more than move people from place to place; it also plays a vital role in ensuring equal access to jobs and essential services. |
| `40d0799a-b361-5cc3-9d3e-3a19766c542a` | dummy `It may ... if governments` 不自然 | Governments may reduce public spending in the short term by postponing maintenance of ageing infrastructure, but this will increase safety risks and repair costs in the long term. |
| `2f680eff-ba5a-5bc7-bfa7-e8a3a06e2a5c` | 员工不能 `share workplace conditions` | Although job satisfaction is personal and difficult to measure, most employees need certain basic workplace conditions in order to experience it. |
| `4adea781-2456-500a-81c9-862965000c21` | benefits / its benefits 重复 | Regular exercise can provide a range of benefits, from greater physical energy to improved emotional stability, and people may experience these benefits in different ways. |
| `d6b2594d-d627-5908-b6cf-1524ea5b6d78` | `preconditions to achieving a process` 搭配不成立 | Although it is almost impossible to guarantee complete fairness in recruitment, most people would agree that certain basic conditions are needed to create a trustworthy process. |
| `31d3ee76-5a97-57e1-96b4-b866af4fa285` | belonging 不自然地 `found in activities` | A strong sense of belonging often develops through regular shared activities with neighbours, and few residents are content to live without meaningful social interaction. |
| `8d76f3a0-c2f8-503b-ac66-b7b6902dc4c0` | `hope that employers become` 与整个框架不够直接 | Regular workplace inspections should encourage employers to be more attentive and accountable and to correct safety failures more quickly. |
| `66a5b64a-cb8f-57ef-b046-953bed68fdee` | `mandatory guidance before loans` 含混 | It is vital to educate young adults before they take on substantial debt. Financial education could be provided in schools or through mandatory counselling before a large loan is approved. |
| `6c11ad46-33cf-541a-9d1d-fb11478e4471` | evacuation routes 不自然地被 `added` | Early-warning systems can alert residents, clearly marked evacuation routes can guide them away from danger, and regular emergency drills can prepare communities to respond quickly. |
| `615980cc-cea2-5729-bdaa-18553f972367` | services 的例项混入 equipment/staffing | The priority of a public hospital should be to maintain essential clinical capacity, including emergency care, adequate equipment and sufficient staff. |
| `d1a216a5-ab48-59f0-b6d7-57ad742c5a61` | concerns becoming irrelevant 语义不合 | If a school system cannot keep students safe or provide reliable basic teaching, debates about fashionable educational technology are beside the point. |
| `f15d70ed-10c6-5448-8f63-603421d1a7c9` | 不能自然地 through audits report honestly | Instead of hiding poor environmental performance by publishing selective data, large manufacturers should disclose their environmental impact honestly and submit their reports to independent public audit. |
| `eb752437-a79a-55c0-84de-b9e78a28679b` | examples、原因和比较对象混在同一层级 | Compared with smaller schools, large secondary schools may provide weaker peer support and make students feel more anonymous, increasing the risk of isolation and undetected bullying. |
| `519ce1be-b51f-509c-aaf4-050882cc37d3` | funding/courses 不自然地 `move beyond capital cities` | A further option would be to strengthen regional universities by directing more research funding and specialist courses to institutions outside capital cities, thereby reducing regional inequalities in education. |
| `a6989730-082d-5532-b9d2-7e5845c1765e` | `benefits for` / `costs for` 搭配机械 | The growth of remote work could improve flexibility while weakening workplace cohesion to a similar extent. |
| `461ee6ef-b680-5361-ae43-f18f9685112c` | 应为 meet deadlines | A student who completes a work placement will need to communicate with colleagues, meet deadlines and solve practical problems, all of which are valuable professional skills; wider access to structured work placements can therefore be seen as a positive development. |
| `629776ea-4656-5953-8de3-5fc0e6f7a3c0` | 不能 bear the weight of insurance/planning | Self-employed workers miss out on paid leave and administrative support, and they must manage income uncertainty while bearing the full cost of insurance and retirement planning. In this sense, the growth of insecure self-employment may be a negative development. |
| `934be959-cfa7-5b6f-ae39-95ad62e27a51` | 学校名额需求与私人辅导成本没有可靠因果链 | Rising demand for places at prestigious private schools is likely to push up tuition fees. |
| `f2f33ee9-fe37-5058-9a4b-cb5d4433905e` | residents 不自然地 face pressure on services | While rapid tourism growth may benefit hotel owners and tour operators, local residents, including low-income tenants, may face higher rents and greater strain on public services. |
| `9b91499e-cf46-5266-b45a-e3e3aec4de6d` | 应为 dispel the misconception | Clear public data can dispel the misconception that renewable energy is always unreliable. |
| `cce55d88-a661-5149-a171-de0c92c92268` | 不会现场演示一个正在发生的真实攻击 | While busy employees may ignore generic cybersecurity warnings, many would be keen to attend a live demonstration showing how a real cyberattack unfolds. |
| `f35e3f6f-9589-537b-bd27-96fe8a10fdda` | `personal and emotionally direct nature` 搭配生硬 | First-hand accounts of medical errors are personal and emotionally direct, so they are likely to have a powerful impact on hospital managers. |
| `984ba355-94cf-5032-931f-521f04d0b6c0` | turned lives around after recovering 语义重复 | People who have rebuilt their lives after long-term debt could teach young adults how to avoid harmful borrowing. |
| `881343c0-72a1-5798-8f11-04c108ca7484` | employers 不自然地 support schedules | Some employers maintain rigid office schedules that seem incompatible with the needs of employees with caring responsibilities. |
| `73240a91-6dfa-5c4c-a66b-69e39051753b` | `master one narrow specialism` 搭配不典型 | In the past, university students were often advised to train in a narrowly defined technical field, but today’s graduates expect greater flexibility and variety from their careers. |
| `527182d4-a2c8-5afe-bd80-37f1e12d782d` | disparity 更偏不平等，不适合一般态度差异 | Perhaps the greatest difference between urban and rural residents lies in their attitudes towards expanding public transport. |
| `e08f236a-8d13-5948-9821-999f28b6ba47` | `lead less isolated lives` 不自然 | Residents of large apartment blocks would feel safer and less isolated if they had a stronger sense of responsibility towards their neighbours. |
| `0af9af95-37e0-504b-b70b-d99940f26626` | 迁移后双重否定显得刻意老派 | Even people with little interest in climate change are likely to have noticed that extreme weather has become more frequent in recent years. |
| `0df67bb3-f952-5d6c-a88a-c675dfbaf25d` | `pressures ... are such that` 是明显套用旧式骨架 | Pressure in urban housing markets has become so intense that many young people can no longer afford to buy a home. |

Sentence Use 本轮共有 **47 条**建议退回修改。批准修订时必须同步更新对应中文题干、英文 hints、`transfer_example`（适用时）和内容 revision，不能只替换参考答案。

## Collocation Use：建议退回修改

| Collocation ID / 目标 | 问题 | 候选参考答案或处置 |
|---|---|---|
| `3a1523a2-b19b-5eaf-a726-5380e93962ce` / `a credible source of information` | 复数 websites 与 singular source 不协调 | A government public-health website is usually a credible source of information. |
| `ce2d09d7-3dc9-52c3-ae31-71560adaeb37` / `a necessary evil` | 当前应急车辆语境强行套评价短语 | Demote this Use item; replace it with a context in which an unpleasant but unavoidable policy is genuinely being weighed. |
| `c3d1b6c2-c326-580d-8cd8-670390c7c7c4` / `a preferred area of study` | choose preferred 冗余 | For many students, computing is a preferred area of study because it offers strong employment prospects. |
| `6df8af48-5583-5493-a3a6-31447290f4b8` / `a productive working life` | maintain a working life 不典型 | Lifelong learning can help people enjoy a productive working life for longer. |
| `f3f62d75-d893-519d-a868-1bcf0e470cc1` / `a proportion of profits` | 原例缺少所有格限定；最终换成自然的无所有格语境 | A proportion of profits from publicly funded projects should be reinvested in employee training. |
| `4e78e474-bfe5-5125-8d2b-78b3e947efab` / `a rise in demand for` | 私校名额与辅导成本因果不成立 | A rise in demand for places at prestigious private schools is likely to push up tuition fees. |
| `34291088-b154-5e4a-a7af-8dba3220915d` / `a risk of insufficient funding for` | operation of community shelters 过度名词化 | A sharp fall in donations would create a risk of insufficient funding for community shelters. |
| `56e4432a-c5f9-5b22-89fb-ac6d9554da5c` / `a shortsighted view` | `X is a view` 不如 reflects natural | Focusing only on the project’s initial cost reflects a shortsighted view. |
| `02e1087e-0363-5024-882a-1f38e13a34c7` / `act as a deterrent` | companies 重复且 meaning 从句不自然 | Penalties for illegal dumping can act as a deterrent by making companies less likely to repeat the offence. |
| `193fe72d-0013-5f2b-953a-a85d6b3aa921` / `aim for equal proportions` | mechanically 的位置和整体表达生硬 | Recruitment panels should not aim for equal proportions of men and women at the expense of selecting the strongest candidates. |
| `d8a4022a-dfb6-5c10-8a1d-6b179050aa84` / `be free from anxieties` | 复数 anxieties 只适合多种具体忧虑 | Retirees with adequate savings may be free from anxieties about meeting their basic expenses. 已降为 supporting，并补充现代常用表达说明。 |
| `8252594c-8996-57c2-b394-b6fc0a64a15e` / `bear the weight of` | insurance/planning 不能直接作 weight 的并列对象 | Self-employed workers must manage income uncertainty while bearing the full cost of insurance and retirement planning. |
| `b2822d0b-c050-5a90-a1b2-2decc1d2e927` / `become involved in crime` | 原 risk 从句不自然 | Without stable employment, some young people may become involved in crime. |
| `209db801-8418-5d78-a879-fe21392161d4` / `cannot have failed to notice` | 正式且强调意味很强，不宜作为默认表达 | Regular commuters cannot have failed to notice that fares have risen sharply in recent months. 已降为 supporting，并提示一般写作优先使用 `are likely to have noticed`。 |
| `013dfc34-f91e-5e4d-9bb2-c8672db61fc7` / `contribute to the economy` | 原对象展开破坏了目标搭配边界 | International students contribute to the economy through their spending on housing, transport and local services. |
| `6e521974-1afa-51e2-a846-72f3cd0540ba` / `count on` | `count on ... as much` 生硬 | As secure full-time jobs become less common, workers can no longer count on receiving a stable monthly income. |
| `882ab567-ea8f-5aea-ba46-7aad575c4a97` / `curb the traffic problem` | 比 `curb traffic congestion` 宽泛 | A congestion charge can help to curb the traffic problem in densely populated city centres. 已降为 supporting，并提示优先使用更精确的表达。 |
| `3f8d73c9-188a-55b9-92d1-f70d2e234081` / `encourage the extinction of` | 只适用于行为或政策主动助长灭绝 | A policy that rewards the killing of endangered animals would effectively encourage the extinction of those species. 保持 supporting，并补充使用边界。 |
| `4862db08-4eb3-5dc1-a083-37fe05c544fd` / `freedom from care` | 文学性、旧式，不宜作为现代 IELTS 优先表达 | Some people romanticise a simple rural life as offering freedom from care. 保持 supporting，并明确只用于来源识别和文学语境。 |
| `efef0e16-8cd6-5543-8905-3619ecb26b6e` / `fulfil basic needs` | 原题主语与动作关系生硬 | Affordable housing and accessible healthcare help to fulfil basic needs in low-income communities. 同时注明一般语境中 `meet basic needs` 更常见。 |
| `c4aa0ad0-65a8-5fba-a707-7a2323812e1d` / `harm the prospects of` | 前半句 accelerate advancement 生硬 | Unequal access to career mentoring may improve promotion prospects for employees in large offices but harm the prospects of staff in smaller regional branches. |
| `705be317-eb4e-5c63-a949-20973e44a458` / `have a powerful impact` | 修饰 `nature` 的搭配生硬 | First-hand accounts of medical errors are personal and emotionally direct, so they are likely to have a powerful impact on hospital managers. |
| `4946effb-24a3-5d10-b084-87be30254ea2` / `have the right to` | receive an education 不如 right to an education | All children have the right to a safe, high-quality education. |
| `b1ef75b4-4261-5b50-b51f-92008b06591a` / `in equal measure` | benefits for / costs for 搭配不自然 | Remote work may improve flexibility and weaken workplace cohesion in equal measure. |
| `8210b648-db31-5780-a378-8319aca67ae0` / `job satisfaction` | 员工不能 share conditions | Although job satisfaction is personal and difficult to measure, most employees need certain basic workplace conditions in order to experience it. |
| `1821a3d3-4bd7-5555-af33-c4e6a9dc3f95` / `on a volunteer basis` | managed by people 冗余 | Many community sports clubs are run on a volunteer basis. |
| `2f4724e9-44fe-556f-9f5d-abc1dbe1a7e9` / `pay a mortgage` | 房价上涨与既有月供之间因果不准确 | High borrowing costs make it difficult for many young families to pay a mortgage. |
| `9bc9cf92-d653-5459-895c-574ddaa15810` / `quality of life` | provide 列表后再接 and therefore a quality 不平行 | Flexible working arrangements can provide greater autonomy, lower commuting costs and more time with family, thereby improving many employees’ quality of life. |
| `b3eaff3d-2afe-55eb-93a3-4f5afff51c93` / `rich cultural diversity` | bring diversity to cities 可接受但不够典型 | Immigration can contribute to the rich cultural diversity of large cities. |
| `06973671-7d93-5246-b81e-0eec9b6eccff` / `sacrifice human dignity` | 原句在人称对象后仍强行使用抽象 human dignity | A welfare system should never sacrifice human dignity for administrative convenience. |
| `47863a3b-5ab1-5e8f-b0fa-fdcc3d62a72f` / `take pleasure in` | continue with sports 生硬 | Children who take pleasure in sport are more likely to remain physically active. |
| `45aa55f2-59e9-569c-8df3-39b2c58ec677` / `take steps to tackle` | graduates 有 skills gaps，劳动力市场才有 shortages | Universities must take steps to tackle skills gaps among graduates. |
| `c67c0d66-74a3-53a9-82f7-9a193293460a` / `use accounting loopholes` | avoid a fair level of tax 不自然 | Multinational companies should not use accounting loopholes to avoid paying their fair share of tax. |
| `3eb37c58-cd54-5ebc-97ab-068cda6c49c8` / `with the sole aim of` | improve position in rankings 冗长 | Public universities should not be run with the sole aim of improving their rankings; they have a wider role to play in the national education system. |

Collocation Use 本轮共有 **34 条**退回修改。6 条 canonical 复核项已经处理：5 条保留来源事实但降为 `supporting` 并增加使用边界，`fulfil basic needs` 保持 core 但明确提示一般语境中 `meet basic needs` 更常见。

## 应用记录

1. 用户于 2026-08-18 批准整批修订；
2. `scripts/apply-native-naturalness-audit.mjs` 已同步更新中文题干、hints、reference answer、transfer example、内容 revision 与审核历史；
3. 页面抽查发现部分自然化答案仍显示来源旧骨架；相关 Sentence Use 已增加独立 `feedback_pattern`，确保揭晓区只展示本题实际采用的自然结构；
4. 修订脚本通过重复执行 hash 检查，确认幂等；
5. approved seed 已重新导入 SQLite，157 张句子卡、221 个 Collocation 及既有学习记录均保留；
6. Schema、内容关联、单元测试、数据库测试、生产构建和页面抽查结果记录在实施计划中。
