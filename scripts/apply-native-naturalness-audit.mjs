import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const writeJson = (relativePath, value) => fs.writeFileSync(
  path.join(root, relativePath),
  `${JSON.stringify(value, null, 2)}\n`,
);

const editedAt = "2026-08-18T13:30:00.000Z";
const approvedAt = "2026-08-18T13:35:00.000Z";
const auditReason = "Native-naturalness 全库审计：优先修正现代英语自然度、搭配和语义逻辑，不再机械保留来源结构。";
const approvalReason = "用户于 2026-08-18 明确批准按 native-naturalness 审计清单修改全部问题项。";

const hint = (zh, en) => ({ zh, en });
const sentenceEdits = new Map(Object.entries({
  "4c57ddce-4151-5fe4-bc60-90e3b85b78f7": {
    prompt_zh: "当人们牺牲休息来延长工作时间时，这种过度工作可能造成从持续疲劳到严重健康问题等一系列后果。",
    hints: [hint("过度工作", "overwork"), hint("持续疲劳", "persistent fatigue")],
    reference_answer: "This type of overwork can have effects ranging from persistent fatigue to serious health problems, especially when people sacrifice rest to work longer hours.",
  },
  "c32302d0-ea7c-5000-bc58-f971b91e0228": {
    prompt_zh: "从社会层面看，为紧缺职业提供培训，可以帮助政府填补基本服务中的关键知识和技能缺口。",
    hints: [hint("紧缺职业", "shortage occupations"), hint("基本服务", "essential services")],
    reference_answer: "At a societal level, funding training for shortage occupations can help governments fill critical knowledge and skill gaps in essential services.",
  },
  "a5aa0712-c50c-5dc9-9e64-cc7676238df1": {
    prompt_zh: "如果雇主更重视适应能力而不是狭窄的技术专长，他们可能会更青睐具备广泛问题解决能力的劳动者，而不是只接受过单一任务训练的人。",
    hints: [hint("适应能力", "adaptability"), hint("狭窄的技术专长", "narrow technical expertise")],
    reference_answer: "If employers placed greater value on adaptability than on narrow technical expertise, they might prefer workers with broad problem-solving skills to those trained for a single task.",
  },
  "2398dd45-ce3f-5679-9a01-e6df5b9b7700": {
    prompt_zh: "如果地方政府帮助小企业承担数字化成本，就可能创造就业、提高生产率并增加税收。",
    hints: [hint("数字化成本", "the cost of digitalisation"), hint("生产率", "productivity")],
    reference_answer: "If local governments helped small businesses cover the cost of digitalisation, this could create jobs, raise productivity and increase tax revenue.",
  },
  "8a890de8-ad30-59d2-b08b-1fa9ff4d984f": {
    prompt_zh: "稳定的全职工作正变得不那么常见，因此劳动者无法再像过去那样依赖稳定的月收入。",
    hints: [hint("稳定的全职工作", "secure full-time jobs"), hint("在同等程度上", "to the same extent")],
    reference_answer: "Secure full-time jobs are becoming less common, so workers can no longer rely on a stable monthly income to the same extent.",
  },
  "b5b83dce-1988-5f3c-846e-c5457d387ce2": {
    prompt_zh: "年轻人可能选择参加长期志愿服务项目，而不是一直待在熟悉的环境中。与新伙伴共同解决实际问题，能够帮助他们变得更加自信。",
    hints: [hint("长期志愿服务项目", "long-term volunteer programmes"), hint("熟悉的环境", "familiar surroundings")],
    reference_answer: "Young adults may choose to take part in long-term volunteer programmes rather than remain in familiar surroundings. Working with new people to solve practical problems can help them become more confident.",
  },
  "3bf4d575-d2bd-539a-afa1-4be54d990189": {
    prompt_zh: "如果小企业只根据公众关注度选择项目，它们可能会发现自己难以维持财务上的可行性。",
    hints: [hint("只根据", "solely on the basis of"), hint("财务上可行", "financially viable")],
    reference_answer: "If small businesses choose projects solely on the basis of public attention, they may struggle to remain financially viable.",
  },
  "47cb32a0-3618-5aba-b384-7143221aa483": {
    prompt_zh: "虽然公共监控可能威胁隐私，但为了改善高风险地区的安全，我仍会支持有限度地使用摄像头。",
    hints: [hint("公共监控", "public surveillance"), hint("高风险地区", "high-risk areas")],
    reference_answer: "While public surveillance can threaten privacy, I would still support the limited use of cameras in high-risk areas to improve security.",
  },
  "46c73496-5a73-555f-9e70-9ada1c6a927e": {
    prompt_zh: "我支持限制私家车进入历史城区，但仍必须允许应急车辆通行。",
    hints: [hint("历史城区", "historic centres"), hint("应急车辆", "emergency vehicles")],
    reference_answer: "I support restricting private cars in historic centres, but emergency vehicles must still be allowed access.",
  },
  "b25abf6a-d7c4-512b-bf8c-9bdc687f9390": {
    prompt_zh: "居民通常喜欢参加当地节庆，共同庆祝能够让不同年龄和背景的人产生归属感。",
    hints: [hint("当地节庆", "local festivals"), hint("归属感", "a sense of belonging")],
    reference_answer: "Residents often enjoy taking part in local festivals, and celebrating together can create a sense of belonging across age groups and backgrounds.",
  },
  "30a941a1-8abf-50ee-9181-76681ece5767": {
    prompt_zh: "如果缴纳学费的学生比例下降，大学获得的学费收入相对于课程开设成本也会减少。",
    hints: [hint("缴纳学费的学生", "fee-paying students"), hint("学费收入", "tuition income")],
    reference_answer: "If the proportion of fee-paying students falls, universities will receive less tuition income relative to the cost of running their courses.",
  },
  "6d47d05e-d337-5c0e-860e-7fa08f62b150": {
    prompt_zh: "当远程教育只能依赖印刷材料和广播课程时，获得专业教育的机会要有限得多。",
    hints: [hint("专业教育", "specialist education"), hint("印刷材料", "printed materials")],
    reference_answer: "Access to specialist education was far more limited when distance learning relied solely on printed materials and radio broadcasts.",
  },
  "c807759d-5d76-57b7-9efc-477f13e6c0b4": {
    prompt_zh: "虽然几乎不需要规划，在本地公园散步仍是一种有价值的锻炼方式。",
    hints: [hint("几乎不需要规划", "requires little planning"), hint("锻炼方式", "form of exercise")],
    reference_answer: "Although it requires little planning, walking in a local park is still a valuable form of exercise.",
  },
  "17b39b8e-269d-5fd8-a21c-d384afe71e83": {
    prompt_zh: "获得职业指导的机会不平等，可能改善大型办公室员工的晋升前景，却损害较小地区分支机构员工的发展前景。",
    hints: [hint("职业指导", "career mentoring"), hint("晋升前景", "promotion prospects")],
    reference_answer: "Unequal access to career mentoring can improve promotion prospects for employees in large offices while harming those of staff in smaller regional branches.",
  },
  "2161555a-cd67-56d7-8e29-0355efff4538": {
    prompt_zh: "如果公司决定任命相同数量的内部和外部候选人担任管理职位，就必须从两类人中都获得足够多的合格申请者。",
    hints: [hint("任命", "appoint"), hint("足够多的合格申请者", "a sufficiently large pool of qualified applicants")],
    reference_answer: "If a company decided to appoint equal numbers of internal and external candidates to management roles, it would need a sufficiently large pool of qualified applicants from both groups.",
  },
  "45148b83-50ef-592d-842a-a1b4baa1ea39": {
    prompt_zh: "公共信息宣传活动的目标应当是向公民提供他们此前不了解的信息。",
    hints: [hint("公共信息宣传活动", "public-information campaign"), hint("此前不了解", "did not previously have")],
    reference_answer: "The aim of a public-information campaign should be to give citizens information they did not previously have.",
  },
  "472d9154-7880-5486-9f65-bf1af775a89a": {
    prompt_zh: "确保公共决策透明，通常要求公开并解释重大政策选择背后的证据，而这可以通过多种方式完成。",
    hints: [hint("公共决策", "public decision-making"), hint("重大政策选择", "major policy choices")],
    reference_answer: "Ensuring transparency in public decision-making usually requires the evidence behind major policy choices to be published and explained, which can be done in various ways.",
  },
  "412621a2-9508-511e-a015-d4d303b25a63": {
    prompt_zh: "从早期职业发展来看，选择参加学徒培训而不是走纯学术路线的中学毕业生，可能更快获得实践技能和信心。",
    hints: [hint("学徒培训", "an apprenticeship"), hint("纯学术路线", "a purely academic route")],
    reference_answer: "In terms of early career development, school-leavers who enter an apprenticeship rather than pursue a purely academic route may gain practical skills and confidence more quickly.",
  },
  "f52a20db-6eeb-53c5-991a-f88133683c5f": {
    prompt_zh: "公共交通不仅仅是把人从一个地方送到另一个地方的工具，它也在确保人们平等获得工作和基本服务方面发挥重要作用。",
    hints: [hint("把人从一个地方送到另一个地方", "move people from place to place"), hint("基本服务", "essential services")],
    reference_answer: "Public transport does more than move people from place to place; it also plays a vital role in ensuring equal access to jobs and essential services.",
  },
  "40d0799a-b361-5cc3-9d3e-3a19766c542a": {
    prompt_zh: "政府推迟维护老化基础设施，短期内或许能减少公共支出，但长期来看会增加安全风险和维修成本。",
    hints: [hint("老化基础设施", "ageing infrastructure"), hint("维修成本", "repair costs")],
    reference_answer: "Governments may reduce public spending in the short term by postponing maintenance of ageing infrastructure, but this will increase safety risks and repair costs in the long term.",
  },
  "2f680eff-ba5a-5bc7-bfa7-e8a3a06e2a5c": {
    prompt_zh: "虽然工作满意度因人而异且难以衡量，但大多数员工都需要某些基本的工作条件才能获得这种感受。",
    hints: [hint("工作满意度", "job satisfaction"), hint("基本的工作条件", "basic workplace conditions")],
    reference_answer: "Although job satisfaction is personal and difficult to measure, most employees need certain basic workplace conditions in order to experience it.",
  },
  "4adea781-2456-500a-81c9-862965000c21": {
    prompt_zh: "规律运动能够带来一系列好处，从增强体力到改善情绪稳定性，而人们可能以不同方式感受到这些益处。",
    hints: [hint("情绪稳定性", "emotional stability"), hint("以不同方式", "in different ways")],
    reference_answer: "Regular exercise can provide a range of benefits, from greater physical energy to improved emotional stability, and people may experience these benefits in different ways.",
  },
  "d6b2594d-d627-5908-b6cf-1524ea5b6d78": {
    prompt_zh: "虽然几乎不可能保证招聘完全公平，但大多数人都会同意，要建立值得信赖的招聘流程，需要满足一些基本条件。",
    hints: [hint("招聘", "recruitment"), hint("值得信赖的流程", "a trustworthy process")],
    reference_answer: "Although it is almost impossible to guarantee complete fairness in recruitment, most people would agree that certain basic conditions are needed to create a trustworthy process.",
  },
  "31d3ee76-5a97-57e1-96b4-b866af4fa285": {
    prompt_zh: "强烈的归属感通常通过与邻居定期参加共同活动而形成，很少有居民会满足于缺乏有意义社会互动的生活。",
    hints: [hint("共同活动", "shared activities"), hint("有意义的社会互动", "meaningful social interaction")],
    reference_answer: "A strong sense of belonging often develops through regular shared activities with neighbours, and few residents are content to live without meaningful social interaction.",
  },
  "8d76f3a0-c2f8-503b-ac66-b7b6902dc4c0": {
    prompt_zh: "定期工作场所检查应当促使雇主更加留心并承担责任，同时更快纠正安全问题。",
    hints: [hint("工作场所检查", "workplace inspections"), hint("承担责任", "accountable")],
    reference_answer: "Regular workplace inspections should encourage employers to be more attentive and accountable and to correct safety failures more quickly.",
  },
  "66a5b64a-cb8f-57ef-b046-953bed68fdee": {
    prompt_zh: "年轻人在承担大额债务前接受教育至关重要。学校可以提供金融教育，大额贷款获批前也可以强制提供咨询。",
    hints: [hint("大额债务", "substantial debt"), hint("强制咨询", "mandatory counselling")],
    reference_answer: "It is vital to educate young adults before they take on substantial debt. Financial education could be provided in schools or through mandatory counselling before a large loan is approved.",
  },
  "6c11ad46-33cf-541a-9d1d-fb11478e4471": {
    prompt_zh: "预警系统可以提醒居民，标记清晰的疏散路线可以引导人们远离危险，定期应急演练则能帮助社区快速响应。",
    hints: [hint("预警系统", "early-warning systems"), hint("疏散路线", "evacuation routes")],
    reference_answer: "Early-warning systems can alert residents, clearly marked evacuation routes can guide them away from danger, and regular emergency drills can prepare communities to respond quickly.",
  },
  "615980cc-cea2-5729-bdaa-18553f972367": {
    prompt_zh: "公立医院的首要任务应当是维持基本临床能力，包括急诊护理、充足设备和足够人员。",
    hints: [hint("临床能力", "clinical capacity"), hint("足够人员", "sufficient staff")],
    reference_answer: "The priority of a public hospital should be to maintain essential clinical capacity, including emergency care, adequate equipment and sufficient staff.",
  },
  "d1a216a5-ab48-59f0-b6d7-57ad742c5a61": {
    prompt_zh: "如果学校系统无法保障学生安全或提供可靠的基础教学，那么关于时髦教育技术的讨论就无关紧要。",
    hints: [hint("教育技术", "educational technology"), hint("无关紧要", "beside the point")],
    reference_answer: "If a school system cannot keep students safe or provide reliable basic teaching, debates about fashionable educational technology are beside the point.",
  },
  "f15d70ed-10c6-5448-8f63-603421d1a7c9": {
    prompt_zh: "大型制造商不应通过发布选择性数据掩盖糟糕的环保表现，而应如实披露环境影响，并把报告提交独立公开审计。",
    hints: [hint("环保表现", "environmental performance"), hint("独立公开审计", "independent public audit")],
    reference_answer: "Instead of hiding poor environmental performance by publishing selective data, large manufacturers should disclose their environmental impact honestly and submit their reports to independent public audit.",
  },
  "eb752437-a79a-55c0-84de-b9e78a28679b": {
    prompt_zh: "与小型学校相比，大型中学提供的同伴支持可能更弱，也更容易让学生感到自己默默无闻，从而增加被孤立和欺凌未被发现的风险。",
    hints: [hint("同伴支持", "peer support"), hint("未被发现的欺凌", "undetected bullying")],
    reference_answer: "Compared with smaller schools, large secondary schools may provide weaker peer support and make students feel more anonymous, increasing the risk of isolation and undetected bullying.",
  },
  "519ce1be-b51f-509c-aaf4-050882cc37d3": {
    prompt_zh: "另一种选择是加强地区大学，把更多科研经费和专业课程投向首都以外的院校，从而缩小地区教育差距。",
    hints: [hint("地区大学", "regional universities"), hint("地区教育差距", "regional inequalities in education")],
    reference_answer: "A further option would be to strengthen regional universities by directing more research funding and specialist courses to institutions outside capital cities, thereby reducing regional inequalities in education.",
  },
  "a6989730-082d-5532-b9d2-7e5845c1765e": {
    prompt_zh: "远程办公的发展可能提高灵活性，同时以相近程度削弱职场凝聚力。",
    hints: [hint("职场凝聚力", "workplace cohesion"), hint("以相近程度", "to a similar extent")],
    reference_answer: "The growth of remote work could improve flexibility while weakening workplace cohesion to a similar extent.",
  },
  "461ee6ef-b680-5361-ae43-f18f9685112c": {
    prompt_zh: "参加工作实习的学生需要与同事沟通、按时完成任务并解决实际问题，这些都是宝贵的职业技能；因此，让更多学生获得规范实习机会可以被视为积极的发展。",
    hints: [hint("工作实习", "a work placement"), hint("规范实习", "structured work placements")],
    reference_answer: "A student who completes a work placement will need to communicate with colleagues, meet deadlines and solve practical problems, all of which are valuable professional skills; wider access to structured work placements can therefore be seen as a positive development.",
  },
  "629776ea-4656-5953-8de3-5fc0e6f7a3c0": {
    prompt_zh: "个体经营者得不到带薪休假和行政支持，还必须应对收入不确定性，并独自承担保险和退休规划的全部成本。从这个意义上说，不稳定个体就业的增长可能是消极的发展。",
    hints: [hint("个体经营者", "self-employed workers"), hint("收入不确定性", "income uncertainty")],
    reference_answer: "Self-employed workers miss out on paid leave and administrative support, and they must manage income uncertainty while bearing the full cost of insurance and retirement planning. In this sense, the growth of insecure self-employment may be a negative development.",
  },
  "934be959-cfa7-5b6f-ae39-95ad62e27a51": {
    prompt_zh: "对知名私立学校入学名额的需求上升，可能会推高学费。",
    hints: [hint("知名私立学校", "prestigious private schools"), hint("学费", "tuition fees")],
    reference_answer: "Rising demand for places at prestigious private schools is likely to push up tuition fees.",
  },
  "f2f33ee9-fe37-5058-9a4b-cb5d4433905e": {
    prompt_zh: "虽然旅游业快速增长可能使酒店经营者和旅行社受益，但包括低收入租户在内的当地居民可能面临更高的租金和承受更大压力的公共服务。",
    hints: [hint("低收入租户", "low-income tenants"), hint("承受更大压力", "greater strain")],
    reference_answer: "While rapid tourism growth may benefit hotel owners and tour operators, local residents, including low-income tenants, may face higher rents and greater strain on public services.",
  },
  "9b91499e-cf46-5266-b45a-e3e3aec4de6d": {
    prompt_zh: "清晰的性能数据可以消除消费者对电动汽车不可靠的看法。",
    hints: [hint("性能数据", "performance data"), hint("电动汽车", "electric cars")],
    reference_answer: "Clear performance data can dispel any ideas that consumers may have about electric cars being unreliable.",
  },
  "cce55d88-a661-5149-a171-de0c92c92268": {
    prompt_zh: "虽然忙碌的员工可能会忽略笼统的网络安全警告，但许多人会很想参加一场现场演示，了解真实网络攻击是如何发生的。",
    hints: [hint("网络安全警告", "cybersecurity warnings"), hint("如何发生", "how a real cyberattack unfolds")],
    reference_answer: "While busy employees may ignore generic cybersecurity warnings, many would be keen to attend a live demonstration showing how a real cyberattack unfolds.",
  },
  "f35e3f6f-9589-537b-bd27-96fe8a10fdda": {
    prompt_zh: "医疗事故的亲历叙述具有个人性，情感表达也很直接，因此很可能对医院管理者产生强大影响。",
    hints: [hint("亲历叙述", "first-hand accounts"), hint("医疗事故", "medical errors")],
    reference_answer: "First-hand accounts of medical errors are personal and emotionally direct, so they are likely to have a powerful impact on hospital managers.",
  },
  "984ba355-94cf-5032-931f-521f04d0b6c0": {
    prompt_zh: "从长期债务中恢复并重建生活的人，可以教年轻人如何避免有害借贷。",
    hints: [hint("重建生活", "rebuilt their lives"), hint("有害借贷", "harmful borrowing")],
    reference_answer: "People who have rebuilt their lives after long-term debt could teach young adults how to avoid harmful borrowing.",
  },
  "881343c0-72a1-5798-8f11-04c108ca7484": {
    prompt_zh: "一些雇主仍实行严格固定的办公时间，而这种安排似乎与承担照护责任的员工需求不相容。",
    hints: [hint("严格固定的办公时间", "rigid office schedules"), hint("照护责任", "caring responsibilities")],
    reference_answer: "Some employers maintain rigid office schedules that seem incompatible with the needs of employees with caring responsibilities.",
  },
  "73240a91-6dfa-5c4c-a66b-69e39051753b": {
    prompt_zh: "过去，大学生常被建议在一个范围狭窄的技术领域接受训练；但今天的毕业生希望职业生涯拥有更大的灵活性和多样性。",
    hints: [hint("范围狭窄的技术领域", "a narrowly defined technical field"), hint("职业生涯", "careers")],
    reference_answer: "In the past, university students were often advised to train in a narrowly defined technical field, but today’s graduates expect greater flexibility and variety from their careers.",
  },
  "527182d4-a2c8-5afe-bd80-37f1e12d782d": {
    prompt_zh: "城乡居民之间最大的差异，或许体现在他们对扩建公共交通的态度上。",
    hints: [hint("城乡居民", "urban and rural residents"), hint("扩建公共交通", "expanding public transport")],
    reference_answer: "Perhaps the greatest difference between urban and rural residents lies in their attitudes towards expanding public transport.",
  },
  "e08f236a-8d13-5948-9821-999f28b6ba47": {
    prompt_zh: "如果大型公寓楼的居民对邻居有更强的责任感，他们会感到更安全，也不会那么孤立。",
    hints: [hint("大型公寓楼", "large apartment blocks"), hint("责任感", "a sense of responsibility")],
    reference_answer: "Residents of large apartment blocks would feel safer and less isolated if they had a stronger sense of responsibility towards their neighbours.",
  },
  "0af9af95-37e0-504b-b70b-d99940f26626": {
    prompt_zh: "即使不太关心气候变化的人，也很可能已经注意到近年来极端天气变得更加频繁。",
    hints: [hint("极端天气", "extreme weather"), hint("更加频繁", "more frequent")],
    reference_answer: "Even people with little interest in climate change are likely to have noticed that extreme weather has become more frequent in recent years.",
  },
  "0df67bb3-f952-5d6c-a88a-c675dfbaf25d": {
    prompt_zh: "城市住房市场的压力已经变得如此严重，以至于许多年轻人再也无力买房。",
    hints: [hint("住房市场", "housing markets"), hint("如此严重", "so intense")],
    reference_answer: "Pressure in urban housing markets has become so intense that many young people can no longer afford to buy a home.",
  },
}));

const collocationEdits = new Map(Object.entries({
  "3a1523a2-b19b-5eaf-a726-5380e93962ce": { prompt_zh: "政府公共卫生网站通常是可信的信息来源。", hints: [hint("公共卫生", "public-health")], reference_answer: "A government public-health website is usually a credible source of information." },
  "ce2d09d7-3dc9-52c3-ae31-71560adaeb37": { prompt_zh: "在严重能源短缺期间，政府可能把临时限电视为一种不得已的做法。", hints: [hint("临时限电", "temporary electricity rationing"), hint("严重能源短缺", "a severe energy shortage")], reference_answer: "Governments may view temporary electricity rationing as a necessary evil during a severe energy shortage." },
  "c3d1b6c2-c326-580d-8cd8-670390c7c7c4": { prompt_zh: "由于就业前景良好，计算机专业是许多学生偏好的学习领域。", hints: [hint("计算机专业", "computing"), hint("就业前景", "employment prospects")], reference_answer: "For many students, computing is a preferred area of study because it offers strong employment prospects." },
  "6df8af48-5583-5493-a3a6-31447290f4b8": { prompt_zh: "终身学习能够帮助人们更长久地保持富有成效的职业生涯。", hints: [hint("终身学习", "lifelong learning")], reference_answer: "Lifelong learning can help people enjoy a productive working life for longer." },
  "f3f62d75-d893-519d-a868-1bcf0e470cc1": { prompt_zh: "由公共资助项目产生的一部分利润，应当重新投入员工培训。", hints: [hint("公共资助项目", "publicly funded projects"), hint("重新投入", "reinvested")], reference_answer: "A proportion of profits from publicly funded projects should be reinvested in employee training." },
  "4e78e474-bfe5-5125-8d2b-78b3e947efab": { prompt_zh: "对知名私立学校入学名额的需求上升，可能会推高学费。", hints: [hint("知名私立学校", "prestigious private schools"), hint("学费", "tuition fees")], reference_answer: "A rise in demand for places at prestigious private schools is likely to push up tuition fees." },
  "34291088-b154-5e4a-a7af-8dba3220915d": { prompt_zh: "捐款大幅下降会使社区收容所面临资金不足的风险。", hints: [hint("捐款大幅下降", "a sharp fall in donations"), hint("社区收容所", "community shelters")], reference_answer: "A sharp fall in donations would create a risk of insufficient funding for community shelters." },
  "56e4432a-c5f9-5b22-89fb-ac6d9554da5c": { prompt_zh: "只关注项目的初始成本，反映了一种目光短浅的观点。", hints: [hint("反映", "reflects"), hint("初始成本", "initial cost")], reference_answer: "Focusing only on the project’s initial cost reflects a shortsighted view." },
  "02e1087e-0363-5024-882a-1f38e13a34c7": { prompt_zh: "对非法倾倒废物的处罚可以起到威慑作用，使企业不太可能再次违法。", hints: [hint("非法倾倒废物", "illegal dumping"), hint("再次违法", "repeat the offence")], reference_answer: "Penalties for illegal dumping can act as a deterrent by making companies less likely to repeat the offence." },
  "193fe72d-0013-5f2b-953a-a85d6b3aa921": { prompt_zh: "招聘委员会不应以牺牲选出最优秀候选人为代价，追求男女比例相等。", hints: [hint("招聘委员会", "recruitment panels"), hint("以牺牲选出最优秀候选人为代价", "at the expense of selecting the strongest candidates")], reference_answer: "Recruitment panels should not aim for equal proportions of men and women at the expense of selecting the strongest candidates." },
  "d8a4022a-dfb6-5c10-8a1d-6b179050aa84": { prompt_zh: "拥有足够储蓄的退休人员或许不必为支付基本开支而忧虑。", hints: [hint("退休人员", "retirees"), hint("基本开支", "basic expenses")], reference_answer: "Retirees with adequate savings may be free from anxieties about meeting their basic expenses.", priority: "supporting", usage_note: "较正式且不宜机械套用；现代一般表达通常用 free from anxiety about。复数 anxieties 只在指多种具体忧虑时使用。" },
  "8252594c-8996-57c2-b394-b6fc0a64a15e": { prompt_zh: "个体经营者往往要承受财务不确定性的压力，同时独自负责保险和退休规划。", hints: [hint("个体经营者", "self-employed workers"), hint("财务不确定性", "financial uncertainty")], reference_answer: "Self-employed workers often bear the weight of financial uncertainty as well as full responsibility for insurance and retirement planning." },
  "b2822d0b-c050-5a90-a1b2-2decc1d2e927": { prompt_zh: "在没有稳定工作的情况下，一些年轻人可能会卷入犯罪。", hints: [hint("稳定工作", "stable employment")], reference_answer: "Without stable employment, some young people may become involved in crime." },
  "209db801-8418-5d78-a879-fe21392161d4": { prompt_zh: "经常乘坐公共交通的通勤者，不可能没有注意到近几个月票价大幅上涨。", hints: [hint("通勤者", "regular commuters"), hint("票价大幅上涨", "fares have risen sharply")], reference_answer: "Regular commuters cannot have failed to notice that fares have risen sharply in recent months.", priority: "supporting", usage_note: "正式且强调意味很强，只在证据十分明显时使用；一般现代写作优先用 are likely to have noticed。" },
  "013dfc34-f91e-5e4d-9bb2-c8672db61fc7": { prompt_zh: "国际学生通过在住房、交通和本地服务上的消费为经济作出贡献。", hints: [hint("消费", "spending"), hint("本地服务", "local services")], reference_answer: "International students contribute to the economy through their spending on housing, transport and local services." },
  "6e521974-1afa-51e2-a846-72f3cd0540ba": { prompt_zh: "随着稳定的全职工作变少，劳动者无法再指望获得稳定的月收入。", hints: [hint("稳定的全职工作", "secure full-time jobs"), hint("稳定的月收入", "a stable monthly income")], reference_answer: "As secure full-time jobs become less common, workers can no longer count on receiving a stable monthly income." },
  "882ab567-ea8f-5aea-ba46-7aad575c4a97": { prompt_zh: "拥堵费可以帮助缓解人口稠密的市中心所面临的交通问题。", hints: [hint("拥堵费", "a congestion charge"), hint("人口稠密", "densely populated")], reference_answer: "A congestion charge can help to curb the traffic problem in densely populated city centres.", priority: "supporting", usage_note: "来源表达可理解，但现代写作通常优先使用 curb traffic congestion，含义更精确。" },
  "3f8d73c9-188a-55b9-92d1-f70d2e234081": { prompt_zh: "奖励捕杀濒危动物的政策，实际上会助长这些物种的灭绝。", hints: [hint("奖励捕杀", "rewards the killing of"), hint("濒危动物", "endangered animals")], reference_answer: "A policy that rewards the killing of endangered animals would effectively encourage the extinction of those species.", priority: "supporting", usage_note: "只用于行为或政策主动助长灭绝的语境；描述非主观后果时优先用 contribute to or hasten the extinction of。" },
  "4862db08-4eb3-5dc1-a083-37fe05c544fd": { prompt_zh: "有些人把简单的乡村生活浪漫化，认为它能让人无忧无虑。", hints: [hint("浪漫化", "romanticise"), hint("简单的乡村生活", "a simple rural life")], reference_answer: "Some people romanticise a simple rural life as offering freedom from care.", priority: "supporting", usage_note: "偏文学化；care 在这里表示忧虑而不是照护。保留用于来源识别，不作为 IELTS 写作中的优先表达。" },
  "efef0e16-8cd6-5543-8905-3619ecb26b6e": { prompt_zh: "可负担住房和便利的医疗服务有助于满足低收入社区的基本需求。", hints: [hint("便利的医疗服务", "accessible healthcare"), hint("低收入社区", "low-income communities")], reference_answer: "Affordable housing and accessible healthcare help to fulfil basic needs in low-income communities.", usage_note: "fulfil a need 是自然搭配；在一般语境中 meet basic needs 更常见。" },
  "c4aa0ad0-65a8-5fba-a707-7a2323812e1d": { prompt_zh: "获得职业指导的机会不平等，可能改善大型办公室员工的晋升前景，却损害较小地区分支机构员工的发展前景。", hints: [hint("职业指导", "career mentoring"), hint("晋升前景", "promotion prospects")], reference_answer: "Unequal access to career mentoring may improve promotion prospects for employees in large offices but harm the prospects of staff in smaller regional branches." },
  "705be317-eb4e-5c63-a949-20973e44a458": { prompt_zh: "医疗事故的亲历叙述具有个人性，情感表达也很直接，因此很可能对医院管理者产生强大影响。", hints: [hint("亲历叙述", "first-hand accounts"), hint("医疗事故", "medical errors")], reference_answer: "First-hand accounts of medical errors are personal and emotionally direct, so they are likely to have a powerful impact on hospital managers." },
  "4946effb-24a3-5d10-b084-87be30254ea2": { prompt_zh: "所有儿童都有权接受安全且优质的教育。", hints: [hint("优质的", "high-quality")], reference_answer: "All children have the right to a safe, high-quality education." },
  "b1ef75b4-4261-5b50-b51f-92008b06591a": { prompt_zh: "远程办公可能在提高灵活性的同时，以同样程度削弱职场凝聚力。", hints: [hint("灵活性", "flexibility"), hint("职场凝聚力", "workplace cohesion")], reference_answer: "Remote work may improve flexibility and weaken workplace cohesion in equal measure." },
  "8210b648-db31-5780-a378-8319aca67ae0": { prompt_zh: "虽然工作满意度因人而异且难以衡量，但大多数员工都需要某些基本的工作条件才能获得这种感受。", hints: [hint("基本的工作条件", "basic workplace conditions")], reference_answer: "Although job satisfaction is personal and difficult to measure, most employees need certain basic workplace conditions in order to experience it." },
  "1821a3d3-4bd7-5555-af33-c4e6a9dc3f95": { prompt_zh: "许多社区体育俱乐部以志愿方式运营。", hints: [hint("运营", "run")], reference_answer: "Many community sports clubs are run on a volunteer basis." },
  "2f4724e9-44fe-556f-9f5d-abc1dbe1a7e9": { prompt_zh: "高昂的借贷成本使许多年轻家庭难以偿还房贷。", hints: [hint("借贷成本", "borrowing costs")], reference_answer: "High borrowing costs make it difficult for many young families to pay a mortgage." },
  "9bc9cf92-d653-5459-895c-574ddaa15810": { prompt_zh: "弹性工作安排能够带来更大的自主性、更低的通勤成本和更多陪伴家人的时间，从而改善许多员工的生活质量。", hints: [hint("自主性", "autonomy"), hint("通勤成本", "commuting costs")], reference_answer: "Flexible working arrangements can provide greater autonomy, lower commuting costs and more time with family, thereby improving many employees’ quality of life." },
  "b3eaff3d-2afe-55eb-93a3-4f5afff51c93": { prompt_zh: "移民能够促进大城市丰富的文化多样性。", hints: [hint("移民", "immigration")], reference_answer: "Immigration can contribute to the rich cultural diversity of large cities." },
  "06973671-7d93-5246-b81e-0eec9b6eccff": { prompt_zh: "福利制度绝不应为了行政便利而牺牲人的尊严。", hints: [hint("福利制度", "a welfare system"), hint("行政便利", "administrative convenience")], reference_answer: "A welfare system should never sacrifice human dignity for administrative convenience." },
  "47863a3b-5ab1-5e8f-b0fa-fdcc3d62a72f": { prompt_zh: "从运动中获得乐趣的儿童，更有可能保持身体活跃。", hints: [hint("保持身体活跃", "remain physically active")], reference_answer: "Children who take pleasure in sport are more likely to remain physically active." },
  "45aa55f2-59e9-569c-8df3-39b2c58ec677": { prompt_zh: "大学必须采取措施解决毕业生的技能缺口。", hints: [hint("技能缺口", "skills gaps")], reference_answer: "Universities must take steps to tackle skills gaps among graduates." },
  "c67c0d66-74a3-53a9-82f7-9a193293460a": { prompt_zh: "跨国公司不应利用会计漏洞逃避缴纳其应承担的税款。", hints: [hint("跨国公司", "multinational companies"), hint("应承担的税款", "their fair share of tax")], reference_answer: "Multinational companies should not use accounting loopholes to avoid paying their fair share of tax." },
  "3eb37c58-cd54-5ebc-97ab-068cda6c49c8": { prompt_zh: "公立大学的办学不应以提高排名为唯一目标；它们还应在国家教育体系中发挥更广泛的作用。", hints: [hint("提高排名", "improving their rankings"), hint("国家教育体系", "the national education system")], reference_answer: "Public universities should not be run with the sole aim of improving their rankings; they have a wider role to play in the national education system." },
}));

function appendReview(history, action, reviewer, reason, reviewedAt) {
  if (history.some((event) => event.action === action && event.reason === reason)) return;
  history.push({ action, reviewer, reason, reviewed_at: reviewedAt });
}

function sameHints(left = [], right = []) {
  return left.length === right.length
    && left.every((item, index) => item.zh === right[index]?.zh && item.en === right[index]?.en);
}

function buildFeedbackPattern(referenceAnswer, hints) {
  let pattern = referenceAnswer;
  let replaced = 0;
  for (const item of hints) {
    const index = pattern.toLocaleLowerCase("en").indexOf(item.en.toLocaleLowerCase("en"));
    if (index < 0) continue;
    replaced += 1;
    pattern = `${pattern.slice(0, index)}{content_${replaced}}${pattern.slice(index + item.en.length)}`;
  }
  if (replaced === 0) throw new Error(`Cannot build feedback pattern for: ${referenceAnswer}`);
  return pattern;
}

function updateSentenceCard(card, edit) {
  const seed = card.exercise_seed?.slot_replacement?.[0] ?? card.exercise_seed?.guided_application;
  if (!seed) throw new Error(`Missing Use seed for sentence card ${card.id}`);
  const feedbackPattern = card.exercise_seed?.slot_replacement?.[0]
    ? buildFeedbackPattern(edit.reference_answer, edit.hints)
    : null;
  const unchanged = seed.prompt_zh === edit.prompt_zh
    && seed.reference_answer === edit.reference_answer
    && card.transfer_example === edit.reference_answer
    && sameHints(seed.hints, edit.hints)
    && (feedbackPattern === null || seed.feedback_pattern === feedbackPattern);
  if (unchanged) return false;
  seed.prompt_zh = edit.prompt_zh;
  seed.hints = edit.hints;
  seed.reference_answer = edit.reference_answer;
  if (feedbackPattern !== null) {
    seed.feedback_pattern = feedbackPattern;
    card.schema_version = "1.1.0";
  }
  card.transfer_example = edit.reference_answer;
  card.content_revision += 1;
  card.updated_at = editedAt;
  return true;
}

const approvedCards = readJson("data/approved_cards.seed.json");
const candidateCards = readJson("data/candidate_cards.json");
const usePromptCandidates = readJson("data/use_prompt_candidates.json");

for (const [id, edit] of sentenceEdits) {
  const approved = approvedCards.find((card) => card.id === id);
  if (!approved) throw new Error(`Unknown approved sentence card ${id}`);
  updateSentenceCard(approved, edit);

  const candidate = candidateCards.find((item) => item.card?.id === id);
  if (!candidate) throw new Error(`Unknown sentence candidate for card ${id}`);
  updateSentenceCard(candidate.card, edit);
  candidate.updated_at = approvedAt;
  appendReview(candidate.review_history, "edited", "Codex", auditReason, editedAt);
  appendReview(candidate.review_history, "approved", "user", approvalReason, approvedAt);

  const promptCandidate = usePromptCandidates.items.find((item) => item.card_id === id);
  if (promptCandidate) {
    promptCandidate.prompt_zh = edit.prompt_zh;
    promptCandidate.hints = edit.hints;
    promptCandidate.reference_answer = edit.reference_answer;
    promptCandidate.feedback_pattern = promptCandidate.mode === "structure"
      ? buildFeedbackPattern(edit.reference_answer, edit.hints)
      : null;
    promptCandidate.review_status = "approved";
  }
}

for (const promptCandidate of usePromptCandidates.items) {
  const approved = approvedCards.find((card) => card.id === promptCandidate.card_id);
  if (!approved) throw new Error(`Unknown approved sentence card ${promptCandidate.card_id}`);
  if (promptCandidate.mode === "structure") {
    const feedbackPattern = approved.exercise_seed.slot_replacement?.[0]?.feedback_pattern
      ?? buildFeedbackPattern(promptCandidate.reference_answer, promptCandidate.hints);
    const approvedSeed = approved.exercise_seed.slot_replacement?.[0];
    if (!approvedSeed) throw new Error(`Missing approved slot replacement for ${promptCandidate.card_id}`);
    if (approvedSeed.feedback_pattern !== feedbackPattern) {
      approvedSeed.feedback_pattern = feedbackPattern;
      approved.schema_version = "1.1.0";
      approved.content_revision += 1;
      approved.updated_at = editedAt;
    }
    const candidate = candidateCards.find((item) => item.card?.id === promptCandidate.card_id);
    if (!candidate) throw new Error(`Unknown sentence candidate for card ${promptCandidate.card_id}`);
    const candidateSeed = candidate.card.exercise_seed.slot_replacement?.[0];
    if (!candidateSeed) throw new Error(`Missing candidate slot replacement for ${promptCandidate.card_id}`);
    if (candidateSeed.feedback_pattern !== feedbackPattern) {
      candidateSeed.feedback_pattern = feedbackPattern;
      candidate.card.schema_version = "1.1.0";
      candidate.card.content_revision += 1;
      candidate.card.updated_at = editedAt;
      candidate.updated_at = approvedAt;
      appendReview(candidate.review_history, "edited", "Codex", auditReason, editedAt);
      appendReview(candidate.review_history, "approved", "user", approvalReason, approvedAt);
    }
    promptCandidate.feedback_pattern = feedbackPattern;
  } else {
    promptCandidate.feedback_pattern = null;
  }
}
usePromptCandidates.schema_version = "1.1.0";

const approvedCollocations = readJson("data/approved_collocations.seed.json");
const collocationUseCandidates = readJson("data/collocation_use_prompt_candidates.json");

for (const [id, edit] of collocationEdits) {
  const collocation = approvedCollocations.find((item) => item.id === id);
  if (!collocation) throw new Error(`Unknown approved collocation ${id}`);
  const seed = collocation.exercise_seed?.guided_application;
  if (!seed) throw new Error(`Missing Collocation Use seed for ${id}`);
  if (!edit.reference_answer.toLowerCase().includes(seed.target_surface.toLowerCase())) {
    throw new Error(`Revised Collocation Use answer omits target '${seed.target_surface}' for ${id}`);
  }
  const changed = seed.prompt_zh !== edit.prompt_zh
    || seed.reference_answer !== edit.reference_answer
    || !sameHints(seed.hints, edit.hints)
    || (edit.priority && collocation.priority !== edit.priority)
    || (edit.usage_note && collocation.usage_note !== edit.usage_note);
  seed.prompt_zh = edit.prompt_zh;
  seed.hints = edit.hints;
  seed.reference_answer = edit.reference_answer;
  if (edit.priority) collocation.priority = edit.priority;
  if (edit.usage_note) collocation.usage_note = edit.usage_note;
  if (changed) {
    collocation.content_revision += 1;
    collocation.updated_at = approvedAt;
  }
  appendReview(collocation.review_history, "edited", "codex", auditReason, editedAt);
  appendReview(collocation.review_history, "approved", "local_user", approvalReason, approvedAt);

  const promptCandidate = collocationUseCandidates.items.find((item) => item.collocation_id === id);
  if (!promptCandidate) throw new Error(`Missing Collocation Use candidate for ${id}`);
  promptCandidate.prompt_zh = edit.prompt_zh;
  promptCandidate.hints = edit.hints;
  promptCandidate.reference_answer = edit.reference_answer;
  promptCandidate.review_status = "approved";
  appendReview(promptCandidate.review_history, "edited", "codex", auditReason, editedAt);
  appendReview(promptCandidate.review_history, "approved", "local_user", approvalReason, approvedAt);
}

writeJson("data/approved_cards.seed.json", approvedCards);
writeJson("data/candidate_cards.json", candidateCards);
writeJson("data/use_prompt_candidates.json", usePromptCandidates);
writeJson("data/approved_collocations.seed.json", approvedCollocations);
writeJson("data/collocation_use_prompt_candidates.json", collocationUseCandidates);

process.stdout.write(`Applied ${sentenceEdits.size} sentence and ${collocationEdits.size} collocation native-naturalness revisions.\n`);
