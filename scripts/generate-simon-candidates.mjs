import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data/source_essays.json");
const candidatePath = path.join(root, "data/candidate_cards.json");
const approvedPath = path.join(root, "data/approved_cards.seed.json");
const reviewPath = path.join(root, "sources/metadata/simon-candidate-review.md");
const createdAt = "2026-08-16T08:30:00Z";
const reviewedAt = "2026-08-16T08:50:00Z";
const revisedAt = "2026-08-16T09:40:00Z";

const sources = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const existingCandidates = fs.existsSync(candidatePath)
  ? JSON.parse(fs.readFileSync(candidatePath, "utf8"))
  : [];
const existingApprovedCards = fs.existsSync(approvedPath)
  ? JSON.parse(fs.readFileSync(approvedPath, "utf8"))
  : [];
const sourcesById = new Map(sources.map((source) => [source.id, source]));

const chunk = (text, meaning_zh, note = "") => ({ text, meaning_zh, note });
const gloss = (text, lemma, part_of_speech, meaning_zh, note = "") => ({
  text,
  lemma,
  part_of_speech,
  meaning_zh,
  note,
  occurrence_index: 0
});
const slot = (name, role_zh, original_value, replacement) => ({
  name,
  role_zh,
  original_value,
  replacement_examples: [replacement]
});

const VIDEO = "1e8f1de1-4d6f-4bdb-9f30-2ac4d1e4e901";
const WILDLIFE = "2f9a2ef2-5e70-4cea-8a41-3bd5e2f5fa02";
const UNIVERSITY = "3a0b3f03-6f81-4dfb-ab52-4ce6f3060b13";

const specs = [
  {
    key: "video-concede-position",
    sourceId: VIDEO,
    paragraphIndex: 0,
    sentenceIndex: 1,
    translation: "虽然我承认这些游戏有时会给使用者带来积极影响，但我认为它们更可能产生有害影响。",
    functions: ["concession", "state_position", "compare_or_weigh"],
    focus: "mixed",
    chunks: [chunk("While I accept that", "虽然我承认……", "让步后接主句；不要再与 but 连用。")],
    glosses: [],
    pattern: "While I accept that {concession}, I believe that {main_claim}.",
    slots: [
      slot("concession", "先承认的有限优点", "these games can sometimes have a positive effect on the user", "online learning can widen access to education"),
      slot("main_claim", "作者最终坚持的判断", "they are more likely to have a harmful impact", "it is more likely to weaken classroom interaction when used without limits")
    ],
    grammar: "While 引导让步从句，主句用 I believe that 明确给出最终立场。",
    usage: "适合部分承认对方观点后表明自己更倾向的判断。",
    simplified: "Although video games can be beneficial, I think they are more likely to be harmful.",
    transfer: "While I accept that online learning can widen access to education, I believe that it is more likely to weaken classroom interaction when used without limits.",
    scores: [5, 5, 4, 5, 5],
    reasons: ["用一句话完成让步和立场表达。", "positive effect 与 harmful impact 形成自然对照。"],
    priority: "core",
    difficulty: 3,
    transferValue: 5
  },
  {
    key: "video-skill-list",
    sourceId: VIDEO,
    paragraphIndex: 1,
    sentenceIndex: 2,
    translation: "从教育角度看，这些游戏能够培养想象力和创造力，以及专注力、逻辑思维和解决问题的能力；这些都是游戏场景之外也很有用的技能。",
    functions: ["explain_mechanism", "describe_result"],
    focus: "mixed",
    chunks: [chunk("From an educational perspective", "从教育角度看")],
    glosses: [gloss("perspective", "perspective", "noun", "视角；角度")],
    pattern: "From a {perspective} perspective, {subject} encourage {benefits}, all of which are {wider_value}.",
    slots: [
      slot("perspective", "评价角度", "educational", "social"),
      slot("subject", "被评价的事物", "these games", "community sports"),
      slot("benefits", "直接培养的能力", "imagination and creativity, as well as concentration, logical thinking and problem solving", "cooperation and self-discipline"),
      slot("wider_value", "这些能力的更广泛价值", "useful skills outside the gaming context", "valuable skills in school and at work")
    ],
    grammar: "all of which 是非限制性定语从句，概括前面的并列能力。",
    usage: "并列项不宜过多；列举后必须说明这些能力为什么重要。",
    simplified: "Educationally, video games can develop several skills that are useful in real life.",
    transfer: "From a social perspective, community sports encourage cooperation and self-discipline, all of which are valuable skills in school and at work.",
    scores: [5, 4, 5, 5, 5],
    reasons: ["展示‘角度—能力—外部价值’的完整论证链。", "all of which 能自然收束较长的并列成分。"],
    priority: "core",
    difficulty: 4,
    transferValue: 5
  },
  {
    key: "video-evidence-example",
    sourceId: VIDEO,
    paragraphIndex: 1,
    sentenceIndex: 3,
    translation: "此外，已有研究表明，电脑模拟游戏能够提高使用者的动作技能，并帮助他们为现实任务做好准备，例如驾驶飞机。",
    functions: ["give_example", "describe_result"],
    focus: "mixed",
    chunks: [
      chunk("it has been shown that", "已有研究表明……", "没有可靠研究依据时不要滥用。"),
      chunk("prepare them for real-world tasks", "让他们为现实任务做好准备")
    ],
    glosses: [gloss("simulation", "simulation", "noun", "模拟；仿真")],
    pattern: "Furthermore, it has been shown that {intervention} can {benefit_one} and help to {benefit_two}, such as {example}.",
    slots: [
      slot("intervention", "被讨论的措施或工具", "computer simulation games", "workplace training programmes"),
      slot("benefit_one", "第一项作用", "improve users’ motor skills", "improve employees’ technical skills"),
      slot("benefit_two", "第二项作用", "prepare them for real-world tasks", "prepare them for emergencies"),
      slot("example", "具体任务例子", "flying a plane", "responding to a fire")
    ],
    grammar: "形式主语 it + 被动完成时用于引出已有证据，后面用 can 和 help to 并列作用。",
    usage: "只有来源确实支持时才写 it has been shown that；否则改用 can 或 may。",
    simplified: "Simulation games can improve motor skills and prepare users for real tasks.",
    transfer: "Furthermore, it has been shown that workplace training programmes can improve employees’ technical skills and help to prepare them for emergencies, such as responding to a fire.",
    scores: [5, 4, 4, 5, 5],
    reasons: ["把证据、双重作用和例子压缩在一个清晰句型中。", "prepare somebody for something 是高频可迁移结构。"],
    uncertainties: ["原句用 it has been shown that 引出研究结论，但合集没有提供研究出处；人工审核时应决定是否保留为正面学习表达。"],
    priority: "supporting",
    difficulty: 4,
    transferValue: 5
  },
  {
    key: "video-range-mechanism",
    sourceId: VIDEO,
    paragraphIndex: 2,
    sentenceIndex: 3,
    translation: "这种成瘾可能造成从睡眠不足到学业问题等一系列后果，因为作业会被牺牲掉，以换取在电脑或游戏机前多玩几个小时。",
    functions: ["describe_result", "explain_mechanism"],
    focus: "mixed",
    chunks: [
      chunk("have effects ranging from", "产生从……到……的一系列影响"),
      chunk("is sacrificed for", "被牺牲以换取……")
    ],
    glosses: [gloss("sacrificed", "sacrifice", "verb", "牺牲；舍弃")],
    pattern: "This type of {problem} can have effects ranging from {minor_effect} to {major_effect}, when {mechanism}.",
    slots: [
      slot("problem", "所讨论的问题", "addiction", "overwork"),
      slot("minor_effect", "较轻后果", "lack of sleep", "persistent tiredness"),
      slot("major_effect", "较重后果", "problems at school", "serious health problems"),
      slot("mechanism", "产生后果的机制", "homework is sacrificed for a few more hours on the computer or console", "rest is sacrificed for longer working hours")
    ],
    grammar: "ranging from A to B 补充 effects 的范围；when 从句解释问题出现的情境。",
    usage: "A 和 B 应属于同一后果维度，并体现合理的范围递进。",
    simplified: "Gaming addiction can cause problems from sleep loss to poor school performance.",
    transfer: "This type of overwork can have effects ranging from persistent tiredness to serious health problems, when rest is sacrificed for longer working hours.",
    scores: [5, 5, 5, 5, 5],
    reasons: ["同时训练后果范围与形成机制。", "ranging from A to B 可用于健康、环境和社会问题。"],
    priority: "core",
    difficulty: 4,
    transferValue: 5
  },
  {
    key: "video-linked-in-part",
    sourceId: VIDEO,
    paragraphIndex: 2,
    sentenceIndex: 4,
    translation: "近年来肥胖率的上升，也被认为在一定程度上与久坐的生活方式以及游戏成瘾常伴随的运动不足有关。",
    functions: ["explain_mechanism", "qualify_claim"],
    focus: "vocabulary",
    chunks: [
      chunk("linked in part to", "被认为在一定程度上与……有关", "in part 限定因果强度，避免绝对化。"),
      chunk("sedentary lifestyle", "久坐的生活方式")
    ],
    glosses: [gloss("sedentary", "sedentary", "adjective", "久坐不动的")],
    pattern: null,
    slots: [],
    grammar: "现在完成时被动语态表示一种已经出现并持续受到关注的关联。",
    usage: "link A to B 表示相关关系，不自动等同于严格因果。",
    simplified: "The recent rise in obesity is partly related to inactivity and gaming addiction.",
    transfer: "The decline in urban air quality has been linked in part to heavier traffic and continued reliance on fossil fuels.",
    scores: [5, 5, 5, 3, 5],
    reasons: ["in part 是控制论断强度的实用表达。", "包含健康主题常用搭配 sedentary lifestyle。"],
    priority: "core",
    difficulty: 4,
    transferValue: 5
  },
  {
    key: "wildlife-compelling-reason",
    sourceId: WILDLIFE,
    paragraphIndex: 1,
    sentenceIndex: 2,
    translation: "此外，没有任何有说服力的理由说明我们应该任由动物灭绝。",
    functions: ["counterargument", "qualify_claim"],
    focus: "vocabulary",
    chunks: [
      chunk("there is no compelling reason why", "没有令人信服的理由说明……"),
      chunk("let animals die out", "任由动物灭绝")
    ],
    glosses: [
      gloss("compelling", "compelling", "adjective", "令人信服的；有说服力的")
    ],
    pattern: null,
    slots: [],
    grammar: "there is no reason why 后接完整陈述句，不用疑问语序。",
    usage: "语气较强，适合反驳缺乏依据的主张；必须确保前文已交代理由。",
    simplified: "There is no good reason to allow animals to become extinct.",
    transfer: "There is no compelling reason why low-income students should be excluded from higher education.",
    scores: [5, 5, 5, 4, 5],
    reasons: ["短句但反驳功能明确。", "compelling reason 与 die out 都是自然高频搭配。"],
    priority: "core",
    difficulty: 3,
    transferValue: 5
  },
  {
    key: "wildlife-every-last",
    sourceId: WILDLIFE,
    paragraphIndex: 1,
    sentenceIndex: 3,
    translation: "我们没有必要为了养活或安置全球人口，而开发或毁掉每一寸土地。",
    functions: ["counterargument", "explain_mechanism"],
    focus: "vocabulary",
    chunks: [
      chunk("every last square metre of land", "每一寸土地", "every last 强调一个不剩。"),
      chunk("in order to feed or accommodate", "为了养活或安置……")
    ],
    glosses: [
      gloss("exploit", "exploit", "verb", "开发利用", "此处强调对土地资源的利用。"),
      gloss("accommodate", "accommodate", "verb", "容纳；为……提供居所")
    ],
    pattern: null,
    slots: [],
    grammar: "in order to 明确表示目的；exploit 和 destroy 共用宾语。",
    usage: "every last 带明显强调色彩，适用于反驳极端做法。",
    simplified: "We do not need to use or destroy all available land to support the world’s population.",
    transfer: "Cities do not need to replace every last green space in order to accommodate a growing population.",
    scores: [5, 5, 5, 3, 4],
    reasons: ["用有力度但自然的表达反驳‘人类需求必然排斥保护’。", "feed or accommodate 能区分人口需求的两个方面。"],
    priority: "supporting",
    difficulty: 4,
    transferValue: 4
  },
  {
    key: "wildlife-cleft-ensures",
    sourceId: WILDLIFE,
    paragraphIndex: 2,
    sentenceIndex: 1,
    translation: "通常正是对自然栖息地的保护确保了野生动物的生存，而且大多数科学家都认同，这些栖息地对人类生存同样至关重要。",
    functions: ["explain_mechanism", "describe_result"],
    focus: "mixed",
    chunks: [chunk("ensures the survival of", "确保……的生存")],
    glosses: [gloss("habitats", "habitat", "noun", "栖息地")],
    pattern: "It is usually {key_action} that ensures {direct_outcome}, and {authority} agree that {protected_resource} are also crucial for {wider_outcome}.",
    slots: [
      slot("key_action", "被强调的关键行动", "the protection of natural habitats", "investment in preventive healthcare"),
      slot("direct_outcome", "直接结果", "the survival of wild animals", "the early detection of disease"),
      slot("authority", "支持判断的权威群体", "most scientists", "many public-health experts"),
      slot("protected_resource", "同时具有更广价值的对象", "these habitats", "these services"),
      slot("wider_outcome", "更广泛结果", "human survival", "the long-term resilience of health systems")
    ],
    grammar: "It is ... that 是强调句，突出真正发挥作用的因素。",
    usage: "强调句应突出论证中的关键机制，而不是为了句式复杂而使用。",
    simplified: "Protecting habitats helps wild animals survive, and these habitats are also vital for humans.",
    transfer: "It is usually investment in preventive healthcare that ensures the early detection of disease, and many public-health experts agree that these services are also crucial for the long-term resilience of health systems.",
    scores: [5, 5, 5, 5, 5],
    reasons: ["强调句准确突出保护栖息地这一核心机制。", "一句话连接动物保护与人类利益，论证推进明显。"],
    priority: "core",
    difficulty: 5,
    transferValue: 5
  },
  {
    key: "wildlife-costs-outweigh",
    sourceId: WILDLIFE,
    paragraphIndex: 2,
    sentenceIndex: 3,
    translation: "如果我们毁掉这些区域，应对由此造成的地球环境变化的成本，将远远超过保护这些区域的成本。",
    functions: ["describe_result", "compare_or_weigh"],
    focus: "mixed",
    chunks: [chunk("would far outweigh the costs of", "将远远超过……的成本")],
    glosses: [gloss("outweigh", "outweigh", "verb", "超过；大于")],
    pattern: "If we {harmful_action}, the costs of {consequence} would far outweigh the costs of {prevention}.",
    slots: [
      slot("harmful_action", "造成长期风险的行为", "destroyed these areas", "failed to maintain ageing infrastructure"),
      slot("consequence", "事后处理的代价", "managing the resulting changes to our planet", "repairing the resulting damage"),
      slot("prevention", "预防措施", "conservation", "regular maintenance")
    ],
    grammar: "If + 过去式与 would 构成第二条件句，讨论假设后果；far 修饰 outweigh 加强比较。",
    usage: "适合成本效益论证，比较项必须可比。",
    simplified: "The future cost of environmental damage could be much higher than the cost of conservation.",
    transfer: "If we failed to maintain ageing infrastructure, the costs of repairing the resulting damage would far outweigh the costs of regular maintenance.",
    scores: [5, 5, 5, 5, 5],
    reasons: ["把假设后果与成本权衡结合起来。", "far outweigh 是 Task 2 中高复用的比较搭配。"],
    priority: "core",
    difficulty: 4,
    transferValue: 5
  },
  {
    key: "wildlife-by-protecting",
    sourceId: WILDLIFE,
    paragraphIndex: 2,
    sentenceIndex: 4,
    translation: "通过保护野生动物及其栖息地，我们维持了地球上所有生命的自然平衡。",
    functions: ["describe_result", "conclude_or_infer"],
    focus: "mixed",
    chunks: [chunk("maintain the natural balance", "维持自然平衡")],
    glosses: [],
    pattern: "By {action}, we {benefit}.",
    slots: [
      slot("action", "实现结果的行动", "protecting wild animals and their habitats", "investing in reliable public transport"),
      slot("benefit", "行动带来的结果", "maintain the natural balance of all life on Earth", "reduce congestion and improve access to jobs")
    ],
    grammar: "By + 动名词表示实现结果的方式，主句说明直接收益。",
    usage: "适合段尾归纳机制；主句结果应由 by 后的行动合理导出。",
    simplified: "Protecting animals and habitats helps preserve the balance of nature.",
    transfer: "By investing in reliable public transport, we reduce congestion and improve access to jobs.",
    scores: [5, 5, 4, 5, 5],
    reasons: ["极简但高度可迁移的‘行动—结果’骨架。", "maintain the natural balance 是环境主题核心搭配。"],
    priority: "supporting",
    difficulty: 2,
    transferValue: 5
  },
  {
    key: "university-while-position",
    sourceId: UNIVERSITY,
    paragraphIndex: 0,
    sentenceIndex: 1,
    translation: "虽然有人主张最好强制学生进入某些关键学科领域，但我认为每个人都应该能够选择自己喜欢的课程。",
    functions: ["concession", "state_position"],
    focus: "mixed",
    chunks: [chunk("the course of their choice", "他们自己选择的课程")],
    glosses: [],
    pattern: "While some argue that {alternative}, I believe that {position}.",
    slots: [
      slot("alternative", "需要先呈现的对方主张", "it would be better for students to be forced into certain key subject areas", "governments should restrict access to city centres"),
      slot("position", "作者自己的立场", "everyone should be able to study the course of their choice", "residents should remain free to choose how they travel")
    ],
    grammar: "While 引导让步；some argue 与 I believe 清楚区分他人观点和作者立场。",
    usage: "适合 discussion essay 引言，避免把对方观点写成事实。",
    simplified: "Some support limiting students’ choices, but I believe students should choose their own courses.",
    transfer: "While some argue that governments should restrict access to city centres, I believe that residents should remain free to choose how they travel.",
    scores: [5, 5, 4, 5, 5],
    reasons: ["准确区分对方观点与个人立场。", "the course of their choice 比 their preferred course 更具结构迁移价值。"],
    priority: "core",
    difficulty: 3,
    transferValue: 5
  },
  {
    key: "university-personal-benefits",
    sourceId: UNIVERSITY,
    paragraphIndex: 1,
    sentenceIndex: 2,
    translation: "从个人角度来看，可以认为这些课程能带来更多就业机会、职业发展和更高薪资，从而改善修读者的生活质量。",
    functions: ["explain_mechanism", "describe_result"],
    focus: "mixed",
    chunks: [
      chunk("From a personal perspective", "从个人角度来看"),
      chunk("career progression", "职业发展"),
      chunk("an improved quality of life", "改善的生活质量")
    ],
    glosses: [gloss("progression", "progression", "noun", "发展；晋升")],
    pattern: "From a personal perspective, it can be argued that {option} provide {benefit_list}, and therefore {result}.",
    slots: [
      slot("option", "被评价的选择", "these courses", "flexible working arrangements"),
      slot("benefit_list", "一组直接收益", "more job opportunities, career progression, better salaries", "greater autonomy, lower commuting costs and more family time"),
      slot("result", "由直接收益导出的结果", "an improved quality of life for students who take them", "a better quality of life for many employees")
    ],
    grammar: "it can be argued that 使用非人称表达呈现可辩护观点；therefore 连接收益和最终结果。",
    usage: "先限定评价层级为个人，再列举同一层级的收益。",
    simplified: "These subjects can improve students’ careers, salaries and quality of life.",
    transfer: "From a personal perspective, it can be argued that flexible working arrangements provide greater autonomy, lower commuting costs and more family time, and therefore a better quality of life for many employees.",
    scores: [5, 4, 5, 5, 5],
    reasons: ["展示从直接利益推导生活质量的论证层级。", "career progression 和 quality of life 都能迁移到工作类话题。"],
    priority: "core",
    difficulty: 4,
    transferValue: 5
  },
  {
    key: "university-societal-gap",
    sourceId: UNIVERSITY,
    paragraphIndex: 1,
    sentenceIndex: 3,
    translation: "从社会层面看，通过强制人们选择特定大学专业，政府可以确保经济中的知识与技能缺口得到填补。",
    functions: ["explain_mechanism", "describe_result"],
    focus: "mixed",
    chunks: [
      chunk("On the societal level", "从社会层面看"),
      chunk("knowledge and skill gaps", "知识和技能缺口")
    ],
    glosses: [gloss("societal", "societal", "adjective", "社会层面的")],
    pattern: "On the societal level, by {policy_action}, governments can ensure that {system_gap} are covered.",
    slots: [
      slot("policy_action", "政策行动", "forcing people to choose particular university subjects", "funding training in shortage occupations"),
      slot("system_gap", "需要弥补的系统缺口", "any knowledge and skill gaps in the economy", "critical labour and skill gaps in essential services")
    ],
    grammar: "by + 动名词说明政策手段；ensure that 后接预期结果。",
    usage: "原句的 forcing 带强制色彩，迁移时应根据立场选择 encourage、fund 或 require。",
    simplified: "Governments can guide subject choices to reduce skill shortages in the economy.",
    transfer: "On the societal level, by funding training in shortage occupations, governments can ensure that critical labour and skill gaps in essential services are covered.",
    scores: [5, 4, 5, 5, 5],
    reasons: ["明确从个人收益切换到社会层面。", "把政策手段和宏观结果连接起来。"],
    priority: "core",
    difficulty: 4,
    transferValue: 5
  },
  {
    key: "university-focus-lead-to",
    sourceId: UNIVERSITY,
    paragraphIndex: 1,
    sentenceIndex: 4,
    translation: "最后，高等教育对技术的重视可能带来新发明、经济增长和更大的未来繁荣。",
    functions: ["describe_result"],
    focus: "vocabulary",
    chunks: [
      chunk("a focus on technology", "对技术的重视"),
      chunk("greater future prosperity", "未来更大的繁荣")
    ],
    glosses: [gloss("prosperity", "prosperity", "noun", "繁荣；兴盛")],
    pattern: null,
    slots: [],
    grammar: "could 降低因果断言强度，lead to 后接名词性结果。",
    usage: "列举的结果应保持逻辑递进，不要堆砌近义词。",
    simplified: "Prioritising technology in universities may support innovation and economic growth.",
    transfer: "A focus on preventive healthcare could lead to earlier treatment, lower public spending and a healthier population.",
    scores: [5, 5, 5, 3, 5],
    reasons: ["短句集中呈现政策重点到宏观结果的因果链。", "prosperity 是经济与发展话题常用词。"],
    priority: "supporting",
    difficulty: 3,
    transferValue: 5
  },
  {
    key: "university-unpredictable-future",
    sourceId: UNIVERSITY,
    paragraphIndex: 2,
    sentenceIndex: 2,
    translation: "此外，没有人能够真正预测哪些知识领域未来对社会最有用，而且雇主将来可能开始更看重创造性思维，而不是实践或技术技能。",
    functions: ["qualify_claim", "counterargument"],
    focus: "mixed",
    chunks: [chunk("value creative thinking skills above", "将创造性思维看得比……更重要")],
    glosses: [],
    pattern: "Besides, nobody can really predict {uncertain_question}, and it may be that {future_change}.",
    slots: [
      slot("uncertain_question", "无法可靠预测的未来问题", "which areas of knowledge will be most useful to society in the future", "which industries will create the most secure jobs in twenty years"),
      slot("future_change", "可能出现的趋势变化", "employers begin to value creative thinking skills above practical or technical skills", "employers begin to value adaptability above narrow technical expertise")
    ],
    grammar: "which 引导宾语从句时使用陈述语序；it may be that 用于谨慎提出可能性。",
    usage: "适合反驳建立在长期预测上的强制政策，但后面的可能变化应具体。",
    simplified: "We cannot know which knowledge will matter most, and employers’ priorities may change.",
    transfer: "Besides, nobody can really predict which industries will create the most secure jobs in twenty years, and it may be that employers begin to value adaptability above narrow technical expertise.",
    scores: [5, 5, 5, 5, 5],
    reasons: ["通过承认未来不确定性削弱对方的确定性主张。", "it may be that 提供谨慎而具体的替代可能。"],
    priority: "core",
    difficulty: 5,
    transferValue: 5
  },
  {
    key: "university-hypothetical-need",
    sourceId: UNIVERSITY,
    paragraphIndex: 2,
    sentenceIndex: 3,
    learningSentence: "If employers began to value creative thinking skills above practical or technical skills, perhaps we would need more students of art, history and philosophy than of science or technology.",
    learningEdits: [{
      edit_type: "resolve_reference",
      before: "If this were the case",
      after: "If employers began to value creative thinking skills above practical or technical skills",
      reason: "补足 this 对上一句假设的指代，使学习句能够脱离上下文独立练习。"
    }],
    translation: "如果雇主开始更看重创造性思维而不是实践或技术技能，也许我们需要的艺术、历史和哲学专业学生，会比科学或技术专业学生更多。",
    functions: ["conclude_or_infer", "compare_or_weigh"],
    focus: "mixed",
    chunks: [chunk("value creative thinking skills above", "将创造性思维看得比……更重要")],
    glosses: [],
    pattern: "If {future_change}, perhaps we would need more {preferred_group} than {comparison_group}.",
    slots: [
      slot("future_change", "作为推断前提的未来变化", "employers began to value creative thinking skills above practical or technical skills", "employers began to value adaptability above narrow technical expertise"),
      slot("preferred_group", "假设成立后需求增加的群体", "students of art, history and philosophy", "workers with broad problem-solving skills"),
      slot("comparison_group", "被比较的另一群体", "students of science or technology", "workers trained for one narrow task")
    ],
    grammar: "If + 过去式与 would 构成第二条件句；perhaps 进一步降低断言强度。",
    usage: "原句的 this 依赖上一句，学习句已补足具体假设；正式卡仍保留原句和修改记录。",
    simplified: "If employers valued creativity more, society might need more arts graduates than technical graduates.",
    transfer: "If employers began to value adaptability above narrow technical expertise, perhaps we would need more workers with broad problem-solving skills than workers trained for one narrow task.",
    scores: [5, 5, 4, 5, 4],
    reasons: ["自然承接上一句的假设并推出比较结论。", "第二条件句和 perhaps 共同体现谨慎推断。"],
    priority: "supporting",
    difficulty: 4,
    transferValue: 4
  }
];

function sentenceList(paragraph) {
  return (paragraph.match(/[^.!?]+(?:[.!?]+(?:[”’"']+)?|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function uuidFrom(seed) {
  const bytes = crypto.createHash("sha256").update(seed).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function normalizedHash(sentence) {
  const normalized = sentence.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function makeCandidate(spec) {
  const source = sourcesById.get(spec.sourceId);
  if (!source) throw new Error(`Unknown source ${spec.sourceId}`);
  const paragraph = source.paragraphs.find((item) => item.paragraph_index === spec.paragraphIndex);
  if (!paragraph) throw new Error(`Missing paragraph for ${spec.key}`);
  const sentences = sentenceList(paragraph.text);
  const original = sentences[spec.sentenceIndex];
  if (!original) throw new Error(`Missing sentence for ${spec.key}`);
  const learning = spec.learningSentence ?? original;
  for (const item of [...spec.chunks, ...spec.glosses]) {
    if (!learning.includes(item.text)) throw new Error(`${spec.key}: '${item.text}' is not in learning sentence`);
  }

  const cardId = uuidFrom(`card:${spec.key}`);
  const candidateId = uuidFrom(`candidate:${spec.key}`);
  const slotReplacement = spec.focus === "mixed"
    ? [{
        prompt_zh: "使用给定内容槽位仿写同一论证结构。",
        slot_values: spec.slots.map((item) => ({
          slot_name: item.name,
          value: item.replacement_examples[0]
        })),
        reference_answer: spec.transfer
      }]
    : undefined;
  const chunkCloze = spec.chunks.length
    ? [{
        chunk_text: spec.chunks[0].text,
        prompt_sentence: learning.replace(spec.chunks[0].text, "_____"),
        reference_answer: spec.chunks[0].text
      }]
    : undefined;
  const isDeferred = spec.key === "video-evidence-example";
  const workflowStatus = isDeferred ? "deferred" : "approved";
  const contentRevision = isDeferred ? 1 : 2;
  const reviewReason = isDeferred
    ? "原句使用 it has been shown that 声称已有研究支持，但合集没有提供研究出处；用户确认按建议暂缓。"
    : "用户确认按 Codex 的首轮审核建议批准此卡。";

  return {
    schema_version: "1.0.0",
    candidate_id: candidateId,
    card: {
      schema_version: "1.0.0",
      id: cardId,
      source_essay_id: source.id,
      original_sentence: original,
      learning_sentence: learning,
      learning_edits: spec.learningEdits ?? [],
      translation_zh: spec.translation,
      context_before: sentences[spec.sentenceIndex - 1] ?? "",
      context_after: sentences[spec.sentenceIndex + 1] ?? "",
      paragraph_index: spec.paragraphIndex,
      sentence_index: spec.sentenceIndex,
      task: "academic_task_2",
      question_types: [source.question_type],
      topics: source.topics,
      argument_functions: spec.functions,
      primary_focus: spec.focus,
      chunks: spec.chunks,
      glosses: spec.glosses,
      pattern: spec.pattern,
      slots: spec.slots,
      grammar_note: spec.grammar,
      usage_note: spec.usage,
      simplified_version: spec.simplified,
      transfer_example: spec.transfer,
      exercise_seed: {
        ...(chunkCloze ? { chunk_cloze: chunkCloze } : {}),
        translation_recall: {
          prompt_zh: spec.translation,
          reference_answer: learning
        },
        ...(slotReplacement ? { slot_replacement: slotReplacement } : {})
      },
      difficulty: spec.difficulty,
      transfer_value: spec.transferValue,
      source_reliability: "teacher_authored",
      content_status: workflowStatus,
      content_revision: contentRevision,
      normalized_text_hash: normalizedHash(learning),
      created_at: createdAt,
      updated_at: isDeferred ? reviewedAt : revisedAt
    },
    source_match: {
      match_type: "exact",
      matched_text: original,
      paragraph_index: spec.paragraphIndex,
      sentence_index: spec.sentenceIndex
    },
    selection_scores: {
      naturalness: spec.scores[0],
      context_independence: spec.scores[1],
      vocabulary_value: spec.scores[2],
      structure_value: spec.scores[3],
      transfer_value: spec.scores[4]
    },
    recommendation_reasons: spec.reasons,
    uncertainties: [
      "合集未提供 Simon 一手文章 URL 或 IELTS 考官评语；作者归属和 Band 9 标签仍需人工确认。",
      ...(spec.uncertainties ?? [])
    ],
    workflow_status: workflowStatus,
    priority: spec.priority,
    provenance: {
      guideline_version: "1.0.0",
      prompt_version: "simon-pilot-1.0.0",
      processor_type: "codex",
      model_id: null
    },
    review_history: [
      {
        action: "created",
        reviewer: "Codex",
        reason: "按内容规范生成候选；等待用户人工审核。",
        reviewed_at: createdAt
      },
      {
        action: workflowStatus === "approved" ? "approved" : "deferred",
        reviewer: "user",
        reason: reviewReason,
        reviewed_at: reviewedAt
      },
      ...(!isDeferred ? [
        {
          action: "edited",
          reviewer: "Codex",
          reason: "根据用户对首版学习卡的评审收紧注释门槛，删除不构成独立学习价值的基础词组注释。",
          reviewed_at: revisedAt
        },
        {
          action: "approved",
          reviewer: "user",
          reason: "用户明确要求删除高中或基础四级难度、无需额外解释的注释。",
          reviewed_at: revisedAt
        }
      ] : [])
    ],
    created_at: createdAt,
    updated_at: isDeferred ? reviewedAt : revisedAt
  };
}

const pilotCandidates = specs.map(makeCandidate);
const retainedCandidates = existingCandidates.filter(
  (candidate) => candidate.provenance?.prompt_version !== "simon-pilot-1.0.0",
);
const candidates = [...pilotCandidates, ...retainedCandidates];
const hashes = new Set();
for (const candidate of candidates) {
  const hash = candidate.card.normalized_text_hash;
  if (hashes.has(hash)) throw new Error(`Duplicate normalized sentence: ${candidate.card.original_sentence}`);
  hashes.add(hash);
}

fs.writeFileSync(candidatePath, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");
const existingApprovedById = new Map(existingApprovedCards.map((card) => [card.id, card]));
const approvedCards = candidates
  .filter((candidate) => candidate.workflow_status === "approved")
  .map((candidate) => {
    const existing = existingApprovedById.get(candidate.card.id);
    return existing && existing.content_revision >= candidate.card.content_revision
      ? existing
      : candidate.card;
  });
fs.writeFileSync(approvedPath, `${JSON.stringify(approvedCards, null, 2)}\n`, "utf8");

const sourceTitles = new Map(sources.map((source) => [source.id, source.title]));
const counts = pilotCandidates.reduce((acc, candidate) => {
  const title = sourceTitles.get(candidate.card.source_essay_id);
  acc.set(title, (acc.get(title) ?? 0) + 1);
  return acc;
}, new Map());
const lines = [
  "# Simon 首轮好句候选人工审核清单",
  "",
  `- 生成时间：${createdAt}`,
  `- 首轮候选数：${pilotCandidates.length}`,
  `- 分布：${[...counts].map(([title, count]) => `${title} ${count} 句`).join("；")}`,
  `- 审核结果：${pilotCandidates.filter((candidate) => candidate.workflow_status === "approved").length} 张 \`approved\`，${pilotCandidates.filter((candidate) => candidate.workflow_status === "deferred").length} 张 \`deferred\``,
  "- 来源提醒：合集归属与 Band 9 标签待一手来源复核",
  "",
  "审核时重点看：这句话是否值得主动掌握、中文是否准确、结构能否自然迁移、词义提示是否必要。",
  ""
];

pilotCandidates.forEach((candidate, index) => {
  const card = candidate.card;
  lines.push(
    `## ${index + 1}. ${sourceTitles.get(card.source_essay_id)}`,
    "",
    `- 原句：${card.original_sentence}`,
    ...(card.learning_sentence !== card.original_sentence ? [`- 学习句：${card.learning_sentence}`] : []),
    `- 位置：段落 ${card.paragraph_index + 1}，句子 ${card.sentence_index + 1}`,
    `- 中文：${card.translation_zh}`,
    `- 训练重点：${card.primary_focus}`,
    `- 核心词块：${card.chunks.map((item) => `${item.text}（${item.meaning_zh}）`).join("；") || "无"}`,
    `- 点按释义：${card.glosses.map((item) => `${item.text}（${item.meaning_zh}）`).join("；") || "无"}`,
    `- 推荐理由：${candidate.recommendation_reasons.join("；")}`,
    `- 优先级：${candidate.priority}`,
    `- 审核状态：${candidate.workflow_status}`,
    ""
  );
});

fs.writeFileSync(reviewPath, `${lines.join("\n")}\n`, "utf8");
process.stdout.write(
  `Generated ${pilotCandidates.length} pilot candidates and retained ${retainedCandidates.length} later-batch candidates (${candidates.length} total).\n`
);
