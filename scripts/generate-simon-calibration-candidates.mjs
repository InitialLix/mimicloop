import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data/source_essays.json");
const candidatePath = path.join(root, "data/candidate_cards.json");
const approvedPath = path.join(root, "data/approved_cards.seed.json");
const reviewPath = path.join(root, "sources/metadata/simon-calibration-review.md");
const promptVersion = "simon-calibration-1.0.0";
const createdAt = "2026-08-16T14:20:00Z";
const revisedAt = "2026-08-16T14:40:00Z";
const approvedAt = "2026-08-17T00:12:00+08:00";

const sources = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const existingCandidates = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
const existingApprovedCards = JSON.parse(fs.readFileSync(approvedPath, "utf8"));
const sourceByEssay = new Map(
  sources.map((source) => [Number(source.publication_ref.match(/^Essay (\d+),/)?.[1]), source]),
);

const chunk = (text, meaning_zh, note = "") => ({ text, meaning_zh, note });
const gloss = (text, lemma, part_of_speech, meaning_zh, note = "") => ({
  text,
  lemma,
  part_of_speech,
  meaning_zh,
  note,
  occurrence_index: 0,
});
const slot = (name, role_zh, original_value, replacement) => ({
  name,
  role_zh,
  original_value,
  replacement_examples: [replacement],
});
const hint = (zh, en) => ({ zh, en });

const specs = [
  {
    key: "foreign-films-another-reason",
    essay: 1, paragraph: 1, sentence: 3,
    learningSentence: "Another reason why big-budget foreign films are so successful is that they often star the most famous actors and actresses, and they are made by the most accomplished producers and directors.",
    learningEdits: [{ edit_type: "resolve_reference", before: "these big-budget films", after: "big-budget foreign films", reason: "补足 these 对上文外国电影的指代。" }],
    translation: "这些大制作电影如此成功的另一个原因是，它们往往由最著名的演员主演，并由最有成就的制片人和导演制作。",
    functions: ["explain_mechanism"], focus: "structure", chunks: [],
    glosses: [gloss("accomplished", "accomplished", "adjective", "成就卓越的")],
    pattern: "Another reason why {outcome} is that {cause_one}, and {cause_two}.",
    slots: [
      slot("outcome", "需要解释的结果", "big-budget foreign films are so successful", "co-working spaces are increasingly popular"),
      slot("cause_one", "第一项原因", "they often star the most famous actors and actresses", "they often offer flexible rental terms"),
      slot("cause_two", "第二项并列原因", "they are made by the most accomplished producers and directors", "they are maintained by professional teams"),
    ],
    grammar: "Another reason why 引出待解释结果，is that 后接原因；两个原因用 and 并列。",
    usage: "适合在已有原因之后继续推进论证；两项原因应处于同一逻辑层级。",
    simplified: "These films also succeed because they use famous actors and experienced production teams.",
    transfer: "Another reason why co-working spaces are increasingly popular is that they often offer flexible rental terms, and they are maintained by professional teams.",
    usePrompt: "共享办公空间越来越受欢迎的另一个原因是，它们通常提供灵活的租期，而且由专业团队维护。",
    hints: [hint("共享办公空间", "co-working spaces"), hint("灵活的租期", "flexible rental terms"), hint("专业团队", "professional teams")],
    scores: [5, 5, 2, 5, 5], reasons: ["用并列原因解释同一个结果，段落推进清晰。", "更换结果和原因后仍可跨话题复用。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "foreign-films-prove-themselves",
    essay: 1, paragraph: 2, sentence: 1,
    translation: "每个国家都可能有才华横溢的业余电影制作者，他们只是需要一个证明自己的机会。",
    functions: ["explain_mechanism"], focus: "vocabulary",
    chunks: [chunk("given the opportunity to prove themselves", "获得证明自己的机会", "常用于说明人才缺少机会，而非缺少能力。")], glosses: [],
    pattern: null, slots: [],
    grammar: "be given the opportunity to do 使用被动语态，强调机会由外部提供。",
    usage: "prove oneself 表示通过实际表现证明能力；代词应与主语保持一致。",
    simplified: "Talented amateur film-makers may only need a chance to show what they can do.",
    transfer: "Many inexperienced young employees can grow quickly if they are given the opportunity to prove themselves.",
    usePrompt: "许多缺乏经验的年轻员工，只要得到证明自己的机会，就能够迅速成长。",
    hints: [hint("缺乏经验的年轻员工", "inexperienced young employees"), hint("迅速成长", "grow quickly")],
    scores: [5, 5, 5, 2, 5], reasons: ["词块自然表达‘能力需要机会验证’。", "可迁移到教育、就业和社会流动话题。"],
    priority: "core", difficulty: 3, transferValue: 5,
  },
  {
    key: "foreign-films-compete-resources",
    essay: 1, paragraph: 2, sentence: 2,
    learningSentence: "To compete with big-budget productions from overseas, talented amateur film-makers need money to pay for film crews, actors and a host of other costs related to producing high-quality films.",
    learningEdits: [{ edit_type: "resolve_reference", before: "these people", after: "talented amateur film-makers", reason: "补足上一句中的人物指代，使学习句能够独立练习。" }],
    translation: "为了与海外大制作竞争，有才华的业余电影制作者需要资金来支付摄制组、演员以及制作高质量电影所涉及的许多其他成本。",
    functions: ["explain_mechanism"], focus: "structure", chunks: [], glosses: [],
    pattern: "To compete with {competitor}, {group} need {resources}.",
    slots: [
      slot("competitor", "需要面对的竞争者", "big-budget productions from overseas", "established energy providers"),
      slot("group", "需要提升竞争力的主体", "talented amateur film-makers", "renewable-energy manufacturers"),
      slot("resources", "竞争所需资源", "money to pay for film crews, actors and a host of other costs related to producing high-quality films", "long-term financing and a skilled workforce"),
    ],
    grammar: "句首 To + 动词原形表示目的，主句说明达成目的所需的资源。",
    usage: "competitor 与 resources 应具体，避免只写 compete with others 或 need more support。",
    simplified: "Amateur film-makers need sufficient funding to compete with large overseas productions.",
    transfer: "To compete with established energy providers, renewable-energy manufacturers need long-term financing and a skilled workforce.",
    usePrompt: "为了与成熟的能源供应商竞争，可再生能源制造商需要长期融资和熟练劳动力。",
    hints: [hint("成熟的能源供应商", "established energy providers"), hint("可再生能源制造商", "renewable-energy manufacturers"), hint("长期融资", "long-term financing"), hint("熟练劳动力", "a skilled workforce")],
    scores: [5, 5, 2, 5, 5], reasons: ["把竞争目标与资源需求直接连接。", "适合产业、教育和企业竞争类论证。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "foreign-films-policy-results",
    essay: 1, paragraph: 2, sentence: 3,
    learningSentence: "If governments did help local film-makers with production costs, they would see an increase in employment in the film industry, income from film sales, and perhaps even a rise in tourist numbers.",
    learningEdits: [{ edit_type: "resolve_reference", before: "help with these costs", after: "help local film-makers with production costs", reason: "补足受助对象与 costs 的具体指代，使学习句脱离上下文仍然清楚。" }],
    translation: "如果政府确实帮助本地电影制作者承担制作成本，就会看到电影业就业、电影销售收入增加，甚至可能看到游客数量上升。",
    functions: ["describe_result"], focus: "structure", chunks: [], glosses: [],
    pattern: "If {policy_actor} did help {beneficiary} with {cost}, they would see {result_list}.",
    slots: [
      slot("policy_actor", "采取资助行动的主体", "governments", "local governments"),
      slot("beneficiary", "获得成本帮助的主体", "local film-makers", "small businesses"),
      slot("cost", "被分担的成本", "production costs", "their digitalisation costs"),
      slot("result_list", "预期出现的一组结果", "an increase in employment in the film industry, income from film sales, and perhaps even a rise in tourist numbers", "growth in employment, higher productivity, and perhaps even an increase in tax revenue"),
    ],
    grammar: "If + 过去式与 would 构成假设结果；did help 在从句中强调‘确实提供帮助’。",
    usage: "列举结果时应保持同一层级，并用 perhaps even 标记最后一项较延伸的结果。",
    simplified: "Government support for film production could increase jobs, sales and tourism.",
    transfer: "If local governments did help small businesses with their digitalisation costs, they would see growth in employment, higher productivity, and perhaps even an increase in tax revenue.",
    usePrompt: "如果地方政府确实帮助小企业承担数字化成本，就会看到就业增长、生产率提高，甚至可能看到税收增加。",
    hints: [hint("小企业", "small businesses"), hint("数字化成本", "digitalisation costs"), hint("生产率", "productivity"), hint("税收", "tax revenue")],
    scores: [5, 5, 2, 5, 5], reasons: ["展示政策投入如何导出多层结果。", "perhaps even 能控制结果链的递进强度。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "foreign-films-support-compete",
    essay: 1, paragraph: 3, sentence: 0,
    translation: "我认为，增加财政支持能够帮助提高本土电影的质量，并使它们能够与目前占据市场主导地位的外国作品竞争。",
    functions: ["propose_solution", "describe_result"], focus: "structure", chunks: [], glosses: [],
    pattern: "Increased {support} could help to {improvement} and allow {beneficiary} to {competitive_result}.",
    slots: [
      slot("support", "增加的支持或投入", "financial support", "investment"),
      slot("improvement", "第一项直接改善", "raise the quality of locally made films", "improve the reliability of public transport"),
      slot("beneficiary", "因投入而受益的对象", "them", "it"),
      slot("competitive_result", "由改善带来的竞争结果", "compete with the foreign productions that currently dominate the market", "compete with private car travel"),
    ],
    grammar: "help to 与 allow ... to 并列两个结果，allow 后必须明确受益对象。",
    usage: "适合总结投资或政策的双重收益；第二项结果应由第一项改善合理导出。",
    simplified: "More funding could improve local films and help them compete with foreign productions.",
    transfer: "Increased investment could help to improve the reliability of public transport and allow it to compete with private car travel.",
    usePrompt: "增加投资能够帮助提高公共交通的可靠性，并使其能够与私家车出行竞争。",
    hints: [hint("公共交通的可靠性", "the reliability of public transport"), hint("私家车出行", "private car travel")],
    scores: [5, 5, 2, 5, 5], reasons: ["把直接改善与后续竞争力连成两步结果。", "适合政策段结尾归纳投入价值。"],
    priority: "supporting", difficulty: 4, transferValue: 5,
  },
  {
    key: "tourists-argument-chain",
    essay: 2, paragraph: 1, sentence: 0,
    translation: "支持向外国游客收取更高票价的理由可能是，文化或历史景点往往依赖政府补贴维持运营，这意味着本地居民已经通过税收体系向这些景点支付了费用。",
    functions: ["explain_mechanism"], focus: "structure", chunks: [],
    glosses: [gloss("state subsidies", "state subsidy", "noun", "政府补贴")],
    pattern: "The argument in favour of {proposal} would be that {institution} often depend on {support}, which means that {affected_group} already {contribution}.",
    slots: [
      slot("proposal", "需要代为呈现的主张", "higher prices for foreign tourists", "free university tuition"),
      slot("institution", "依赖公共支持的机构", "cultural or historical attractions", "public universities"),
      slot("support", "机构依赖的资金来源", "state subsidies to keep them going", "taxpayer funding"),
      slot("affected_group", "已经承担成本的群体", "the resident population", "the public"),
      slot("contribution", "该群体已经付出的成本", "pays money to these sites through the tax system", "finances these institutions through taxation"),
    ],
    grammar: "would be that 用于谨慎呈现一方论据，which means that 继续解释其推论。",
    usage: "这是转述论据而非作者事实判断；后续通常需要评价这条推论是否充分。",
    simplified: "Supporters of higher tourist prices argue that local taxpayers already fund these attractions.",
    transfer: "The argument in favour of free university tuition would be that public universities often depend on taxpayer funding, which means that the public already finances these institutions through taxation.",
    usePrompt: "支持大学免学费的理由可能是，公立大学往往依赖纳税人资金，这意味着公众已经通过税收为这些机构提供资金。",
    hints: [hint("大学免学费", "free university tuition"), hint("公立大学", "public universities"), hint("纳税人资金", "taxpayer funding"), hint("通过税收", "through taxation")],
    scores: [5, 4, 3, 5, 5], reasons: ["完整展示‘主张—依据—推论’链条。", "有助于准确转述对方观点后再进行评价。"],
    priority: "core", difficulty: 5, transferValue: 5,
  },
  {
    key: "tourists-contribute-economy",
    essay: 2, paragraph: 1, sentence: 2,
    translation: "外国游客通过在食品、纪念品、住宿和交通等各种商品与服务上的消费，为东道国经济作出贡献。",
    functions: ["explain_mechanism"], focus: "vocabulary",
    chunks: [chunk("contribute to the economy of the host country", "为东道国经济作出贡献", "host country 指接待游客、移民或国际学生的国家。")], glosses: [],
    pattern: null, slots: [],
    grammar: "contribute to 后接名词；with the money they spend 说明贡献发生的具体机制。",
    usage: "不要只写 contribute the economy；contribute 后必须使用介词 to。",
    simplified: "Foreign tourists support the host economy by spending money on local goods and services.",
    transfer: "International students contribute to the economy of the host country through the money they spend on housing, transport and local services.",
    usePrompt: "国际学生通过在住房、交通和本地服务上的消费，为东道国经济作出贡献。",
    hints: [hint("国际学生", "international students"), hint("住房", "housing"), hint("本地服务", "local services")],
    scores: [5, 5, 5, 2, 5], reasons: ["集中训练旅游与迁移话题的高频经济搭配。", "同时说明消费如何转化为经济贡献。"],
    priority: "core", difficulty: 3, transferValue: 5,
  },
  {
    key: "tourists-realised-decide",
    essay: 2, paragraph: 2, sentence: 0,
    translation: "如果旅行者意识到参观某国的历史和文化景点需要支付更高费用，他们也许会决定不去那个国家度假。",
    functions: ["describe_result", "qualify_claim"], focus: "structure", chunks: [], glosses: [],
    pattern: "If {group} realised that {negative_condition}, they would perhaps decide not to {action}.",
    slots: [
      slot("group", "会对条件作出反应的群体", "travellers", "commuters"),
      slot("negative_condition", "可能改变行为的不利条件", "they would have to pay more to visit historical and cultural attractions in a particular nation", "city-centre parking fees would double"),
      slot("action", "可能被放弃的行为", "go to that country on holiday", "drive into the city centre"),
    ],
    grammar: "第二条件句描述假设反应；perhaps 放在 decide 前降低预测强度。",
    usage: "适合推测政策改变行为，但不能把假设写成确定结果。",
    simplified: "Higher attraction fees might discourage travellers from visiting the country.",
    transfer: "If commuters realised that city-centre parking fees would double, they would perhaps decide not to drive into the city centre.",
    usePrompt: "如果通勤者意识到市中心停车费将翻倍，他们也许会决定不再开车进入市中心。",
    hints: [hint("通勤者", "commuters"), hint("市中心停车费", "city-centre parking fees"), hint("翻倍", "double")],
    scores: [5, 5, 2, 5, 5], reasons: ["用谨慎的条件句预测价格政策对行为的影响。", "可迁移到交通、消费和环保政策。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "tourists-regardless-nationality",
    essay: 2, paragraph: 2, sentence: 2,
    learningSentence: "Windsor Castle and Saint Paul’s Cathedral charge the same price regardless of nationality, and this helps to promote the nation’s cultural heritage.",
    learningEdits: [{ edit_type: "resolve_reference", before: "These two sites", after: "Windsor Castle and Saint Paul’s Cathedral", reason: "补足 two sites 对上一句两个景点的指代。" }],
    translation: "温莎城堡和圣保罗大教堂无论游客国籍如何都收取相同价格，这有助于弘扬国家的文化遗产。",
    functions: ["describe_result"], focus: "vocabulary",
    chunks: [chunk("regardless of nationality", "不论国籍", "regardless of 后接名词或名词短语，不接完整从句。")], glosses: [],
    pattern: null, slots: [],
    grammar: "regardless of 引出不影响主句结果的条件；and this helps to 补充政策收益。",
    usage: "适合平等准入语境，也可替换为 regardless of income、age 或 background。",
    simplified: "Both sites charge everyone the same and thereby support national heritage.",
    transfer: "Emergency services should be available to everyone regardless of nationality, and this helps to protect public health.",
    usePrompt: "无论国籍如何，每个人都应当能够获得紧急服务，这有助于保护公共健康。",
    hints: [hint("紧急服务", "emergency services"), hint("保护公共健康", "protect public health")],
    scores: [5, 5, 5, 2, 5], reasons: ["词块简洁表达规则不因身份而改变。", "可直接迁移到公共服务和平等话题。"],
    priority: "supporting", difficulty: 3, transferValue: 5,
  },
  {
    key: "tourists-funding-risk",
    essay: 2, paragraph: 2, sentence: 3,
    learningSentence: "If overseas tourists stopped coming due to higher prices, there would be a risk of insufficient funding for the maintenance of Windsor Castle and Saint Paul’s Cathedral.",
    learningEdits: [{ edit_type: "resolve_reference", before: "these important buildings", after: "Windsor Castle and Saint Paul’s Cathedral", reason: "补足 buildings 对上一句两个具体景点的指代。" }],
    translation: "如果海外游客因价格上涨而停止前来，温莎城堡和圣保罗大教堂的维护就可能面临资金不足的风险。",
    functions: ["describe_result"], focus: "mixed",
    chunks: [chunk("there would be a risk of insufficient funding for", "可能出现……资金不足的风险", "后接需要持续资金支持的项目或服务。")], glosses: [],
    pattern: "If {negative_change}, there would be a risk of insufficient funding for {essential_need}.",
    slots: [
      slot("negative_change", "导致收入下降的变化", "overseas tourists stopped coming due to higher prices", "public donations fell sharply"),
      slot("essential_need", "需要稳定资金的事项", "the maintenance of Windsor Castle and Saint Paul’s Cathedral", "the operation of community shelters"),
    ],
    grammar: "If 从句提出风险来源，there would be a risk of 后接名词或动名词。",
    usage: "insufficient funding 比 lack of money 更正式，但必须说明资金用于什么。",
    simplified: "Higher prices could reduce tourism and leave too little money to maintain important buildings.",
    transfer: "If public donations fell sharply, there would be a risk of insufficient funding for the operation of community shelters.",
    usePrompt: "如果公众捐款大幅下降，社区收容所的运营就可能面临资金不足的风险。",
    hints: [hint("公众捐款", "public donations"), hint("大幅下降", "fall sharply"), hint("社区收容所的运营", "the operation of community shelters")],
    scores: [5, 5, 5, 5, 5], reasons: ["把收入变化与公共设施维护风险连接起来。", "核心词块与条件结构都具有独立训练价值。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "tourists-counterproductive",
    essay: 2, paragraph: 3, sentence: 0,
    translation: "我认为应当尽一切努力吸引海外游客，而让他们支付比本地居民更高的费用会适得其反。",
    functions: ["state_position", "compare_or_weigh"], focus: "mixed",
    chunks: [
      chunk("every effort should be made to", "应当尽一切努力去……", "用于强调目标的重要性，语气较强。"),
      chunk("it would be counterproductive to", "做……会适得其反", "表示行动会妨碍其原本想实现的目标。"),
    ], glosses: [],
    pattern: "Every effort should be made to {goal}, and it would be counterproductive to {conflicting_action}.",
    slots: [
      slot("goal", "应被积极推动的目标", "attract tourists from overseas", "encourage urban cycling"),
      slot("conflicting_action", "会妨碍该目标的行动", "make them pay more than local residents", "reduce the number of protected cycle lanes"),
    ],
    grammar: "两个被动结构并列：should be made 表示强烈建议，would be 表示对后果的判断。",
    usage: "counterproductive 后的行动必须与前面的目标存在明确冲突。",
    simplified: "We should attract foreign tourists, so charging them more would work against this aim.",
    transfer: "Every effort should be made to encourage urban cycling, and it would be counterproductive to reduce the number of protected cycle lanes.",
    usePrompt: "应当尽一切努力鼓励城市骑行，而减少受保护自行车道的数量会适得其反。",
    hints: [hint("城市骑行", "urban cycling"), hint("受保护自行车道", "protected cycle lanes")],
    scores: [5, 5, 5, 5, 5], reasons: ["一句话完成政策目标与冲突措施的权衡。", "两个高价值词块可直接迁移到多类政策题。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "independence-without-help",
    essay: 3, paragraph: 1, sentence: 3,
    translation: "房价比以往任何时候都高，如果没有帮助，许多人将不可能支付首付和房贷。",
    functions: ["explain_mechanism", "describe_result"], focus: "structure", chunks: [],
    glosses: [
      gloss("deposit", "deposit", "noun", "购房首付"),
      gloss("mortgage", "mortgage", "noun", "住房按揭贷款"),
    ],
    pattern: "Without {support}, it would be impossible for {group} to {difficult_action}.",
    slots: [
      slot("support", "缺失的必要支持", "help", "government grants"),
      slot("group", "无法承担行动的群体", "many people", "small research teams"),
      slot("difficult_action", "因缺少支持而无法完成的行动", "pay a deposit and a mortgage", "purchase this equipment"),
    ],
    grammar: "Without + 名词相当于否定条件；it is impossible for somebody to do 是形式主语结构。",
    usage: "用于说明必要条件，不应把仅仅有帮助作用的因素夸大为绝对条件。",
    simplified: "Many people could not afford a deposit and mortgage without financial help.",
    transfer: "Without government grants, it would be impossible for small research teams to purchase this equipment.",
    usePrompt: "如果没有政府补助，小型研究团队将不可能购买这种设备。",
    hints: [hint("政府补助", "government grants"), hint("小型研究团队", "small research teams"), hint("购买这种设备", "purchase this equipment")],
    scores: [5, 5, 3, 5, 5], reasons: ["清楚表达某项支持是行动得以发生的必要条件。", "可迁移到住房、教育、科研和企业扶持。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "independence-dispersed-result",
    essay: 3, paragraph: 2, sentence: 1,
    translation: "在大多数国家，家庭规模正在缩小，成员也更加分散，这意味着人们无法像过去那样依靠亲属。",
    functions: ["explain_mechanism", "describe_result"], focus: "structure", chunks: [],
    glosses: [gloss("dispersed", "disperse", "adjective", "分散居住的")],
    pattern: "{trend}, which means that {group} cannot count on {support} as much as they used to.",
    slots: [
      slot("trend", "正在发生的社会变化", "families are becoming smaller and more dispersed", "secure full-time jobs are becoming less common"),
      slot("group", "受到变化影响的群体", "people", "workers"),
      slot("support", "过去较稳定、现在减弱的支持", "relatives", "a stable monthly income"),
    ],
    grammar: "which means that 对前面的整体趋势作结果解释；as much as they used to 比较现在与过去。",
    usage: "count on 表示可靠依赖；比较对象必须是过去确实更稳定的支持。",
    simplified: "Smaller, more dispersed families make it harder for people to rely on relatives.",
    transfer: "Secure full-time jobs are becoming less common, which means that workers cannot count on a stable monthly income as much as they used to.",
    usePrompt: "稳定的全职工作正变得不那么常见，这意味着劳动者无法像过去那样依靠稳定的月收入。",
    hints: [hint("稳定的全职工作", "secure full-time jobs"), hint("稳定的月收入", "a stable monthly income")],
    scores: [5, 5, 3, 5, 5], reasons: ["把社会趋势转化为个人层面的具体后果。", "过去与现在的比较自然融入结果句。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "independence-experience-mechanism",
    essay: 3, paragraph: 2, sentence: 3,
    translation: "例如，许多学生选择出国留学，而不是就读本地大学；在学习独立生活的过程中，这段经历会让他们更加独立。",
    functions: ["give_example", "explain_mechanism"], focus: "structure", chunks: [], glosses: [],
    pattern: "For example, {group} choose to {choice} instead of {alternative}, and this experience makes them {outcome} as they {mechanism}.",
    slots: [
      slot("group", "作出选择的群体", "many students", "young adults"),
      slot("choice", "能够带来成长的选择", "study abroad", "join long-term volunteering projects"),
      slot("alternative", "未被选择的常规选项", "going to their local university", "remaining in familiar routines"),
      slot("outcome", "经历带来的变化", "more independent", "more confident"),
      slot("mechanism", "产生变化的具体过程", "learn to live alone", "solve practical problems with unfamiliar people"),
    ],
    grammar: "instead of 后接名词或动名词；as 从句说明经历产生结果的过程。",
    usage: "不要只声称经历有益，必须在 as 从句中补出实际成长机制。",
    simplified: "Studying abroad can make students more independent because they learn to live alone.",
    transfer: "For example, young adults may choose to join long-term volunteering projects instead of remaining in familiar routines, and this experience makes them more confident as they solve practical problems with unfamiliar people.",
    usePrompt: "例如，年轻人可能选择参加长期志愿项目，而不是停留在熟悉的生活模式中；当他们与陌生人一起解决实际问题时，这段经历会让他们更加自信。",
    hints: [hint("长期志愿项目", "long-term volunteering projects"), hint("熟悉的生活模式", "familiar routines"), hint("实际问题", "practical problems"), hint("陌生人", "unfamiliar people")],
    scores: [5, 5, 2, 5, 5], reasons: ["例子不仅给事实，还解释经历如何产生变化。", "适合教育、志愿活动和个人成长话题。"],
    priority: "supporting", difficulty: 5, transferValue: 5,
  },
  {
    key: "independence-another-factor",
    essay: 3, paragraph: 2, sentence: 4,
    learningSentence: "Another factor in growing personal independence is technology, which allows us to work alone and from any part of the world.",
    learningEdits: [{ edit_type: "resolve_reference", before: "this growing independence", after: "growing personal independence", reason: "补足 this 对文章中心趋势的指代。" }],
    translation: "推动个人日益独立的另一个因素是科技，它使我们能够独自工作，并且可以在世界任何地方工作。",
    functions: ["explain_mechanism"], focus: "structure", chunks: [], glosses: [],
    pattern: "Another factor in {trend} is {driver}, which allows {group} to {benefit}.",
    slots: [
      slot("trend", "需要继续解释的趋势", "growing personal independence", "the rise of remote work"),
      slot("driver", "推动趋势的因素", "technology", "cloud technology"),
      slot("group", "从该因素中受益的群体", "us", "teams"),
      slot("benefit", "该因素提供的能力", "work alone and from any part of the world", "collaborate from almost any location"),
    ],
    grammar: "主句补充另一个因素，非限制性 which 从句说明该因素的作用机制。",
    usage: "which 的逻辑主语是 driver；benefit 应具体说明它使谁能够做什么。",
    simplified: "Technology also increases independence by enabling people to work from anywhere.",
    transfer: "Another factor in the rise of remote work is cloud technology, which allows teams to collaborate from almost any location.",
    usePrompt: "推动远程工作兴起的另一个因素是云技术，它使团队几乎可以在任何地点协作。",
    hints: [hint("远程工作的兴起", "the rise of remote work"), hint("云技术", "cloud technology"), hint("协作", "collaborate")],
    scores: [5, 5, 2, 5, 5], reasons: ["用因素加作用机制扩展原因段。", "避免把技术仅列为原因而不解释其作用。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "salary-priority-needs",
    essay: 4, paragraph: 1, sentence: 2,
    learningSentence: "Most people consider it a priority to at least earn a salary that allows them to cover their basic needs and have a reasonable quality of life.",
    learningEdits: [{ edit_type: "resolve_reference", before: "these needs", after: "their basic needs", reason: "补足 needs 对上一句住房、食物等基本需求的指代。" }],
    translation: "大多数人认为，至少获得一份能够满足基本需求并维持合理生活质量的薪水，是一件应当优先考虑的事。",
    functions: ["explain_mechanism"], focus: "mixed",
    chunks: [chunk("consider it a priority to", "认为应优先去做……", "it 是形式宾语，真正内容由后面的不定式给出。")], glosses: [],
    pattern: "{group} consider it a priority to {action} that allows them to {benefit}.",
    slots: [
      slot("group", "把某事视为优先事项的群体", "Most people", "Many families"),
      slot("action", "被优先执行的行动", "at least earn a salary", "build an emergency fund"),
      slot("benefit", "行动提供的保障", "cover their basic needs and have a reasonable quality of life", "cover unexpected expenses without taking on debt"),
    ],
    grammar: "consider it + 名词 + to do 中 it 是形式宾语；that 从句修饰 action 中的核心名词。",
    usage: "priority 后不要再重复 most important；benefit 应说明该优先事项解决什么实际问题。",
    simplified: "Most people prioritise earning enough to meet basic needs and live reasonably well.",
    transfer: "Many families consider it a priority to build an emergency fund that allows them to cover unexpected expenses without taking on debt.",
    usePrompt: "许多家庭认为，建立一笔能够让他们在不负债的情况下支付意外开支的应急资金，是一件应当优先考虑的事。",
    hints: [hint("应急资金", "an emergency fund"), hint("意外开支", "unexpected expenses"), hint("负债", "take on debt")],
    scores: [5, 5, 5, 5, 5], reasons: ["词块和形式宾语结构都值得主动掌握。", "可迁移到家庭、政府和企业资源排序。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "salary-choice-risk",
    essay: 4, paragraph: 1, sentence: 3,
    translation: "如果人们根据兴趣或其他非经济因素选择工作，他们可能会发现自己难以维持生活。",
    functions: ["describe_result", "qualify_claim"], focus: "structure", chunks: [], glosses: [],
    pattern: "If {group} chose {option} based on {appealing_factor}, they might find it difficult to {essential_outcome}.",
    slots: [
      slot("group", "作出选择的主体", "people", "small businesses"),
      slot("option", "被选择的对象", "their jobs", "projects"),
      slot("appealing_factor", "看似有吸引力但不充分的标准", "enjoyment or other non-financial factors", "public attention alone"),
      slot("essential_outcome", "可能难以实现的基本结果", "support themselves", "remain financially sustainable"),
    ],
    grammar: "第二条件句配合 might 表示并非必然的风险；based on 说明选择标准。",
    usage: "适合指出单一标准的风险，但 appealing factor 与 essential outcome 之间必须有合理关系。",
    simplified: "Choosing work only for enjoyment may make it hard to earn enough to live.",
    transfer: "If small businesses chose projects based on public attention alone, they might find it difficult to remain financially sustainable.",
    usePrompt: "如果小企业只根据公众关注度选择项目，它们可能会发现自己难以维持财务上的可持续性。",
    hints: [hint("小企业", "small businesses"), hint("公众关注度", "public attention"), hint("财务上可持续", "financially sustainable")],
    scores: [5, 5, 2, 5, 5], reasons: ["谨慎说明单一选择标准可能带来的代价。", "适合评价职业、消费和企业决策。"],
    priority: "supporting", difficulty: 4, transferValue: 5,
  },
  {
    key: "salary-satisfaction-rather-than",
    essay: 4, paragraph: 2, sentence: 3,
    translation: "许多人的工作满意度来自职业成就、学到的技能以及达到的职位，而不是他们赚到的钱。",
    functions: ["compare_or_weigh", "explain_mechanism"], focus: "structure", chunks: [], glosses: [],
    pattern: "{positive_outcome} come from {source_list}, rather than {contrast}.",
    slots: [
      slot("positive_outcome", "需要解释来源的积极感受", "many people's feelings of job satisfaction", "a strong sense of belonging"),
      slot("source_list", "真正产生该结果的一组来源", "their professional achievements, the skills they learn, and the position they reach", "daily interaction, shared goals and mutual trust"),
      slot("contrast", "被否定的表面来源", "the money they earn", "corporate slogans"),
    ],
    grammar: "come from 说明来源，rather than 将真正来源与较弱解释对比。",
    usage: "source_list 应是同一层级的并列项；rather than 后不要加入与前文无关的新话题。",
    simplified: "Job satisfaction often comes from achievement and growth, not only from pay.",
    transfer: "A strong sense of belonging can come from daily interaction, shared goals and mutual trust, rather than corporate slogans.",
    usePrompt: "强烈的归属感可能来自日常互动、共同目标和相互信任，而不是企业口号。",
    hints: [hint("归属感", "a sense of belonging"), hint("共同目标", "shared goals"), hint("相互信任", "mutual trust"), hint("企业口号", "corporate slogans")],
    scores: [5, 5, 3, 5, 5], reasons: ["通过 rather than 完成原因权衡，而非简单列举。", "可迁移到幸福、教育、社区和工作话题。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "salary-outweigh-motivators",
    essay: 4, paragraph: 3, sentence: 0,
    translation: "虽然薪资无疑会影响人们对职业的选择，但我不认为金钱的重要性超过所有其他动机。",
    functions: ["concession", "state_position", "compare_or_weigh"], focus: "structure", chunks: [], glosses: [],
    pattern: "While {factor} certainly affect {decision}, I do not believe that {factor_noun} outweighs {other_factors}.",
    slots: [
      slot("factor", "需要承认会产生影响的因素", "salaries", "convenience"),
      slot("decision", "受该因素影响的选择", "people's choice of profession", "consumers' choice of transport"),
      slot("factor_noun", "进入权衡的同一因素", "money", "it"),
      slot("other_factors", "不应被忽略的其他因素", "all other motivators", "all other considerations"),
    ],
    grammar: "While 先承认影响存在，主句再否定其压倒性地位；outweigh 是及物动词。",
    usage: "适合反驳‘某一个因素最重要’；不要把 affect 和 outweigh 写成同一强度。",
    simplified: "Salary affects career choices, but it is not more important than every other motive.",
    transfer: "While convenience certainly affects consumers' choice of transport, I do not believe that it outweighs all other considerations.",
    usePrompt: "虽然便利性无疑会影响消费者对交通方式的选择，但我不认为它的重要性超过所有其他考量。",
    hints: [hint("便利性", "convenience"), hint("消费者对交通方式的选择", "consumers' choice of transport"), hint("其他考量", "other considerations")],
    scores: [5, 5, 3, 5, 5], reasons: ["准确区分‘有影响’与‘压倒其他因素’。", "非常适合回应最重要、主要原因类题目。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
  {
    key: "animals-nuanced-position",
    essay: 5, paragraph: 0, sentence: 1,
    translation: "虽然我更倾向于动物实验在道德上是错误的这一观点，但为了研发药物，我仍不得不支持有限度的动物实验。",
    functions: ["concession", "state_position", "qualify_claim"], focus: "mixed",
    chunks: [
      chunk("tend towards the viewpoint that", "较倾向于……这一观点", "用于表明倾向而非绝对立场。"),
      chunk("a limited amount of", "有限度的……", "后接不可数名词；可数名词复数使用 a limited number of。"),
    ], glosses: [],
    pattern: "While I tend towards the viewpoint that {general_position}, I would have to support a limited amount of {exception} for {purpose}.",
    slots: [
      slot("general_position", "总体上更倾向的立场", "animal testing is morally wrong", "public surveillance threatens privacy"),
      slot("exception", "在限定条件下接受的例外", "animal experimentation", "camera monitoring"),
      slot("purpose", "接受例外的具体目的", "the development of medicines", "security in high-risk areas"),
    ],
    grammar: "While 引导让步，tend towards 降低立场绝对性；would have to 表示在条件限制下接受例外。",
    usage: "适合有原则立场但承认有限例外的题目；exception 和 purpose 必须收窄。",
    simplified: "Although I generally oppose animal testing, I accept limited medical experimentation.",
    transfer: "While I tend towards the viewpoint that public surveillance threatens privacy, I would have to support a limited amount of camera monitoring for security in high-risk areas.",
    usePrompt: "虽然我更倾向于公共监控会威胁隐私这一观点，但为了保障高风险地区的安全，我仍不得不支持有限度的摄像头监控。",
    hints: [hint("公共监控", "public surveillance"), hint("威胁隐私", "threaten privacy"), hint("摄像头监控", "camera monitoring"), hint("高风险地区", "high-risk areas")],
    scores: [5, 5, 5, 5, 5], reasons: ["展示原则立场与有限例外如何同时成立。", "词块和让步结构都具有高迁移价值。"],
    priority: "core", difficulty: 5, transferValue: 5,
  },
  {
    key: "animals-common-example",
    essay: 5, paragraph: 1, sentence: 1,
    learningSentence: "To use a common example of animal experimentation, laboratory mice may be given an illness so that the effectiveness of a new drug can be measured.",
    learningEdits: [{ edit_type: "resolve_reference", before: "this practice", after: "animal experimentation", reason: "补足 practice 对上一句动物实验的指代。" }],
    translation: "以动物实验的一个常见例子来说，实验室小鼠可能会被人为致病，以便测量一种新药的有效性。",
    functions: ["give_example", "explain_mechanism"], focus: "structure", chunks: [], glosses: [],
    pattern: "To use a common example of {practice}, {subject} may be {action} so that {outcome} can be measured.",
    slots: [
      slot("practice", "正在讨论的做法", "animal experimentation", "a low-traffic policy"),
      slot("subject", "受到措施影响的对象", "laboratory mice", "selected city-centre streets"),
      slot("action", "为了测试而实施的行动", "given an illness", "closed to traffic"),
      slot("outcome", "需要观察或测量的结果", "the effectiveness of a new drug", "the policy's effect on air pollution"),
    ],
    grammar: "may be + 过去分词说明可能采取的措施；so that 引出可测量的目的。",
    usage: "例子必须服务于论点，并说明为什么实施该行动，而不是只罗列事实。",
    simplified: "For example, researchers may make mice ill to test whether a new drug works.",
    transfer: "To use a common example of a low-traffic policy, selected city-centre streets may be closed to traffic so that the policy's effect on air pollution can be measured.",
    usePrompt: "以低交通量政策的一个常见例子来说，部分市中心街道可能会禁止车辆通行，以便测量该政策对空气污染的影响。",
    hints: [hint("部分市中心街道", "selected city-centre streets"), hint("禁止车辆通行", "closed to traffic"), hint("对空气污染的影响", "effect on air pollution")],
    scores: [5, 5, 2, 5, 4], reasons: ["示范如何给出带有目的解释的具体例子。", "被动语态与 so that 适合描述政策试验和研究。"],
    priority: "supporting", difficulty: 4, transferValue: 4,
  },
  {
    key: "animals-opponents-rights",
    essay: 5, paragraph: 1, sentence: 2,
    learningSentence: "Opponents of animal experimentation argue that humans have no right to subject animals to this kind of trauma, and that the lives of all creatures should be respected.",
    learningEdits: [{ edit_type: "resolve_reference", before: "such research", after: "animal experimentation", reason: "补足 such research 对动物实验的指代。" }],
    translation: "反对动物实验的人认为，人类无权让动物承受这种创伤，而且所有生物的生命都应受到尊重。",
    functions: ["counterargument", "state_position"], focus: "structure", chunks: [],
    glosses: [gloss("trauma", "trauma", "noun", "严重伤害或创伤")],
    pattern: "Opponents of {practice} argue that {actor} have no right to {harmful_action}, and that {principle}.",
    slots: [
      slot("practice", "被反对的做法", "animal experimentation", "commercial facial recognition"),
      slot("actor", "被指责越权的主体", "humans", "companies"),
      slot("harmful_action", "被认为侵犯权利的行动", "subject animals to this kind of trauma", "collect biometric data without consent"),
      slot("principle", "反对者坚持的原则", "the lives of all creatures should be respected", "individual privacy should be respected"),
    ],
    grammar: "argue that 后并列两个宾语从句，第二个 that 保留可使结构更清楚。",
    usage: "have no right to 语气很强，只适合权利或伦理边界明确的论证。",
    simplified: "Critics argue that humans should not harm animals and should respect all living creatures.",
    transfer: "Opponents of commercial facial recognition argue that companies have no right to collect biometric data without consent, and that individual privacy should be respected.",
    usePrompt: "反对商业人脸识别的人认为，企业无权在未经同意的情况下收集生物识别数据，而且个人隐私应当受到尊重。",
    hints: [hint("商业人脸识别", "commercial facial recognition"), hint("生物识别数据", "biometric data"), hint("未经同意", "without consent"), hint("个人隐私", "individual privacy")],
    scores: [5, 5, 3, 5, 5], reasons: ["完整呈现伦理反对者的权利主张与原则依据。", "适合动物伦理、隐私和科技监管。"],
    priority: "core", difficulty: 5, transferValue: 5,
  },
  {
    key: "animals-benefits-justify",
    essay: 5, paragraph: 1, sentence: 3,
    learningSentence: "Opponents of animal experimentation believe that the benefits to humans do not justify the suffering caused, and that scientists should use alternative methods of research.",
    learningEdits: [{ edit_type: "resolve_reference", before: "They", after: "Opponents of animal experimentation", reason: "补足主语对上一句反对者的指代。" }],
    translation: "动物实验的反对者认为，给人类带来的利益并不能证明由此造成的痛苦是合理的，科学家应当采用替代研究方法。",
    functions: ["compare_or_weigh", "propose_solution"], focus: "structure", chunks: [], glosses: [],
    pattern: "{group} believe that the benefits to {beneficiary} do not justify {cost}, and that {alternative_action}.",
    slots: [
      slot("group", "进行价值判断的群体", "Opponents of animal experimentation", "Critics of fast fashion"),
      slot("beneficiary", "获得利益的对象", "humans", "consumers"),
      slot("cost", "被认为不可接受的代价", "the suffering caused", "the environmental harm caused"),
      slot("alternative_action", "降低代价的替代做法", "scientists should use alternative methods of research", "retailers should adopt more durable production models"),
    ],
    grammar: "justify 后直接接名词性代价；and that 并列价值判断与替代方案。",
    usage: "benefit 与 cost 必须能够比较；替代方案应回应前面的具体伤害。",
    simplified: "They argue that human benefits do not excuse animal suffering and that other research methods should be used.",
    transfer: "Critics of fast fashion believe that the benefits to consumers do not justify the environmental harm caused, and that retailers should adopt more durable production models.",
    usePrompt: "快时尚的批评者认为，给消费者带来的利益并不能证明由此造成的环境损害是合理的，而且零售商应当采用更耐久的生产模式。",
    hints: [hint("快时尚的批评者", "critics of fast fashion"), hint("环境损害", "environmental harm"), hint("零售商", "retailers"), hint("更耐久的生产模式", "more durable production models")],
    scores: [5, 4, 3, 5, 5], reasons: ["同时完成利益—代价权衡与替代方案提出。", "可迁移到消费、环境和科技伦理。"],
    priority: "core", difficulty: 5, transferValue: 5,
  },
  {
    key: "animals-personal-stake",
    essay: 5, paragraph: 2, sentence: 2,
    learningSentence: "Supporters of animal experimentation argue that opponents of such research might feel differently if a member of their own families needed a medical treatment that had been developed through the use of animal experimentation.",
    learningEdits: [{ edit_type: "resolve_reference", before: "They", after: "Supporters of animal experimentation", reason: "补足主语对上一句支持者的指代。" }],
    translation: "动物实验的支持者认为，如果反对者自己的家人需要一种通过动物实验研发出来的治疗方法，他们的看法可能会不同。",
    functions: ["counterargument", "qualify_claim"], focus: "structure", chunks: [], glosses: [],
    pattern: "{supporters} argue that {opponents} might feel differently if {personal_stake}.",
    slots: [
      slot("supporters", "提出反驳的一方", "Supporters of animal experimentation", "Supporters of nuclear energy"),
      slot("opponents", "被要求重新考虑的一方", "opponents of such research", "opponents of this technology"),
      slot("personal_stake", "会改变抽象判断的切身情境", "a member of their own families needed a medical treatment that had been developed through the use of animal experimentation", "their own community faced repeated power shortages"),
    ],
    grammar: "might feel differently 保持推测语气；if 从句引入可能改变立场的切身情境。",
    usage: "这是反驳视角而非事实证据，不能用个人利害替代对政策风险的完整分析。",
    simplified: "Supporters argue that critics might change their minds if their own family needed such a treatment.",
    transfer: "Supporters of nuclear energy argue that opponents of this technology might feel differently if their own community faced repeated power shortages.",
    usePrompt: "核能的支持者认为，如果反对者自己的社区反复面临电力短缺，他们对这项技术的看法可能会不同。",
    hints: [hint("核能", "nuclear energy"), hint("这项技术的反对者", "opponents of this technology"), hint("反复面临", "face repeated"), hint("电力短缺", "power shortages")],
    scores: [5, 5, 2, 5, 4], reasons: ["示范如何通过切身情境构造反驳。", "might 保留必要的不确定性，避免武断推断。"],
    priority: "supporting", difficulty: 5, transferValue: 4,
  },
  {
    key: "animals-necessary-evil",
    essay: 5, paragraph: 2, sentence: 3,
    learningSentence: "Personally, I agree with the banning of animal testing for non-medical products, but I feel that animal testing may be a necessary evil where new drugs and medical procedures are concerned.",
    learningEdits: [{ edit_type: "resolve_reference", before: "it", after: "animal testing", reason: "补足 it 对动物实验的指代，使句子可独立学习。" }],
    translation: "就我个人而言，我赞成禁止为非医疗产品进行动物实验，但在新药和医疗程序方面，我认为动物实验可能是一种不得已的手段。",
    functions: ["concession", "state_position", "qualify_claim"], focus: "mixed",
    chunks: [
      chunk("a necessary evil", "不得已但被认为必要的做法", "含明显负面评价，只用于承认有害但暂时难以避免的措施。"),
      chunk("where new drugs and medical procedures are concerned", "在新药和医疗程序方面", "where ... are concerned 用于限定讨论范围。"),
    ], glosses: [],
    pattern: "I agree with {restriction}, but I feel that {practice} may be a necessary evil where {exception} are concerned.",
    slots: [
      slot("restriction", "总体支持的限制", "the banning of animal testing for non-medical products", "restricting private cars in historic centres"),
      slot("practice", "在例外情境下仍被接受的做法", "animal testing", "limited vehicle access"),
      slot("exception", "允许例外的具体领域", "new drugs and medical procedures", "emergency services"),
    ],
    grammar: "but 连接总体限制与有限例外；where ... are concerned 将例外限制在特定领域。",
    usage: "necessary evil 语气强，不能用来泛指普通缺点；必须说明为什么暂时必要。",
    simplified: "I oppose non-medical animal testing but accept that it may be necessary for medicine.",
    transfer: "I agree with restricting private cars in historic centres, but I feel that limited vehicle access may be a necessary evil where emergency services are concerned.",
    usePrompt: "我赞成限制私家车进入历史城区，但在紧急服务方面，我认为有限度的车辆通行可能是一种不得已的做法。",
    hints: [hint("限制私家车", "restrict private cars"), hint("历史城区", "historic centres"), hint("有限度的车辆通行", "limited vehicle access"), hint("紧急服务", "emergency services")],
    scores: [5, 5, 5, 5, 5], reasons: ["把总体原则与特定例外清楚分开。", "两个词块都能用于谨慎限定立场。"],
    priority: "core", difficulty: 5, transferValue: 5,
  },
  {
    key: "animals-until-alternatives",
    essay: 5, paragraph: 3, sentence: 0,
    translation: "在同样有效的替代方法研发出来之前，禁止为重要医学研究进行动物实验是不妥的。",
    functions: ["state_position", "qualify_claim"], focus: "structure", chunks: [], glosses: [],
    pattern: "It would be wrong to ban {practice} until {alternative} have been developed.",
    slots: [
      slot("practice", "暂时不应被全面禁止的做法", "testing on animals for vital medical research", "conventional heating systems in cold regions"),
      slot("alternative", "禁令实施前必须具备的替代方案", "equally effective alternatives", "equally reliable alternatives"),
    ],
    grammar: "It would be wrong to 表示规范判断；until 从句给禁令设置时间或条件边界。",
    usage: "适合‘先有替代、再淘汰旧方案’的论证；alternatives 必须与原方案在关键功能上可比。",
    simplified: "Animal testing should not be banned before equally effective medical alternatives exist.",
    transfer: "It would be wrong to ban conventional heating systems in cold regions until equally reliable alternatives have been developed.",
    usePrompt: "在同样可靠的替代方案研发出来之前，禁止在寒冷地区使用传统供暖系统是不妥的。",
    hints: [hint("传统供暖系统", "conventional heating systems"), hint("寒冷地区", "cold regions"), hint("同样可靠的替代方案", "equally reliable alternatives")],
    scores: [5, 5, 2, 5, 5], reasons: ["为禁令设置清楚、可验证的实施条件。", "可迁移到能源、技术和公共卫生转型。"],
    priority: "core", difficulty: 4, transferValue: 5,
  },
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
  const source = sourceByEssay.get(spec.essay);
  if (!source) throw new Error(`Unknown Simon essay ${spec.essay}`);
  const paragraph = source.paragraphs.find((item) => item.paragraph_index === spec.paragraph);
  if (!paragraph) throw new Error(`${spec.key}: missing paragraph ${spec.paragraph}`);
  const sentences = sentenceList(paragraph.text);
  const original = sentences[spec.sentence];
  if (!original) throw new Error(`${spec.key}: missing sentence ${spec.sentence}`);
  const learning = spec.learningSentence ?? original;
  for (const item of [...spec.chunks, ...spec.glosses]) {
    if (!learning.includes(item.text)) throw new Error(`${spec.key}: '${item.text}' is not in the learning sentence`);
  }
  if (spec.focus === "vocabulary" && spec.chunks.length === 0) {
    throw new Error(`${spec.key}: vocabulary cards require a target chunk`);
  }
  if (spec.focus !== "vocabulary" && (!spec.pattern || spec.slots.length === 0)) {
    throw new Error(`${spec.key}: structure and mixed cards require a pattern and slots`);
  }

  const cardId = uuidFrom(`card:${promptVersion}:${spec.key}`);
  const candidateId = uuidFrom(`candidate:${promptVersion}:${spec.key}`);
  const chunkCloze = spec.chunks.length
    ? [{
        chunk_text: spec.chunks[0].text,
        prompt_sentence: learning.replace(spec.chunks[0].text, "_____"),
        reference_answer: spec.chunks[0].text,
      }]
    : undefined;
  const slotReplacement = spec.focus !== "vocabulary"
    ? [{
        prompt_zh: spec.usePrompt,
        hints: spec.hints,
        slot_values: spec.slots.map((item) => ({
          slot_name: item.name,
          value: item.replacement_examples[0],
        })),
        reference_answer: spec.transfer,
      }]
    : undefined;
  const guidedApplication = spec.focus === "vocabulary"
    ? {
        prompt_zh: spec.usePrompt,
        hints: spec.hints,
        target_chunk: spec.chunks[0].text,
        reference_answer: spec.transfer,
      }
    : undefined;

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
      context_before: sentences[spec.sentence - 1] ?? "",
      context_after: sentences[spec.sentence + 1] ?? "",
      paragraph_index: spec.paragraph,
      sentence_index: spec.sentence,
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
        translation_recall: { prompt_zh: spec.translation, reference_answer: learning },
        ...(slotReplacement ? { slot_replacement: slotReplacement } : {}),
        ...(guidedApplication ? { guided_application: guidedApplication } : {}),
      },
      difficulty: spec.difficulty,
      transfer_value: spec.transferValue,
      source_reliability: "teacher_authored",
      content_status: "approved",
      content_revision: 3,
      normalized_text_hash: normalizedHash(learning),
      created_at: createdAt,
      updated_at: approvedAt,
    },
    source_match: {
      match_type: "exact",
      matched_text: original,
      paragraph_index: spec.paragraph,
      sentence_index: spec.sentence,
    },
    selection_scores: {
      naturalness: spec.scores[0],
      context_independence: spec.scores[1],
      vocabulary_value: spec.scores[2],
      structure_value: spec.scores[3],
      transfer_value: spec.scores[4],
    },
    recommendation_reasons: spec.reasons,
    uncertainties: ["合集未提供 Simon 一手文章 URL 或 IELTS 考官评语；作者归属与合集 Band 标签不能视为官方认证。"],
    workflow_status: "approved",
    priority: spec.priority,
    provenance: {
      guideline_version: "1.0.0",
      prompt_version: promptVersion,
      processor_type: "codex",
      model_id: null,
    },
    review_history: [{
      action: "created",
      reviewer: "Codex",
      reason: "按校准批次内容规范生成候选，等待批次人工确认；尚未进入正式学习库。",
      reviewed_at: createdAt,
    }, {
      action: "edited",
      reviewer: "Codex",
      reason: "校准批次自检后补足学习句指代，并修正中文释义与仿写表达。",
      reviewed_at: revisedAt,
    }, {
      action: "approved",
      reviewer: "user",
      reason: "用户确认前五篇校准批次的筛句密度、分类与练习方向可以，批准整批收录。",
      reviewed_at: approvedAt,
    }],
    created_at: createdAt,
    updated_at: approvedAt,
  };
}

const generated = specs.map(makeCandidate);
const retained = existingCandidates.filter((candidate) => candidate.provenance?.prompt_version !== promptVersion);
const merged = [...retained, ...generated];
const hashes = new Map();
for (const candidate of merged) {
  const hash = candidate.card.normalized_text_hash;
  if (hashes.has(hash)) {
    throw new Error(`Duplicate learning sentence: ${candidate.card.learning_sentence}`);
  }
  hashes.set(hash, candidate.candidate_id);
}

fs.writeFileSync(candidatePath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
const existingApprovedById = new Map(existingApprovedCards.map((card) => [card.id, card]));
const approvedCards = merged
  .filter((candidate) => candidate.workflow_status === "approved")
  .map((candidate) => {
    const existing = existingApprovedById.get(candidate.card.id);
    return existing && existing.content_revision >= candidate.card.content_revision
      ? existing
      : candidate.card;
  });
fs.writeFileSync(approvedPath, `${JSON.stringify(approvedCards, null, 2)}\n`, "utf8");

const byEssay = new Map();
const byFocus = new Map();
for (const candidate of generated) {
  const source = sources.find((item) => item.id === candidate.card.source_essay_id);
  byEssay.set(source.title, (byEssay.get(source.title) ?? 0) + 1);
  byFocus.set(candidate.card.primary_focus, (byFocus.get(candidate.card.primary_focus) ?? 0) + 1);
}
const lines = [
  "# Simon 前五篇校准批次审核记录",
  "",
  `- 生成时间：${createdAt}`,
  `- 批次版本：\`${promptVersion}\``,
  `- 批准收录：${generated.length} 张，用户于 ${approvedAt} 完成批次确认`,
  `- 类型分布：${[...byFocus].map(([focus, count]) => `${focus} ${count}`).join("；")}`,
  `- 篇目分布：${[...byEssay].map(([title, count]) => `${title} ${count}`).join("；")}`,
  "- 筛选原则：不按篇凑数；排除机械开头、基础透明表达和与现有卡高度重复的结构。",
  "",
];

generated.forEach((candidate, index) => {
  const card = candidate.card;
  const source = sources.find((item) => item.id === card.source_essay_id);
  const useSeed = card.primary_focus === "vocabulary"
    ? card.exercise_seed.guided_application
    : card.exercise_seed.slot_replacement[0];
  lines.push(
    `## ${index + 1}. ${source.title}`,
    "",
    `- 原句：${card.original_sentence}`,
    ...(card.learning_sentence !== card.original_sentence ? [`- 学习句：${card.learning_sentence}`] : []),
    `- 位置：${source.publication_ref}，段落 ${card.paragraph_index + 1}，句子 ${card.sentence_index + 1}`,
    `- 中文：${card.translation_zh}`,
    `- 训练重点：${card.primary_focus}`,
    `- 核心词块：${card.chunks.map((item) => item.text).join("；") || "无"}`,
    `- 仿写中文：${useSeed.prompt_zh}`,
    `- 参考答案：${useSeed.reference_answer}`,
    `- 推荐理由：${candidate.recommendation_reasons.join("；")}`,
    `- 优先级：${candidate.priority}`,
    "",
  );
});

fs.writeFileSync(reviewPath, `${lines.join("\n")}\n`, "utf8");
process.stdout.write(
  `Generated ${generated.length} calibration candidates; total candidates ${merged.length}. `
  + `Focus: ${[...byFocus].map(([focus, count]) => `${focus}=${count}`).join(", ")}.\n`,
);
