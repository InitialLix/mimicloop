# Collocation 候选审核清单

## 首批人工批准记录（2026-08-17）

- 用户已确认原先从正式句子卡范围提取的搭配内容没有问题，并要求继续推进；
- 批准范围用确定性条件固定为：`source_links` 中至少一项 `card_id != null`；共 86 条、91 处来源；
- 批准结果保存在 `data/approved_collocations.seed.json`，每条追加 `local_user / approved` 审核记录并提升 `content_revision`；
- 完整范文普通正文新增的其余 114 条仍为候选，不因本次批量决定自动批准。

## 剩余候选人工批准记录（2026-08-17）

- 首批 86 条发布后，用户再次明确表示“剩下那些我也批准”；
- 本次只追加此前不在 approved seed 中的 114 条，保留首批 86 条原有审核历史；
- `data/approved_collocations.seed.json` 现共 200 条，覆盖全部候选和 207 处真实来源；
- 两次人工决定使用不同审核理由写入 `review_history`，没有回写或伪造首次批准范围。

- 生成时间：2026-08-17T06:50:00.000Z
- 扫描：28 篇来源范文的 361 个正文句子；其中 152 句有正式句子卡
- 候选：200 条；涉及 181 个来源句；180 句不强行提取
- 来源关系：86 条关联正式句子卡；115 条包含普通正文句来源
- 类型：collocation 166，fixed_phrase 24，sentence_frame 10
- 优先级：core 129，supporting 71
- 多来源：7；由现有 exact chunk 直接升级：34
- 存疑去重组：quality-of-life、importance-on、take-steps-response、emphasis-on、role-in、effort-to

> 当前全部为 candidate。请按批次审核；未得到人工批准前不会进入正式数据库或学习队列。

## 第 1 批（20 条）

### [ ] promote local film-making

- 中文提示：推动本地电影制作
- 类型 / 优先级：collocation / supporting
- Pattern：promote {activity}
- Accepted：promote local film-making
- 来源：Foreign films and support for local cinema
- 原句：There could be several reasons why this is the case, and I believe that governments should promote local film-making by subsidising the industry.
- Surface：promote local film-making
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have a huge budget for

- 中文提示：为……投入巨额预算
- 类型 / 优先级：collocation / core
- Pattern：have a huge budget for {activity}
- Accepted：have a huge budget for / have huge budgets for
- 来源：Foreign films and support for local cinema
- 原句：Firstly, the established film industries in certain countries have huge budgets for action, special effects and to shoot scenes in spectacular locations.
- Surface：have huge budgets for
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] global appeal

- 中文提示：全球吸引力
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：global appeal / the global appeal
- 来源：Foreign films and support for local cinema
- 原句：Hollywood blockbusters like ‘Avatar’ or the James Bond films are examples of such productions and the global appeal that they have.
- Surface：the global appeal
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] suffer in comparison

- 中文提示：相比之下显得逊色
- 类型 / 优先级：collocation / core
- Pattern：suffer in comparison with {comparison}
- Accepted：suffer in comparison / suffers in comparison
- 来源：Foreign films and support for local cinema
- 原句：The poor quality, low-budget filmmaking in many countries suffers in comparison.
- Surface：suffers in comparison
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a host of

- 中文提示：大量／许多……
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：a host of {object}
- Accepted：a host of / a whole host of
- 来源：Foreign films and support for local cinema
- 原句：To compete with big-budget productions from overseas, these people need money to pay for film crews, actors and a host of other costs related to producing high-quality films.
- Surface：a host of
- 句子卡关联：eaa247b6-6310-5ce8-9b8c-11cf02218239
- 其他来源：1
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be funded by government subsidies

- 中文提示：由政府补贴资助
- 类型 / 优先级：collocation / core
- Pattern：be funded by {source}
- Accepted：be funded by government subsidies / be partly funded by government subsidies
- 来源：Foreign films and support for local cinema
- 原句：New Zealand, for example, has seen an increase in tourism related to the 'Lord of the Rings' films, which were partly funded by government subsidies.
- Surface：were partly funded by government subsidies
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] dominate the market

- 中文提示：占据／主导市场
- 类型 / 优先级：collocation / core
- Pattern：dominate the {market}
- Accepted：dominate the market
- 来源：Foreign films and support for local cinema
- 原句：In conclusion, I believe that increased financial support could help to raise the quality of locally made films and allow them to compete with the foreign productions that currently dominate the market.
- Surface：dominate the market
- 句子卡关联：a73254eb-90b2-5e79-b902-036d6bb2850f
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be charged more than

- 中文提示：被收取高于……的费用
- 类型 / 优先级：collocation / core
- Pattern：be charged more than {comparison}
- Accepted：be charged more than / should be charged more than
- 来源：Higher admission fees for foreign visitors
- 原句：It is sometimes argued that tourists from overseas should be charged more than local residents to visit important sites and monuments.
- Surface：should be charged more than
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] depend on state subsidies

- 中文提示：依赖政府补贴
- 类型 / 优先级：collocation / core
- Pattern：depend on {source}
- Accepted：depend on state subsidies
- 来源：Higher admission fees for foreign visitors
- 原句：The argument in favour of higher prices for foreign tourists would be that cultural or historical attractions often depend on state subsidies to keep them going, which means that the resident population already pays money to these sites through the tax system.
- Surface：depend on state subsidies
- 句子卡关联：c8264aed-707b-5623-9868-22ee594988ed
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a shortsighted view

- 中文提示：目光短浅的观点
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a shortsighted view / a very shortsighted view
- 来源：Higher admission fees for foreign visitors
- 原句：However, I believe this to be a very shortsighted view.
- Surface：a very shortsighted view
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] contribute to the economy

- 中文提示：为经济作出贡献
- 类型 / 优先级：collocation / core
- Pattern：contribute to the economy of {institution}
- Accepted：contribute to the economy
- 来源：Higher admission fees for foreign visitors
- 原句：Foreign tourists contribute to the economy of the host country with the money they spend on a wide range of goods and services, including food, souvenirs, accommodation and travel.
- Surface：contribute to the economy of the host country
- 句子卡关联：ce476d52-f1cf-5f9b-8148-48054e35876e
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a risk of insufficient funding for

- 中文提示：……资金不足的风险
- 类型 / 优先级：collocation / core
- Pattern：a risk of insufficient funding for {service}
- Accepted：a risk of insufficient funding for
- 来源：Higher admission fees for foreign visitors
- 原句：If overseas tourists stopped coming due to higher prices, there would be a risk of insufficient funding for the maintenance of these important buildings.
- Surface：a risk of insufficient funding for
- 句子卡关联：b95d5410-a599-58db-897f-586aebe943f5
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] make every effort to

- 中文提示：尽一切努力去……
- 类型 / 优先级：collocation / core
- Pattern：make every effort to {action}
- Accepted：make every effort to / every effort should be made to
- 来源：Higher admission fees for foreign visitors
- 原句：In conclusion, I believe that every effort should be made to attract tourists from overseas, and it would be counterproductive to make them pay more than local residents.
- Surface：every effort should be made to
- 句子卡关联：11181579-1073-58bc-923a-b9e42568f1c3
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] rely on someone for help

- 中文提示：依靠某人的帮助
- 类型 / 优先级：collocation / core
- Pattern：rely on {person} for {service}
- Accepted：rely on someone for help / rely on their parents for help
- 来源：Are people becoming more independent?
- 原句：For example, young adults tend to rely on their parents for help when buying a house.
- Surface：rely on their parents for help
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] pay a deposit

- 中文提示：支付定金／首付
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：pay a deposit
- 来源：Are people becoming more independent?
- 原句：Property prices are higher than ever, and without help it would be impossible for many people to pay a deposit and a mortgage.
- Surface：pay a deposit
- 句子卡关联：80f573d9-ce96-5e2e-98f2-1a87bd051676
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] pay a mortgage

- 中文提示：偿还房贷
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：pay a mortgage
- 来源：Are people becoming more independent?
- 原句：Property prices are higher than ever, and without help it would be impossible for many people to pay a deposit and a mortgage.
- Surface：pay a deposit and a mortgage
- 句子卡关联：80f573d9-ce96-5e2e-98f2-1a87bd051676
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] quality of life

- 中文提示：生活质量
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：quality of life / a better quality of life
- 来源：Are people becoming more independent?
- 原句：Secondly, people seem to be more ambitious nowadays, and they want a better quality of life for their families.
- Surface：a better quality of life
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：需与 an improved quality of life 一并审核粒度。

### [ ] depend on support from

- 中文提示：依赖来自……的支持
- 类型 / 优先级：collocation / core
- Pattern：depend on support from {source}
- Accepted：depend on support from
- 来源：Are people becoming more independent?
- 原句：This means that both parents usually need to work full-time, and they depend on support from grandparents and babysitters for child care.
- Surface：depend on support from
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] count on

- 中文提示：依靠／指望……
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：count on {person}
- Accepted：count on
- 来源：Are people becoming more independent?
- 原句：In most countries, families are becoming smaller and more dispersed, which means that people cannot count on relatives as much as they used to.
- Surface：count on
- 句子卡关联：8a890de8-ad30-59d2-b08b-1fa9ff4d984f
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have the freedom to

- 中文提示：有做……的自由
- 类型 / 优先级：fixed_phrase / core
- Pattern：have the freedom to {action}
- Accepted：have the freedom to / have more freedom to
- 来源：Are people becoming more independent?
- 原句：We also have more freedom to travel and live far away from our home towns.
- Surface：have more freedom to
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

## 第 2 批（20 条）

### [ ] the key consideration

- 中文提示：首要考虑因素
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：the key consideration
- 来源：Is salary the most important factor in choosing a job?
- 原句：Personally, I disagree with the idea that money is the key consideration when deciding on a career, because I believe that other factors are equally important.
- Surface：the key consideration
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] meet one's basic needs

- 中文提示：满足基本生活需要
- 类型 / 优先级：collocation / core
- Pattern：meet {person} basic needs
- Accepted：meet one's basic needs / meet their basic needs
- 来源：Is salary the most important factor in choosing a job?
- 原句：On the one hand, I agree that money is necessary in order for people to meet their basic needs.
- Surface：meet their basic needs
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] consider it a priority to

- 中文提示：把做……视为优先事项
- 类型 / 优先级：sentence_frame / core
- Pattern：consider it a priority to {action}
- Accepted：consider it a priority to
- 来源：Is salary the most important factor in choosing a job?
- 原句：Most people consider it a priority to at least earn a salary that allows them to cover these needs and have a reasonable quality of life.
- Surface：consider it a priority to
- 句子卡关联：4e5360fe-22bf-5d77-98ff-8db6f60350d2
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] choose a career path

- 中文提示：选择职业道路
- 类型 / 优先级：collocation / core
- Pattern：choose a {object}
- Accepted：choose a career path / choosing a career path
- 来源：Is salary the most important factor in choosing a job?
- 原句：Artists and musicians, for instance, are known for choosing a career path that they love, but that does not always provide them with enough money to live comfortably and raise a family.
- Surface：choosing a career path
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] raise a family

- 中文提示：养育家庭／子女
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：raise a family
- 来源：Is salary the most important factor in choosing a job?
- 原句：Artists and musicians, for instance, are known for choosing a career path that they love, but that does not always provide them with enough money to live comfortably and raise a family.
- Surface：raise a family
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] make a huge difference to

- 中文提示：对……产生巨大影响
- 类型 / 优先级：collocation / core
- Pattern：make a huge difference to {target}
- Accepted：make a huge difference to
- 来源：Is salary the most important factor in choosing a job?
- 原句：Having a good manager or friendly colleagues, for example, can make a huge difference to workers’ levels of happiness and general quality of life.
- Surface：make a huge difference to
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] job satisfaction

- 中文提示：工作满意度
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：job satisfaction
- 来源：Is salary the most important factor in choosing a job?
- 原句：Secondly, many people’s feelings of job satisfaction come from their professional achievements, the skills they learn, and the position they reach, rather than the money they earn.
- Surface：job satisfaction
- 句子卡关联：0bcab9ce-aae9-5295-9de0-eae275382998
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] professional achievements

- 中文提示：职业成就
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：professional achievements
- 来源：Is salary the most important factor in choosing a job?
- 原句：Secondly, many people’s feelings of job satisfaction come from their professional achievements, the skills they learn, and the position they reach, rather than the money they earn.
- Surface：professional achievements
- 句子卡关联：0bcab9ce-aae9-5295-9de0-eae275382998
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] contribute something positive to society

- 中文提示：为社会作出积极贡献
- 类型 / 优先级：collocation / core
- Pattern：contribute something positive to {target}
- Accepted：contribute something positive to society
- 来源：Is salary the most important factor in choosing a job?
- 原句：Finally, some people choose a career because they want to help others and contribute something positive to society.
- Surface：contribute something positive to society
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be cleared for human use

- 中文提示：获准供人类使用
- 类型 / 优先级：collocation / core
- Pattern：be cleared for {purpose}
- Accepted：be cleared for human use
- 来源：The case for and against animal experiments
- 原句：It is true that medicines and other products are routinely tested on animals before they are cleared for human use.
- Surface：cleared for human use
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a limited amount of

- 中文提示：有限数量的……
- 类型 / 优先级：collocation / supporting
- Pattern：a limited amount of {object}
- Accepted：a limited amount of
- 来源：The case for and against animal experiments
- 原句：While I tend towards the viewpoint that animal testing is morally wrong, I would have to support a limited amount of animal experimentation for the development of medicines.
- Surface：a limited amount of
- 句子卡关联：47cb32a0-3618-5aba-b384-7143221aa483
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] ethical arguments against

- 中文提示：反对……的伦理论据
- 类型 / 优先级：collocation / core
- Pattern：ethical arguments against {idea}
- Accepted：ethical arguments against
- 来源：The case for and against animal experiments
- 原句：On the one hand, there are clear ethical arguments against animal experimentation.
- Surface：ethical arguments against
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] measure the effectiveness of

- 中文提示：衡量……的有效性
- 类型 / 优先级：collocation / core
- Pattern：measure the effectiveness of {object}
- Accepted：measure the effectiveness of
- 来源：The case for and against animal experiments
- 原句：To use a common example of this practice, laboratory mice may be given an illness so that the effectiveness of a new drug can be measured.
- Surface：the effectiveness of a new drug can be measured
- 句子卡关联：62ef26bd-9bcd-5360-8f7b-8760af91a62c
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] subject someone to trauma

- 中文提示：使……遭受创伤
- 类型 / 优先级：collocation / core
- Pattern：subject {person} to {outcome}
- Accepted：subject someone to trauma
- 来源：The case for and against animal experiments
- 原句：Opponents of such research argue that humans have no right to subject animals to this kind of trauma, and that the lives of all creatures should be respected.
- Surface：subject animals to this kind of trauma
- 句子卡关联：6b235f55-92ff-50c5-b810-533af1d4a129
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a reliable alternative to

- 中文提示：……的可靠替代方案
- 类型 / 优先级：collocation / core
- Pattern：a reliable alternative to {object}
- Accepted：a reliable alternative to / reliable alternatives to
- 来源：The case for and against animal experiments
- 原句：On the other hand, reliable alternatives to animal experimentation may not always be available.
- Surface：reliable alternatives to
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a necessary evil

- 中文提示：不得已而为之的坏事
- 类型 / 优先级：fixed_phrase / core
- Pattern：—
- Accepted：a necessary evil
- 来源：The case for and against animal experiments
- 原句：Personally, I agree with the banning of animal testing for non-medical products, but I feel that it may be a necessary evil where new drugs and medical procedures are concerned.
- Surface：a necessary evil
- 句子卡关联：46c73496-5a73-555f-9e70-9ada1c6a927e
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] government support for

- 中文提示：政府对……的支持
- 类型 / 优先级：collocation / supporting
- Pattern：government support for {object}
- Accepted：government support for
- 来源：Should governments fund artists?
- 原句：While some people disagree with the idea of government support for artists, I believe that money for art projects should come from both governments and other sources.
- Surface：government support for
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be spent on

- 中文提示：被用于……
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：be spent on {service}
- Accepted：be spent on
- 来源：Should governments fund artists?
- 原句：For example, state budgets need to be spent on education, healthcare, infrastructure and security, among other areas.
- Surface：be spent on
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] alternative sources of financial support

- 中文提示：其他资金支持来源
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：alternative sources of financial support
- 来源：Should governments fund artists?
- 原句：In conclusion, there are good reasons why artists should rely on alternative sources of financial support, but in my opinion government help is sometimes necessary.
- Surface：alternative sources of financial support
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] on a volunteer basis

- 中文提示：以志愿方式
- 类型 / 优先级：fixed_phrase / core
- Pattern：—
- Accepted：on a volunteer basis
- 来源：Unpaid community work for teenagers
- 原句：Many young people work on a volunteer basis, and this can only be beneficial for both the individual and society as a whole.
- Surface：on a volunteer basis
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

## 第 3 批（20 条）

### [ ] society as a whole

- 中文提示：整个社会
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：—
- Accepted：society as a whole
- 来源：Unpaid community work for teenagers
- 原句：Many young people work on a volunteer basis, and this can only be beneficial for both the individual and society as a whole.
- Surface：society as a whole
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have something to gain from

- 中文提示：能从……中获益
- 类型 / 优先级：sentence_frame / core
- Pattern：have something to gain from {activity}
- Accepted：have something to gain from / have anything to gain from
- 来源：Unpaid community work for teenagers
- 原句：At the same time, I do not believe that society has anything to gain from obliging young people to do unpaid work.
- Surface：has anything to gain from
- 句子卡关联：a405d61c-c842-586a-a615-804bd49a7cee
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] against one's will

- 中文提示：违背某人的意愿
- 类型 / 优先级：fixed_phrase / core
- Pattern：—
- Accepted：against one's will / against their will
- 来源：Unpaid community work for teenagers
- 原句：In fact, I would argue that it goes against the values of a free and fair society to force a group of people to do something against their will.
- Surface：against their will
- 句子卡关联：ee16ee95-bd1e-59b9-b44a-a8117493905f
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] go against the values of

- 中文提示：违背……的价值观
- 类型 / 优先级：collocation / core
- Pattern：go against the values of {group}
- Accepted：go against the values of
- 来源：Unpaid community work for teenagers
- 原句：In fact, I would argue that it goes against the values of a free and fair society to force a group of people to do something against their will.
- Surface：goes against the values of
- 句子卡关联：ee16ee95-bd1e-59b9-b44a-a8117493905f
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] lead to resentment

- 中文提示：引发不满／怨恨
- 类型 / 优先级：collocation / core
- Pattern：—
- Accepted：lead to resentment
- 来源：Unpaid community work for teenagers
- 原句：Doing this can only lead to resentment amongst young people, who would feel that they were being used, and parents, who would not want to be told how to raise their children.
- Surface：lead to resentment
- 句子卡关联：eac896dc-0f47-5980-b545-38698b320ebd
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a rich variety of

- 中文提示：种类丰富的……
- 类型 / 优先级：collocation / core
- Pattern：a rich variety of {object}
- Accepted：a rich variety of
- 来源：Traditional music and international music
- 原句：It is true that a rich variety of musical styles can be found around the world.
- Surface：a rich variety of
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] throughout one's life

- 中文提示：贯穿某人的一生
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：—
- Accepted：throughout one's life / throughout our lives
- 来源：Traditional music and international music
- 原句：Music is something that accompanies all of us throughout our lives.
- Surface：throughout our lives
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] as a means of

- 中文提示：作为……的手段
- 类型 / 优先级：fixed_phrase / core
- Pattern：as a means of {activity}
- Accepted：as a means of
- 来源：Traditional music and international music
- 原句：As children, we are taught songs by our parents and teachers as a means of learning language, or simply as a form of enjoyment.
- Surface：as a means of
- 句子卡关联：6b294668-2829-5a7e-a1af-605fede039eb
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] arouse emotions

- 中文提示：唤起情感
- 类型 / 优先级：collocation / core
- Pattern：arouse {outcome}
- Accepted：arouse emotions
- 来源：Traditional music and international music
- 原句：Music both expresses and arouses emotions in a way that words alone cannot.
- Surface：arouses emotions
- 句子卡关联：6672927e-67bc-52fc-a21d-973050c0fcd0
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be given more importance than

- 中文提示：比……受到更多重视
- 类型 / 优先级：collocation / core
- Pattern：be given more importance than {comparison}
- Accepted：be given more importance than / should be given more importance than
- 来源：Traditional music and international music
- 原句：In conclusion, music is a necessary part of human existence, and I believe that traditional music should be given more importance than international music.
- Surface：should be given more importance than
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：保留独立框架还是仅作表达族关联，需人工确认。

### [ ] improve motor skills

- 中文提示：提升动作技能
- 类型 / 优先级：collocation / supporting
- Pattern：improve {skill}
- Accepted：improve motor skills / improve users’ motor skills
- 来源：Video games: benefits and drawbacks
- 原句：Furthermore, it has been shown that computer simulation games can improve users’ motor skills and help to prepare them for real-world tasks, such as flying a plane.
- Surface：improve users’ motor skills
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] prepare someone for real-world tasks

- 中文提示：使某人为现实任务做好准备
- 类型 / 优先级：collocation / core
- Pattern：prepare {person} for {activity}
- Accepted：prepare someone for real-world tasks / prepare them for real-world tasks
- 来源：Video games: benefits and drawbacks
- 原句：Furthermore, it has been shown that computer simulation games can improve users’ motor skills and help to prepare them for real-world tasks, such as flying a plane.
- Surface：prepare them for real-world tasks
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be outweighed by the drawbacks

- 中文提示：被缺点所抵消／压过
- 类型 / 优先级：collocation / core
- Pattern：be outweighed by {comparison}
- Accepted：be outweighed by the drawbacks / be outweighed by drawbacks / are outweighed by the drawbacks
- 来源：Video games: benefits and drawbacks
- 原句：However, I would argue that these benefits are outweighed by the drawbacks.
- Surface：are outweighed by the drawbacks
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be highly addictive

- 中文提示：极易使人上瘾
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：be highly addictive
- 来源：Video games: benefits and drawbacks
- 原句：Gaming can be highly addictive because users are constantly given scores, new targets and frequent rewards to keep them playing.
- Surface：be highly addictive
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] progress through the levels of

- 中文提示：逐级通过……的关卡
- 类型 / 优先级：collocation / supporting
- Pattern：progress through the levels of {object}
- Accepted：progress through the levels of
- 来源：Video games: benefits and drawbacks
- 原句：Many children now spend hours each day trying to progress through the levels of a game or to get a higher score than their friends.
- Surface：progress through the levels of
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a sedentary lifestyle

- 中文提示：久坐的生活方式
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a sedentary lifestyle / sedentary lifestyle
- 来源：Video games: benefits and drawbacks
- 原句：The rise in obesity in recent years has also been linked in part to the sedentary lifestyle and lack of exercise that often accompany gaming addiction.
- Surface：the sedentary lifestyle
- 句子卡关联：0b0ee530-2f77-5d25-a6cb-6baa331b7c26
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be linked in part to

- 中文提示：在某种程度上与……有关
- 类型 / 优先级：collocation / core
- Pattern：be linked in part to {factor}
- Accepted：be linked in part to
- 来源：Video games: benefits and drawbacks
- 原句：The rise in obesity in recent years has also been linked in part to the sedentary lifestyle and lack of exercise that often accompany gaming addiction.
- Surface：been linked in part to
- 句子卡关联：0b0ee530-2f77-5d25-a6cb-6baa331b7c26
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] take steps to mitigate

- 中文提示：采取措施缓解……
- 类型 / 优先级：collocation / core
- Pattern：take steps to mitigate {problem}
- Accepted：take steps to mitigate
- 来源：Problems and solutions of an ageing population
- 原句：Although there will undoubtedly be some negative consequences of this trend, societies can take steps to mitigate these potential problems.
- Surface：take steps to mitigate
- 句子卡关联：6f787792-feb9-5d16-b76b-043be58e358b
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be eligible to receive

- 中文提示：有资格获得……
- 类型 / 优先级：collocation / core
- Pattern：be eligible to receive {service}
- Accepted：be eligible to receive
- 来源：Problems and solutions of an ageing population
- 原句：The main issue is that there will obviously be more people of retirement age who will be eligible to receive a pension.
- Surface：be eligible to receive
- 句子卡关联：8794154b-7d2e-5776-b5de-6e77180eba66
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a rise in demand for

- 中文提示：对……需求的上升
- 类型 / 优先级：collocation / core
- Pattern：a rise in demand for {service}
- Accepted：a rise in demand for / a rise in the demand for
- 来源：Problems and solutions of an ageing population
- 原句：Further pressures will include a rise in the demand for healthcare, and the fact young adults will increasingly have to look after their elderly relatives.
- Surface：a rise in the demand for
- 句子卡关联：8508dfcf-3f1a-51e5-b0f9-0b6bb279f840
- 其他来源：1
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

## 第 4 批（20 条）

### [ ] increase the retirement age

- 中文提示：提高退休年龄
- 类型 / 优先级：collocation / core
- Pattern：increase the {object}
- Accepted：increase the retirement age
- 来源：Problems and solutions of an ageing population
- 原句：Firstly, a simple solution would be to increase the retirement age for working adults, perhaps from 65 to 70.
- Surface：increase the retirement age
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a productive working life

- 中文提示：富有成效的职业生涯
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a productive working life
- 来源：Problems and solutions of an ageing population
- 原句：Nowadays, people of this age tend to be healthy enough to continue a productive working life.
- Surface：a productive working life
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] take measures to tackle

- 中文提示：采取措施处理……
- 类型 / 优先级：collocation / core
- Pattern：take measures to tackle {problem}
- Accepted：take measures to tackle / measures can be taken to tackle
- 来源：Problems and solutions of an ageing population
- 原句：In conclusion, various measures can be taken to tackle the problems that are certain to arise as the populations of countries grow older.
- Surface：measures can be taken to tackle
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：需决定与 take steps to tackle 合并还是保留 accepted 变体。

### [ ] in a variety of ways

- 中文提示：以多种方式
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：—
- Accepted：in a variety of ways
- 来源：Should countries only help their own citizens?
- 原句：In the UK, people can help in a variety of ways, from donating clothing to serving free food in a soup kitchen.
- Surface：in a variety of ways
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have an obligation to

- 中文提示：有义务去……
- 类型 / 优先级：collocation / core
- Pattern：have an obligation to {action}
- Accepted：have an obligation to
- 来源：Should countries only help their own citizens?
- 原句：At the same time, I believe that we have an obligation to help those who live beyond our national borders.
- Surface：have an obligation to
- 句子卡关联：a75ef395-9bd6-5642-947d-c4d802850da0
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] those in need

- 中文提示：需要帮助的人
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：—
- Accepted：those in need / those who are in need
- 来源：Should countries only help their own citizens?
- 原句：In conclusion, it is true that we cannot help everyone, but in my opinion national boundaries should not stop us from helping those who are in need.
- Surface：those who are in need
- 句子卡关联：243ac1fa-e7b8-58b9-ab1e-546442d913fa
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have an influence on

- 中文提示：对……产生影响
- 类型 / 优先级：collocation / core
- Pattern：have an influence on {target}
- Accepted：have an influence on / have had an influence on
- 来源：How technology changes relationships
- 原句：It is true that new technologies have had an influence on communication between people.
- Surface：have had an influence on
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have an impact on

- 中文提示：对……造成影响
- 类型 / 优先级：collocation / core
- Pattern：have an impact on {target}
- Accepted：have an impact on / has had an impact on
- 来源：How technology changes relationships
- 原句：Technology has had an impact on relationships in business, education and social life.
- Surface：has had an impact on
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] create new possibilities for

- 中文提示：为……创造新的可能
- 类型 / 优先级：collocation / core
- Pattern：create new possibilities for {target}
- Accepted：create new possibilities for
- 来源：How technology changes relationships
- 原句：Secondly, services like Skype create new possibilities for relationships between students and teachers.
- Surface：create new possibilities for
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] share common interests

- 中文提示：拥有共同兴趣
- 类型 / 优先级：collocation / core
- Pattern：share common {object}
- Accepted：share common interests
- 来源：How technology changes relationships
- 原句：Finally, many people use social networks, like Facebook, to make new friends and find people who share common interests, and they interact through their computers rather than face to face.
- Surface：share common interests
- 句子卡关联：94a7290d-2293-57f8-90a9-1993f112106f
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] discourage real interaction

- 中文提示：阻碍真实互动
- 类型 / 优先级：collocation / core
- Pattern：discourage {activity}
- Accepted：discourage real interaction / discouraging real interaction
- 来源：How technology changes relationships
- 原句：On the other hand, the availability of new communication technologies can also have the result of isolating people and discouraging real interaction.
- Surface：discouraging real interaction
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a poor substitute for

- 中文提示：……的拙劣替代品
- 类型 / 优先级：collocation / core
- Pattern：a poor substitute for {object}
- Accepted：a poor substitute for
- 来源：How technology changes relationships
- 原句：For example, many young people choose to make friends online rather than mixing with their peers in the real world, and these ‘virtual’ relationships are a poor substitute for real friendships.
- Surface：a poor substitute for
- 句子卡关联：c5133f81-0e4e-50ac-b903-7d93f37e621a
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] present a challenge

- 中文提示：构成挑战
- 类型 / 优先级：collocation / core
- Pattern：present {degree} a challenge
- Accepted：present a challenge / present more of a challenge
- 来源：Why difficult hobbies can be more enjoyable
- 原句：Some hobbies are relatively easy, while others present more of a challenge.
- Surface：present more of a challenge
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] require little equipment

- 中文提示：几乎不需要设备
- 类型 / 优先级：collocation / supporting
- Pattern：require {degree} equipment
- Accepted：require little equipment / requires very little equipment
- 来源：Why difficult hobbies can be more enjoyable
- 原句：This hobby requires very little equipment, it is simple to learn, and it is inexpensive.
- Surface：requires very little equipment
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a high level of expertise

- 中文提示：高水平的专业能力
- 类型 / 优先级：collocation / core
- Pattern：a high level of {skill}
- Accepted：a high level of expertise / a high level of knowledge and expertise
- 来源：Why difficult hobbies can be more enjoyable
- 原句：For example, film editing is a hobby that requires a high level of knowledge and expertise.
- Surface：a high level of knowledge and expertise
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] become competent at

- 中文提示：逐渐熟练掌握……
- 类型 / 优先级：collocation / core
- Pattern：become competent at {activity}
- Accepted：become competent at / became competent at
- 来源：Why difficult hobbies can be more enjoyable
- 原句：In my case, it took me around two years before I became competent at this activity, but now I enjoy it much more than I did when I started.
- Surface：became competent at
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] with regard to

- 中文提示：关于／就……而言
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：with regard to {idea}
- Accepted：with regard to
- 来源：Equality and personal achievement
- 原句：Education is an important factor with regard to personal success in life.
- Surface：with regard to
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] pursue a university degree

- 中文提示：攻读大学学位
- 类型 / 优先级：collocation / core
- Pattern：pursue a {object}
- Accepted：pursue a university degree
- 来源：Equality and personal achievement
- 原句：I believe that all children should have access to free schooling, and higher education should be either free or affordable for all those who chose to pursue a university degree.
- Surface：pursue a university degree
- 句子卡关联：aa548843-5fa7-5776-8a9f-cc8652886ed1
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] harm the prospects of

- 中文提示：损害……的前景
- 类型 / 优先级：collocation / core
- Pattern：harm the prospects of {group}
- Accepted：harm the prospects of
- 来源：Equality and personal achievement
- 原句：This kind of inequality would ensure the success of some but harm the prospects of others.
- Surface：harm the prospects of
- 句子卡关联：17b39b8e-269d-5fd8-a21c-d384afe71e83
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be in conflict with

- 中文提示：与……相冲突
- 类型 / 优先级：collocation / core
- Pattern：be in conflict with {idea}
- Accepted：be in conflict with
- 来源：Equality and personal achievement
- 原句：I would argue that equal rights and opportunities are not in conflict with people’s freedom to succeed or fail.
- Surface：in conflict with
- 句子卡关联：82c6d65e-73c7-5294-a751-9382569e259e
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

## 第 5 批（20 条）

### [ ] reach one's potential

- 中文提示：发挥某人的潜能
- 类型 / 优先级：collocation / core
- Pattern：reach one's {goal}
- Accepted：reach one's potential / reach their potential
- 来源：Equality and personal achievement
- 原句：On the contrary, I believe that most people would feel more motivated to work hard and reach their potential if they thought that they lived in a fair society.
- Surface：reach their potential
- 句子卡关联：2c3d7522-b93e-5bc5-956d-d8ef0f8a93df
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] waste an opportunity

- 中文提示：浪费一次机会
- 类型 / 优先级：collocation / supporting
- Pattern：waste {object}
- Accepted：waste an opportunity / wasted their opportunity
- 来源：Equality and personal achievement
- 原句：Those who did not make the same effort would know that they had wasted their opportunity.
- Surface：wasted their opportunity
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] the odds are stacked in favour of

- 中文提示：成功机会偏向……
- 类型 / 优先级：sentence_frame / core
- Pattern：the odds are stacked in favour of {group}
- Accepted：the odds are stacked in favour of / the odds of success were stacked in favour of
- 来源：Equality and personal achievement
- 原句：Inequality, on the other hand, would be more likely to demotivate people because they would know that the odds of success were stacked in favour of those from privileged backgrounds.
- Surface：the odds of success were stacked in favour of
- 句子卡关联：55801fda-61a8-556a-be29-76f83ed93b5f
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a positive relationship between

- 中文提示：……之间的正向关系
- 类型 / 优先级：collocation / core
- Pattern：a positive relationship between {factor} and {outcome}
- Accepted：a positive relationship between
- 来源：Equality and personal achievement
- 原句：In conclusion, it seems to me that there is a positive relationship between equality and personal success.
- Surface：a positive relationship between
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] equal educational opportunities

- 中文提示：平等的受教育机会
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：equal educational opportunities / the same educational opportunities
- 来源：Equal numbers of men and women on university courses
- 原句：In my opinion, men and women should have the same educational opportunities.
- Surface：the same educational opportunities
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] aim for equal proportions

- 中文提示：以比例相等为目标
- 类型 / 优先级：collocation / core
- Pattern：aim for {outcome}
- Accepted：aim for equal proportions
- 来源：Equal numbers of men and women on university courses
- 原句：In reality, many courses are more popular with one gender than the other, and it would not be practical to aim for equal proportions.
- Surface：aim for equal proportions
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] base admission on

- 中文提示：把录取建立在……基础上
- 类型 / 优先级：collocation / core
- Pattern：base admission on {area}
- Accepted：base admission on
- 来源：Equal numbers of men and women on university courses
- 原句：Apart from the practical concerns expressed above, I also believe that it would be unfair to base admission to university courses on gender.
- Surface：base admission to university courses on
- 句子卡关联：7281e021-7d4b-5a07-aae9-ee19c891237e
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] according to one's qualifications

- 中文提示：根据某人的资历
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：according to {person} qualifications
- Accepted：according to one's qualifications / according to their qualifications
- 来源：Equal numbers of men and women on university courses
- 原句：Universities should continue to select the best candidates for each course according to their qualifications.
- Surface：according to their qualifications
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] achieve good grades

- 中文提示：取得好成绩
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：achieve good grades
- 来源：Equal numbers of men and women on university courses
- 原句：In this way, both men and women have the same opportunities, and applicants know that they will be successful if they work hard to achieve good grades at school.
- Surface：achieve good grades
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be based on merit

- 中文提示：以能力／表现为依据
- 类型 / 优先级：collocation / core
- Pattern：be based on {area}
- Accepted：be based on merit
- 来源：Equal numbers of men and women on university courses
- 原句：In conclusion, the selection of university students should be based on merit, and it would be both impractical and unfair to change to a selection procedure based on gender.
- Surface：be based on merit
- 句子卡关联：c2c83fe5-e8af-5d0d-9287-d8b5efb68032
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] put emphasis on

- 中文提示：把重点放在……
- 类型 / 优先级：collocation / core
- Pattern：put {degree} emphasis on {value}
- Accepted：put emphasis on / put more of an emphasis on
- 来源：Should museums entertain or educate?
- 原句：The average visitor may become bored if he or she has to read or listen to too much educational content, so museums often put more of an emphasis on enjoyment rather than learning.
- Surface：put more of an emphasis on
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：需确认 canonical 是否改为 put more emphasis on。

### [ ] play an important role in

- 中文提示：在……中发挥重要作用
- 类型 / 优先级：collocation / core
- Pattern：play an important role in {activity}
- Accepted：play an important role in
- 来源：Should museums entertain or educate?
- 原句：In this way, museums can play an important role in teaching people about history, culture, science and many other aspects of life.
- Surface：play an important role in
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：建议保留独立表达并建立表达族，待人工确认。

### [ ] face the dilemma of whether to

- 中文提示：面临是否要……的两难选择
- 类型 / 优先级：sentence_frame / core
- Pattern：face the dilemma of whether to {action}
- Accepted：face the dilemma of whether to
- 来源：University or work after school
- 原句：When they finish school, teenagers face the dilemma of whether to get a job or continue their education.
- Surface：face the dilemma of whether to
- 句子卡关联：5b043b26-5234-5349-92a7-3881093bc61f
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] straight after school

- 中文提示：中学毕业后立即
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：—
- Accepted：straight after school
- 来源：University or work after school
- 原句：While there are some benefits to getting a job straight after school, I would argue that it is better to go to college or university.
- Surface：straight after school
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] gain real experience

- 中文提示：获得真实工作经验
- 类型 / 优先级：collocation / core
- Pattern：gain {object}
- Accepted：gain real experience
- 来源：University or work after school
- 原句：They will have the chance to gain real experience and learn practical skills related to their chosen profession.
- Surface：gain real experience
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] learn practical skills

- 中文提示：学习实用技能
- 类型 / 优先级：collocation / supporting
- Pattern：learn {skill}
- Accepted：learn practical skills
- 来源：University or work after school
- 原句：They will have the chance to gain real experience and learn practical skills related to their chosen profession.
- Surface：learn practical skills
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a successful career

- 中文提示：成功的职业生涯
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a successful career
- 来源：University or work after school
- 原句：This may lead to promotions and a successful career.
- Surface：a successful career
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] continue one's studies

- 中文提示：继续学业
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：continue one's studies / continue their studies
- 来源：University or work after school
- 原句：On the other hand, I believe that it is more beneficial for students to continue their studies.
- Surface：continue their studies
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] academic qualifications

- 中文提示：学历／学术资质
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：academic qualifications
- 来源：University or work after school
- 原句：Firstly, academic qualifications are required in many professions.
- Surface：academic qualifications
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a competitive job market

- 中文提示：竞争激烈的就业市场
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a competitive job market / competitive job market
- 来源：University or work after school
- 原句：Secondly, the job market is becoming increasingly competitive, and sometimes there are hundreds of applicants for one position in a company.
- Surface：the job market is becoming increasingly competitive
- 句子卡关联：01399a5e-ba7e-54c2-804f-94389816f2ab
- 其他来源：1
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

## 第 6 批（20 条）

### [ ] be more likely to

- 中文提示：更有可能……
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：be more likely to {action}
- Accepted：be more likely to / are more likely to
- 来源：University or work after school
- 原句：For the reasons mentioned above, it seems to me that students are more likely to be successful in their careers if they continue their studies beyond school level.
- Surface：are more likely to
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be better spent on

- 中文提示：更适合用于……
- 类型 / 优先级：collocation / core
- Pattern：be better spent on {service}
- Accepted：be better spent on
- 来源：Is it worth saving minority languages?
- 原句：This money might be better spent on other public services.
- Surface：be better spent on
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] cut costs related to

- 中文提示：削减与……相关的成本
- 类型 / 优先级：collocation / core
- Pattern：cut costs related to {activity}
- Accepted：cut costs related to
- 来源：Is it worth saving minority languages?
- 原句：Governments could cut all kinds of costs related to communicating with each minority group.
- Surface：cut all kinds of costs related to
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be less widely spoken

- 中文提示：使用范围较小
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：be less widely spoken / are less widely spoken
- 来源：Is it worth saving minority languages?
- 原句：Despite the above arguments, I believe that governments should try to preserve languages that are less widely spoken.
- Surface：are less widely spoken
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] rich cultural diversity

- 中文提示：丰富的文化多样性
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：rich cultural diversity
- 来源：Is it worth saving minority languages?
- 原句：If a language disappears, a whole way of life will disappear with it, and we will lose the rich cultural diversity that makes societies more interesting.
- Surface：rich cultural diversity
- 句子卡关联：1f886f0e-0bea-5951-be96-c0f27bd4e568
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] preserve traditions and customs

- 中文提示：保护／延续传统与习俗
- 类型 / 优先级：collocation / core
- Pattern：preserve {tradition}
- Accepted：preserve traditions and customs
- 来源：Is it worth saving minority languages?
- 原句：By spending money to protect minority languages, governments can also preserve traditions, customs and behaviours that are part of a country’s history.
- Surface：preserve traditions, customs and behaviours
- 句子卡关联：71901f65-0703-5778-b656-89591d62c4ef
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] take steps to reduce

- 中文提示：采取措施减少……
- 类型 / 优先级：collocation / core
- Pattern：take steps to reduce {problem}
- Accepted：take steps to reduce
- 来源：Who should solve environmental problems?
- 原句：Humans are responsible for a variety of environmental problems, but we can also take steps to reduce the damage that we are causing to the planet.
- Surface：take steps to reduce
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：建议只建立表达族，不直接合并，待人工确认。

### [ ] address environmental problems

- 中文提示：应对环境问题
- 类型 / 优先级：collocation / core
- Pattern：address {problem}
- Accepted：address environmental problems / address these problems
- 来源：Who should solve environmental problems?
- 原句：This essay will discuss environmental problems and the measures that governments and individuals can take to address these problems.
- Surface：address these problems
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have a devastating effect on

- 中文提示：对……产生毁灭性影响
- 类型 / 优先级：collocation / core
- Pattern：have a devastating effect on {threat_target}
- Accepted：have a devastating effect on
- 来源：Who should solve environmental problems?
- 原句：Gas emissions from factories and exhaust fumes from vehicles lead to global warming, which may have a devastating effect on the planet in the future.
- Surface：have a devastating effect on
- 句子卡关联：60751b13-ae53-5285-aba2-8bb94c117b92
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] make more effort to

- 中文提示：更加努力去……
- 类型 / 优先级：collocation / core
- Pattern：make more effort to {action}
- Accepted：make more effort to
- 来源：Who should solve environmental problems?
- 原句：Governments could certainly make more effort to reduce air pollution.
- Surface：make more effort to
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：需与 make every effort to 分组审核。

### [ ] limit emissions from

- 中文提示：限制来自……的排放
- 类型 / 优先级：collocation / core
- Pattern：limit emissions from {source}
- Accepted：limit emissions from
- 来源：Who should solve environmental problems?
- 原句：They could introduce laws to limit emissions from factories or to force companies to use renewable energy from solar, wind or water power.
- Surface：limit emissions from
- 句子卡关联：e2c085b2-50ec-5ae1-8ffa-ee0338d2ae59
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] impose taxes on

- 中文提示：对……征税
- 类型 / 优先级：collocation / core
- Pattern：impose {object} on {target}
- Accepted：impose taxes on / impose green taxes on
- 来源：Who should solve environmental problems?
- 原句：They could also impose ‘green taxes’ on drivers and airline companies.
- Surface：impose ‘green taxes’ on
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] take responsibility for

- 中文提示：为……承担责任
- 类型 / 优先级：collocation / core
- Pattern：take responsibility for {responsibility}
- Accepted：take responsibility for
- 来源：Who should solve environmental problems?
- 原句：Individuals should also take responsibility for the impact they have on the environment.
- Surface：take responsibility for
- 句子卡关联：a6266716-2bc0-5b5e-9ee1-81ff134a7478
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] take public transport

- 中文提示：乘坐公共交通
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：take public transport
- 来源：Who should solve environmental problems?
- 原句：They can take public transport rather than driving, choose products with less packaging, and recycle as much as possible.
- Surface：take public transport
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] play one's part in

- 中文提示：在……中尽自己的一份力
- 类型 / 优先级：collocation / core
- Pattern：play one's part in {activity}
- Accepted：play one's part in / play their part in
- 来源：Who should solve environmental problems?
- 原句：In conclusion, both national governments and individuals must play their part in looking after the environment.
- Surface：play their part in
- 句子卡关联：1fdd8353-32af-530a-b89a-4362282f8be6
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] take pleasure in

- 中文提示：从……中获得乐趣
- 类型 / 优先级：collocation / core
- Pattern：take pleasure in {activity}
- Accepted：take pleasure in / take pleasure from
- 来源：What makes people happy?
- 原句：Nobody can fully understand or experience another person’s feelings, and we all have our own particular passions from which we take pleasure.
- Surface：from which we take pleasure
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] derive a sense of satisfaction from

- 中文提示：从……中获得满足感
- 类型 / 优先级：collocation / core
- Pattern：derive a sense of satisfaction from {activity}
- Accepted：derive a sense of satisfaction from
- 来源：What makes people happy?
- 原句：Some people, for example, derive a sense of satisfaction from earning money or achieving success, whereas for others, health and family are much more important.
- Surface：derive a sense of satisfaction from
- 句子卡关联：7be623f0-7f42-5790-bebc-c0377146e616
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] live in complete isolation

- 中文提示：完全与世隔绝地生活
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：live in complete isolation
- 来源：What makes people happy?
- 原句：Secondly, the greatest joy in life is usually found in shared experiences with family and friends, and it is rare to find a person who is content to live in complete isolation.
- Surface：live in complete isolation
- 句子卡关联：31d3ee76-5a97-57e1-96b4-b866af4fa285
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a sense of purpose in life

- 中文提示：生活的目标感
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a sense of purpose in life
- 来源：What makes people happy?
- 原句：Other key factors could be individual freedom and a sense of purpose in life.
- Surface：a sense of purpose in life
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] fulfil basic needs

- 中文提示：满足基本需求
- 类型 / 优先级：collocation / core
- Pattern：fulfil {need}
- Accepted：fulfil basic needs / basic needs need to be fulfilled
- 来源：What makes people happy?
- 原句：In conclusion, happiness is difficult to define because it is particular to each individual, but I believe that our basic needs for shelter, food and company need to be fulfilled before we can experience it.
- Surface：basic needs for shelter, food and company need to be fulfilled
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

## 第 7 批（20 条）

### [ ] encourage the extinction of

- 中文提示：助长……的灭绝
- 类型 / 优先级：collocation / supporting
- Pattern：encourage the extinction of {object}
- Accepted：encourage the extinction of
- 来源：Protecting wild animals
- 原句：I do not believe that planet Earth exists only for the benefit of humans, and there is nothing special about this particular century that means that we suddenly have the right to allow or encourage the extinction of any species.
- Surface：encourage the extinction of
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] for the benefit of

- 中文提示：为了……的利益
- 类型 / 优先级：fixed_phrase / core
- Pattern：for the benefit of {group}
- Accepted：for the benefit of / for the benefit of humans
- 来源：Protecting wild animals
- 原句：I do not believe that planet Earth exists only for the benefit of humans, and there is nothing special about this particular century that means that we suddenly have the right to allow or encourage the extinction of any species.
- Surface：for the benefit of humans
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have the right to

- 中文提示：有权做……
- 类型 / 优先级：fixed_phrase / core
- Pattern：have the right to {action}
- Accepted：have the right to
- 来源：Protecting wild animals
- 原句：I do not believe that planet Earth exists only for the benefit of humans, and there is nothing special about this particular century that means that we suddenly have the right to allow or encourage the extinction of any species.
- Surface：have the right to
- 句子卡关联：无（普通正文句）
- 其他来源：1
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a compelling reason

- 中文提示：有说服力的理由
- 类型 / 优先级：collocation / core
- Pattern：a compelling reason to {action}
- Accepted：a compelling reason
- 来源：Protecting wild animals
- 原句：Furthermore, there is no compelling reason why we should let animals die out.
- Surface：compelling reason
- 句子卡关联：4c1ff5ac-d150-537d-a5d6-8b0fd06fe278
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] exist side by side with

- 中文提示：与……共存
- 类型 / 优先级：collocation / core
- Pattern：exist side by side with {object}
- Accepted：exist side by side with
- 来源：Protecting wild animals
- 原句：There is plenty of room for us to exist side by side with wild animals, and this should be our aim.
- Surface：exist side by side with
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a waste of resources

- 中文提示：对资源的浪费
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a waste of resources
- 来源：Protecting wild animals
- 原句：I also disagree with the idea that protecting animals is a waste of resources.
- Surface：a waste of resources
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] ensure the survival of

- 中文提示：确保……的生存／延续
- 类型 / 优先级：collocation / core
- Pattern：ensure the survival of {object}
- Accepted：ensure the survival of
- 来源：Protecting wild animals
- 原句：It is usually the protection of natural habitats that ensures the survival of wild animals, and most scientists agree that these habitats are also crucial for human survival.
- Surface：ensures the survival of
- 句子卡关联：4c4447fc-9bbf-5e22-8c85-ba8143f06a14
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] absorb carbon dioxide

- 中文提示：吸收二氧化碳
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：absorb carbon dioxide
- 来源：Protecting wild animals
- 原句：For example, rainforests produce oxygen, absorb carbon dioxide and stabilise the Earth’s climate.
- Surface：absorb carbon dioxide
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] far outweigh the costs of

- 中文提示：远远超过……的成本
- 类型 / 优先级：collocation / core
- Pattern：far outweigh the costs of {action}
- Accepted：far outweigh the costs of
- 来源：Protecting wild animals
- 原句：If we destroyed these areas, the costs of managing the resulting changes to our planet would far outweigh the costs of conservation.
- Surface：far outweigh the costs of
- 句子卡关联：10f5261a-aa1f-540a-a06e-ced6247d7222
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] maintain the natural balance

- 中文提示：维持自然平衡
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：maintain the natural balance
- 来源：Protecting wild animals
- 原句：By protecting wild animals and their habitats, we maintain the natural balance of all life on Earth.
- Surface：maintain the natural balance
- 句子卡关联：848db1ba-b554-5af3-9337-5ff5995cd850
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] do everything one can to

- 中文提示：尽己所能去……
- 类型 / 优先级：sentence_frame / core
- Pattern：do everything one can to {action}
- Accepted：do everything one can to / do everything we can to
- 来源：Protecting wild animals
- 原句：In conclusion, we have no right to decide whether or not wild animals should exist, and I believe that we should do everything we can to protect them.
- Surface：do everything we can to
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a range of measures

- 中文提示：一系列措施
- 类型 / 优先级：collocation / supporting
- Pattern：a range of {object}
- Accepted：a range of measures / a range of other measures
- 来源：Can stricter punishments improve road safety?
- 原句：In my view, both punishments and a range of other measures can be used together to promote better driving habits.
- Surface：a range of other measures
- 句子卡关联：无（普通正文句）
- 其他来源：1
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] promote better driving habits

- 中文提示：促进更好的驾驶习惯
- 类型 / 优先级：collocation / supporting
- Pattern：promote {activity}
- Accepted：promote better driving habits
- 来源：Can stricter punishments improve road safety?
- 原句：In my view, both punishments and a range of other measures can be used together to promote better driving habits.
- Surface：promote better driving habits
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] act as a deterrent

- 中文提示：起到威慑作用
- 类型 / 优先级：collocation / core
- Pattern：act as a deterrent to {activity}
- Accepted：act as a deterrent
- 来源：Can stricter punishments improve road safety?
- 原句：Penalties for dangerous drivers can act as a deterrent, meaning that people avoid repeating the same offence.
- Surface：act as a deterrent
- 句子卡关联：754d6f53-5f1a-542d-8021-484552c0923c
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have negative consequences

- 中文提示：产生负面后果
- 类型 / 优先级：collocation / core
- Pattern：have negative consequences for {target}
- Accepted：have negative consequences
- 来源：Can stricter punishments improve road safety?
- 原句：The aim of these punishments is to show dangerous drivers that their actions have negative consequences.
- Surface：have negative consequences
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] pay attention to

- 中文提示：重视／注意……
- 类型 / 优先级：collocation / core
- Pattern：pay attention to {object}
- Accepted：pay attention to / attention could be paid to
- 来源：Can stricter punishments improve road safety?
- 原句：Secondly, more attention could be paid to safe road design.
- Surface：attention could be paid to
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] deter someone from doing something

- 中文提示：阻止／威慑某人做某事
- 类型 / 优先级：sentence_frame / core
- Pattern：deter {person} from {activity}
- Accepted：deter someone from doing something
- 来源：Can stricter punishments improve road safety?
- 原句：For example, signs can be used to warn people, speed bumps and road bends can be added to calm traffic, and speed cameras can help to deter people from driving too quickly.
- Surface：deter people from driving too quickly
- 句子卡关联：6c11ad46-33cf-541a-9d1d-fb11478e4471
- 其他来源：1
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] introduce road safety measures

- 中文提示：推行道路安全措施
- 类型 / 优先级：collocation / supporting
- Pattern：introduce {object}
- Accepted：introduce road safety measures / road safety measures should be introduced
- 来源：Can stricter punishments improve road safety?
- 原句：In conclusion, while punishments can help to prevent bad driving, I believe that other road safety measures should also be introduced.
- Surface：road safety measures should also be introduced
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] make a profit

- 中文提示：赚取利润
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：make a profit
- 来源：Businesses’ social responsibilities
- 原句：Businesses have always sought to make a profit, but it is becoming increasingly common to hear people talk about the social obligations that companies have.
- Surface：make a profit
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] social obligations

- 中文提示：社会责任／义务
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：social obligations / the social obligations
- 来源：Businesses’ social responsibilities
- 原句：Businesses have always sought to make a profit, but it is becoming increasingly common to hear people talk about the social obligations that companies have.
- Surface：the social obligations
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

## 第 8 批（20 条）

### [ ] cover running costs

- 中文提示：支付日常运营成本
- 类型 / 优先级：collocation / core
- Pattern：cover {cost}
- Accepted：cover running costs
- 来源：Businesses’ social responsibilities
- 原句：It seems logical that the priority of any company should be to cover its running costs, such as employees’ wages and payments for buildings and utilities.
- Surface：cover its running costs
- 句子卡关联：615980cc-cea2-5729-bdaa-18553f972367
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] invest in improvements and innovations

- 中文提示：投资改进与创新
- 类型 / 优先级：collocation / core
- Pattern：invest in {field}
- Accepted：invest in improvements and innovations
- 来源：Businesses’ social responsibilities
- 原句：On top of these costs, companies also need to invest in improvements and innovations if they wish to remain successful.
- Surface：invest in improvements and innovations
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] meet the changing needs of

- 中文提示：满足……不断变化的需求
- 类型 / 优先级：collocation / core
- Pattern：meet the changing needs of {group}
- Accepted：meet the changing needs of
- 来源：Businesses’ social responsibilities
- 原句：If a company is unable to pay its bills or meet the changing needs of customers, any concerns about social responsibilities become irrelevant.
- Surface：meet the changing needs of
- 句子卡关联：d1a216a5-ab48-59f0-b6d7-57ad742c5a61
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be in good financial health

- 中文提示：财务状况良好
- 类型 / 优先级：collocation / core
- Pattern：—
- Accepted：be in good financial health / is in good financial health
- 来源：Businesses’ social responsibilities
- 原句：In other words, a company can only make a positive contribution to society if it is in good financial health.
- Surface：is in good financial health
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] make a positive contribution to society

- 中文提示：为社会作出积极贡献
- 类型 / 优先级：collocation / core
- Pattern：make a positive contribution to {target}
- Accepted：make a positive contribution to society
- 来源：Businesses’ social responsibilities
- 原句：In other words, a company can only make a positive contribution to society if it is in good financial health.
- Surface：make a positive contribution to society
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have a role to play in

- 中文提示：在……中可以发挥作用
- 类型 / 优先级：collocation / core
- Pattern：have a role to play in {activity}
- Accepted：have a role to play in / have a wider role to play in
- 来源：Businesses’ social responsibilities
- 原句：On the other hand, companies should not be run with the sole aim of maximising profit; they have a wider role to play in society.
- Surface：have a wider role to play in
- 句子卡关联：2fdbaf32-fdbb-5aa1-9cce-9de4c8c50d68
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] with the sole aim of

- 中文提示：唯一目的是……
- 类型 / 优先级：fixed_phrase / core
- Pattern：with the sole aim of {activity}
- Accepted：with the sole aim of
- 来源：Businesses’ social responsibilities
- 原句：On the other hand, companies should not be run with the sole aim of maximising profit; they have a wider role to play in society.
- Surface：with the sole aim of
- 句子卡关联：2fdbaf32-fdbb-5aa1-9cce-9de4c8c50d68
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] pay a living wage

- 中文提示：支付维持生活的工资
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：pay a living wage
- 来源：Businesses’ social responsibilities
- 原句：For example, they could pay a “living wage” to ensure that workers have a good quality of life.
- Surface：pay a “living wage”
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a proportion of profits

- 中文提示：一定比例的利润
- 类型 / 优先级：collocation / supporting
- Pattern：a proportion of {object}
- Accepted：a proportion of profits / a proportion of their profits
- 来源：Businesses’ social responsibilities
- 原句：I also like the idea that businesses could use a proportion of their profits to support local charities, environmental projects or education initiatives.
- Surface：a proportion of their profits
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] use accounting loopholes

- 中文提示：利用会计漏洞
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：use accounting loopholes / using accounting loopholes
- 来源：Businesses’ social responsibilities
- 原句：Finally, instead of trying to minimise their tax payments by using accounting loopholes, I believe that company bosses should be happy to contribute to society through the tax system.
- Surface：using accounting loopholes
- 句子卡关联：f15d70ed-10c6-5448-8f63-603421d1a7c9
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] place importance on

- 中文提示：重视……
- 类型 / 优先级：collocation / core
- Pattern：place importance on {value}
- Accepted：place importance on / place as much importance on
- 来源：Businesses’ social responsibilities
- 原句：In conclusion, I believe that companies should place as much importance on their social responsibilities as they do on their financial objectives.
- Surface：place as much importance on
- 句子卡关联：38bea868-0bad-53b3-b0af-2854fe5766fd
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：是否与 attach great importance to 合并为同一表达族需人工确认。

### [ ] major drawbacks of

- 中文提示：……的主要弊端
- 类型 / 优先级：collocation / core
- Pattern：major drawbacks of {object}
- Accepted：major drawbacks of
- 来源：City problems and government solutions
- 原句：Cities are often seen as places of opportunity, but there are also some major drawbacks of living in a large metropolis.
- Surface：major drawbacks of
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] the cost of living

- 中文提示：生活成本
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：the cost of living
- 来源：City problems and government solutions
- 原句：The main problem for anyone who hopes to migrate to a large city is that the cost of living is likely to be much higher than it is in a small town or village.
- Surface：the cost of living
- 句子卡关联：0320e515-9b3c-570a-ae22-c540eea10537
- 其他来源：1
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] take steps to tackle

- 中文提示：采取措施解决……
- 类型 / 优先级：collocation / core
- Pattern：take steps to tackle {problem}
- Accepted：take steps to tackle
- 来源：City problems and government solutions
- 原句：However, there are various steps that governments could take to tackle these problems.
- Surface：steps that governments could take to tackle
- 句子卡关联：118a349e-93b7-52a5-a326-fae9ba1a814d
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：需确认是否只做表达族关联而不合并。

### [ ] affordable housing

- 中文提示：可负担住房
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：affordable housing / affordable or social housing
- 来源：City problems and government solutions
- 原句：Firstly, they could invest money in the building of affordable or social housing to reduce the cost of living.
- Surface：affordable or social housing
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a congestion charge

- 中文提示：交通拥堵费
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a congestion charge
- 来源：City problems and government solutions
- 原句：In London, for example, the introduction of a congestion charge for drivers has helped to curb the traffic problem.
- Surface：a congestion charge
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] curb the traffic problem

- 中文提示：遏制交通拥堵问题
- 类型 / 优先级：collocation / core
- Pattern：curb {problem}
- Accepted：curb the traffic problem
- 来源：City problems and government solutions
- 原句：In London, for example, the introduction of a congestion charge for drivers has helped to curb the traffic problem.
- Surface：curb the traffic problem
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] reduce pressure on

- 中文提示：减轻……的压力
- 类型 / 优先级：collocation / core
- Pattern：reduce pressure on {pressure_target}
- Accepted：reduce pressure on / reduce the pressure on
- 来源：City problems and government solutions
- 原句：A third option would be to develop provincial towns and rural areas, by moving industry and jobs to those regions, in order to reduce the pressure on major cities.
- Surface：reduce the pressure on
- 句子卡关联：519ce1be-b51f-509c-aaf4-050882cc37d3
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] enhance quality of life

- 中文提示：提升生活质量
- 类型 / 优先级：collocation / core
- Pattern：enhance the quality of life for {group}
- Accepted：enhance quality of life / enhance the quality of life for
- 来源：City problems and government solutions
- 原句：In conclusion, governments could certainly implement a range of measures to enhance the quality of life for all city residents.
- Surface：enhance the quality of life for
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：与 quality of life 建立表达族但不直接合并，待人工确认。

### [ ] implement a range of measures

- 中文提示：实施一系列措施
- 类型 / 优先级：collocation / core
- Pattern：implement a range of {object}
- Accepted：implement a range of measures
- 来源：City problems and government solutions
- 原句：In conclusion, governments could certainly implement a range of measures to enhance the quality of life for all city residents.
- Surface：implement a range of measures
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

## 第 9 批（20 条）

### [ ] the developed world

- 中文提示：发达国家和地区
- 类型 / 优先级：fixed_phrase / supporting
- Pattern：—
- Accepted：the developed world
- 来源：The rise in one-person households
- 原句：In recent years it has become far more normal for people to live alone, particularly in large cities in the developed world.
- Surface：the developed world
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] in equal measure

- 中文提示：同等程度地
- 类型 / 优先级：fixed_phrase / core
- Pattern：—
- Accepted：in equal measure
- 来源：The rise in one-person households
- 原句：In my opinion, this trend could have both positive and negative consequences in equal measure.
- Surface：in equal measure
- 句子卡关联：a6989730-082d-5532-b9d2-7e5845c1765e
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] on an individual level

- 中文提示：从个人层面看
- 类型 / 优先级：fixed_phrase / core
- Pattern：—
- Accepted：on an individual level
- 来源：The rise in one-person households
- 原句：On an individual level, people who choose to live alone may become more independent and self-reliant than those who live with family members.
- Surface：On an individual level
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] result in greater demand for

- 中文提示：导致对……更大的需求
- 类型 / 优先级：collocation / core
- Pattern：result in greater demand for {service}
- Accepted：result in greater demand for
- 来源：The rise in one-person households
- 原句：From an economic perspective, the trend towards living alone will result in greater demand for housing.
- Surface：result in greater demand for
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] the trend towards

- 中文提示：向……发展的趋势
- 类型 / 优先级：collocation / core
- Pattern：the trend towards {activity}
- Accepted：the trend towards
- 来源：The rise in one-person households
- 原句：From an economic perspective, the trend towards living alone will result in greater demand for housing.
- Surface：the trend towards
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] consider something from the opposite angle

- 中文提示：从相反角度看待……
- 类型 / 优先级：sentence_frame / core
- Pattern：consider {idea} from the opposite angle
- Accepted：consider something from the opposite angle / considered from the opposite angle
- 来源：The rise in one-person households
- 原句：However, the personal and economic arguments given above can be considered from the opposite angle.
- Surface：considered from the opposite angle
- 句子卡关联：b1f62de6-adc4-5abd-800a-7d110ee07481
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] bear the weight of

- 中文提示：承担……的沉重负担
- 类型 / 优先级：collocation / core
- Pattern：bear the weight of {responsibility}
- Accepted：bear the weight of
- 来源：The rise in one-person households
- 原句：They miss out on the emotional support and daily conversation that family or flatmates can provide, and they must bear the weight of all household bills and responsibilities; in this sense, perhaps the trend towards living alone is a negative one.
- Surface：bear the weight of
- 句子卡关联：629776ea-4656-5953-8de3-5fc0e6f7a3c0
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] push up property prices

- 中文提示：推高房价
- 类型 / 优先级：collocation / core
- Pattern：push up {cost}
- Accepted：push up property prices
- 来源：The rise in one-person households
- 原句：Secondly, from the financial point of view, a rise in demand for housing is likely to push up property prices and rents.
- Surface：push up property prices
- 句子卡关联：934be959-cfa7-5b6f-ae39-95ad62e27a51
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be faced with rising costs

- 中文提示：面临不断上涨的成本
- 类型 / 优先级：collocation / core
- Pattern：be faced with rising {cost}
- Accepted：be faced with rising costs / be faced with rising living costs
- 来源：The rise in one-person households
- 原句：While this may benefit some businesses, the general population, including those who live alone, will be faced with rising living costs.
- Surface：be faced with rising living costs
- 句子卡关联：f2f33ee9-fe37-5058-9a4b-cb5d4433905e
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] beneficial and detrimental effects on

- 中文提示：对……的利弊影响
- 类型 / 优先级：collocation / core
- Pattern：beneficial and detrimental effects on {target}
- Accepted：beneficial and detrimental effects on
- 来源：The rise in one-person households
- 原句：In conclusion, the increase in one-person households will have both beneficial and detrimental effects on individuals and on the economy.
- Surface：beneficial and detrimental effects on
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] an improved quality of life

- 中文提示：改善后的生活质量
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：an improved quality of life / improved quality of life
- 来源：Freedom to choose university subjects
- 原句：From a personal perspective, it can be argued that these courses provide more job opportunities, career progression, better salaries, and therefore an improved quality of life for students who take them.
- Surface：an improved quality of life
- 句子卡关联：9f289ff7-319b-5763-9a3f-7a6a576c30d9
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] career progression

- 中文提示：职业发展／晋升
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：career progression
- 来源：Freedom to choose university subjects
- 原句：From a personal perspective, it can be argued that these courses provide more job opportunities, career progression, better salaries, and therefore an improved quality of life for students who take them.
- Surface：career progression
- 句子卡关联：9f289ff7-319b-5763-9a3f-7a6a576c30d9
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] knowledge and skill gaps

- 中文提示：知识与技能缺口
- 类型 / 优先级：collocation / core
- Pattern：—
- Accepted：knowledge and skill gaps
- 来源：Freedom to choose university subjects
- 原句：On the societal level, by forcing people to choose particular university subjects, governments can ensure that any knowledge and skill gaps in the economy are covered.
- Surface：knowledge and skill gaps
- 句子卡关联：c32302d0-ea7c-5000-bc58-f971b91e0228
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] future prosperity

- 中文提示：未来的繁荣
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：future prosperity
- 来源：Freedom to choose university subjects
- 原句：Finally, a focus on technology in higher education could lead to new inventions, economic growth, and greater future prosperity.
- Surface：future prosperity
- 句子卡关联：d0af186f-5278-5fa9-8fbc-b32d65f886d3
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a preferred area of study

- 中文提示：偏好的学习领域
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a preferred area of study / preferred areas of study
- 来源：Freedom to choose university subjects
- 原句：In spite of these arguments, I believe that university students should be free to choose their preferred areas of study.
- Surface：their preferred areas of study
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be passionate about

- 中文提示：对……充满热情
- 类型 / 优先级：collocation / core
- Pattern：be passionate about {activity}
- Accepted：be passionate about / are passionate about
- 来源：Freedom to choose university subjects
- 原句：In my opinion, society will benefit more if our students are passionate about what they are learning.
- Surface：are passionate about
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] value one thing above another

- 中文提示：把……看得比……更重要
- 类型 / 优先级：sentence_frame / core
- Pattern：value {value} above {option}
- Accepted：value one thing above another
- 来源：Freedom to choose university subjects
- 原句：Besides, nobody can really predict which areas of knowledge will be most useful to society in the future, and it may be that employers begin to value creative thinking skills above practical or technical skills.
- Surface：value creative thinking skills above practical or technical skills
- 句子卡关联：ab1f7ac2-ba9f-5187-acc4-9ccfdb49cc84
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a productive member of society

- 中文提示：对社会有贡献的一员
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a productive member of society / productive members of society
- 来源：Ex-prisoners teaching teenagers about crime
- 原句：It is true that ex-prisoners can become normal, productive members of society.
- Surface：productive members of society
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] break the law

- 中文提示：违法
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：break the law / breaking the law
- 来源：Ex-prisoners teaching teenagers about crime
- 原句：I completely agree with the idea that allowing such people to speak to teenagers about their experiences is the best way to discourage them from breaking the law.
- Surface：breaking the law
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] speak from experience

- 中文提示：根据亲身经历来说
- 类型 / 优先级：fixed_phrase / core
- Pattern：—
- Accepted：speak from experience
- 来源：Ex-prisoners teaching teenagers about crime
- 原句：In my opinion, teenagers are more likely to accept advice from someone who can speak from experience.
- Surface：speak from experience
- 句子卡关联：9a643bc2-6768-56b8-802b-3b5014233ff7
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

## 第 10 批（20 条）

### [ ] a criminal lifestyle

- 中文提示：犯罪生活方式
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a criminal lifestyle
- 来源：Ex-prisoners teaching teenagers about crime
- 原句：Reformed offenders can tell young people about how they became involved in crime, the dangers of a criminal lifestyle, and what life in prison is really like.
- Surface：a criminal lifestyle
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] become involved in crime

- 中文提示：卷入犯罪
- 类型 / 优先级：collocation / core
- Pattern：—
- Accepted：become involved in crime / became involved in crime
- 来源：Ex-prisoners teaching teenagers about crime
- 原句：Reformed offenders can tell young people about how they became involved in crime, the dangers of a criminal lifestyle, and what life in prison is really like.
- Surface：became involved in crime
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] dispel the idea that

- 中文提示：消除……这种想法
- 类型 / 优先级：sentence_frame / core
- Pattern：dispel the idea that {idea}
- Accepted：dispel the idea that / dispel any ideas that
- 来源：Ex-prisoners teaching teenagers about crime
- 原句：They can also dispel any ideas that teenagers may have about criminals leading glamorous lives.
- Surface：dispel any ideas that
- 句子卡关联：9b91499e-cf46-5266-b45a-e3e3aec4de6d
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] have a powerful impact

- 中文提示：产生强大的影响
- 类型 / 优先级：collocation / core
- Pattern：have a powerful impact on {target}
- Accepted：have a powerful impact
- 来源：Ex-prisoners teaching teenagers about crime
- 原句：The vivid and perhaps shocking nature of these stories is likely to have a powerful impact.
- Surface：have a powerful impact
- 句子卡关联：f35e3f6f-9589-537b-bd27-96fe8a10fdda
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a credible source of information

- 中文提示：可信的信息来源
- 类型 / 优先级：collocation / core
- Pattern：a credible source of {object}
- Accepted：a credible source of information / credible sources of information
- 来源：Ex-prisoners teaching teenagers about crime
- 原句：A second option would be for school teachers to speak to their students about crime, but I doubt that students would see teachers as credible sources of information about this topic.
- Surface：credible sources of information
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] serve a prison sentence

- 中文提示：服刑
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：serve a prison sentence / serving a prison sentence
- 来源：Ex-prisoners teaching teenagers about crime
- 原句：In conclusion, I fully support the view that people who have turned their lives around after serving a prison sentence could help to deter teenagers from committing crimes.
- Surface：serving a prison sentence
- 句子卡关联：984ba355-94cf-5032-931f-521f04d0b6c0
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] turn one's life around

- 中文提示：彻底改变某人的人生
- 类型 / 优先级：fixed_phrase / core
- Pattern：—
- Accepted：turn one's life around / turn their lives around
- 来源：Ex-prisoners teaching teenagers about crime
- 原句：In conclusion, I fully support the view that people who have turned their lives around after serving a prison sentence could help to deter teenagers from committing crimes.
- Surface：turned their lives around
- 句子卡关联：984ba355-94cf-5032-931f-521f04d0b6c0
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be incompatible with the needs of

- 中文提示：与……的需求不相容
- 类型 / 优先级：collocation / core
- Pattern：be incompatible with the needs of {group}
- Accepted：be incompatible with the needs of
- 来源：Traditional ideas and young people
- 原句：It is true that many older people believe in traditional values that often seem incompatible with the needs of younger people.
- Surface：incompatible with the needs of
- 句子卡关联：881343c0-72a1-5798-8f11-04c108ca7484
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be relevant to

- 中文提示：与……相关／适用于……
- 类型 / 优先级：collocation / core
- Pattern：be relevant to {group}
- Accepted：be relevant to / be relevant for / becoming less relevant for
- 来源：Traditional ideas and young people
- 原句：On the one hand, many of the ideas that elderly people have about life are becoming less relevant for younger people.
- Surface：becoming less relevant for younger people
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] make one's own choices

- 中文提示：自己作出选择
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：make one's own choices / make their own choices
- 来源：Traditional ideas and young people
- 原句：At the same time, the ‘rules’ around relationships are being eroded as young adults make their own choices about who and when to marry.
- Surface：make their own choices
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a disparity between generations

- 中文提示：代际差异
- 类型 / 优先级：collocation / core
- Pattern：a disparity between {group}
- Accepted：a disparity between generations / disparity between the generations
- 来源：Traditional ideas and young people
- 原句：But perhaps the greatest disparity between the generations can be seen in their attitudes towards gender roles.
- Surface：the greatest disparity between the generations
- 句子卡关联：527182d4-a2c8-5afe-bd80-37f1e12d782d
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] traditional roles

- 中文提示：传统角色分工
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：traditional roles
- 来源：Traditional ideas and young people
- 原句：The traditional roles of men and women, as breadwinners and housewives, are no longer accepted as necessary or appropriate by most younger people.
- Surface：The traditional roles
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] be applicable to

- 中文提示：适用于……
- 类型 / 优先级：collocation / core
- Pattern：be applicable to {target}
- Accepted：be applicable to / are applicable to
- 来源：Traditional ideas and young people
- 原句：On the other hand, some traditional views and values are certainly applicable to the modern world.
- Surface：are certainly applicable to
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] attach great importance to

- 中文提示：高度重视……
- 类型 / 优先级：collocation / core
- Pattern：attach great importance to {value}
- Accepted：attach great importance to
- 来源：Traditional ideas and young people
- 原句：For example, older generations attach great importance to working hard, doing one’s best, and taking pride in one’s work, and these behaviours can surely benefit young people as they enter today’s competitive job market.
- Surface：attach great importance to
- 句子卡关联：baaa0270-dbe9-5507-8f39-589b3d259192
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：是否与 place importance on 合并需人工确认。

### [ ] take pride in

- 中文提示：为……感到自豪
- 类型 / 优先级：collocation / core
- Pattern：take pride in {activity}
- Accepted：take pride in / taking pride in
- 来源：Traditional ideas and young people
- 原句：For example, older generations attach great importance to working hard, doing one’s best, and taking pride in one’s work, and these behaviours can surely benefit young people as they enter today’s competitive job market.
- Surface：taking pride in
- 句子卡关联：baaa0270-dbe9-5507-8f39-589b3d259192
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] good manners

- 中文提示：良好的礼貌修养
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：good manners
- 来源：Traditional ideas and young people
- 原句：Other characteristics that are perhaps seen as traditional are politeness and good manners.
- Surface：good manners
- 句子卡关联：无（普通正文句）
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] come into contact with

- 中文提示：与……接触
- 类型 / 优先级：collocation / core
- Pattern：come into contact with {person}
- Accepted：come into contact with
- 来源：Traditional ideas and young people
- 原句：In our globalised world, young adults can expect to come into contact with people from a huge variety of backgrounds, and it is more important than ever to treat others with respect.
- Surface：come into contact with
- 句子卡关联：ec75144f-1ead-5dca-9cd0-5683a854b687
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] treat someone with respect

- 中文提示：尊重地对待……
- 类型 / 优先级：collocation / core
- Pattern：treat {person} with respect
- Accepted：treat someone with respect
- 来源：Traditional ideas and young people
- 原句：In our globalised world, young adults can expect to come into contact with people from a huge variety of backgrounds, and it is more important than ever to treat others with respect.
- Surface：treat others with respect
- 句子卡关联：ec75144f-1ead-5dca-9cd0-5683a854b687
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] a sense of community

- 中文提示：社区归属感
- 类型 / 优先级：collocation / supporting
- Pattern：—
- Accepted：a sense of community / sense of community
- 来源：Traditional ideas and young people
- 原句：Finally, I believe that young people would lead happier lives if they had a more ‘old-fashioned’ sense of community and neighbourliness.
- Surface：a more ‘old-fashioned’ sense of community
- 句子卡关联：e08f236a-8d13-5948-9821-999f28b6ba47
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无

### [ ] dismiss something as irrelevant

- 中文提示：把……斥为无关紧要
- 类型 / 优先级：sentence_frame / core
- Pattern：dismiss {idea} as irrelevant
- Accepted：dismiss something as irrelevant
- 来源：Traditional ideas and young people
- 原句：In conclusion, although the views of older people may sometimes seem unhelpful in today’s world, we should not dismiss all traditional ideas as irrelevant.
- Surface：dismiss all traditional ideas as irrelevant
- 句子卡关联：90f615b0-91a4-5294-93dc-823f40a34388
- 其他来源：0
- 推荐理由：来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。
- 待确认：无
