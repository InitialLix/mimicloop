import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const batchKey = process.argv[2] ?? "18-27";
const batchConfig = {
  "18-27": { lessons: new Set([18, 27]), promptVersion: "nce3-language-richness-v1", reviewFile: "nce3-candidate-review.md", label: "第 18、27 课", createdAt: "2026-08-18T08:20:00.000Z" },
  "29-38": { lessons: new Set([29, 38]), promptVersion: "nce3-language-richness-29-38-v1", reviewFile: "nce3-lessons-29-38-candidate-review.md", label: "第 29、38 课", createdAt: "2026-08-19T01:30:00.000Z" },
  "29-59": { lessons: new Set([29, 38, 41, 44, 45, 47, 51, 53, 55, 59]), promptVersion: "nce3-language-richness-lessons-29-59-v1", reviewFile: "nce3-lessons-29-59-candidate-review.md", label: "第 29、38、41、44、45、47、51、53、55、59 课", createdAt: "2026-08-19T02:00:00.000Z" },
}[batchKey];
if (!batchConfig) throw new Error(`Unknown NCE3 batch '${batchKey}'.`);
const paths = {
  sources: path.join(root, "data", "source_essays.json"),
  cards: path.join(root, "data", "candidate_cards.json"),
  approvedCards: path.join(root, "data", "approved_cards.seed.json"),
  collocations: path.join(root, "data", "candidate_collocations.json"),
  approvedCollocations: path.join(root, "data", "approved_collocations.seed.json"),
  review: path.join(root, "sources", "metadata", batchConfig.reviewFile),
};
const createdAt = batchConfig.createdAt;
const promptVersion = batchConfig.promptVersion;

const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");
const normalizeSentence = (text) => text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const normalizeCollocation = (text) => text.normalize("NFKC").toLowerCase().replace(/[.!?,;:]+$/g, "").replace(/\s+/g, " ").trim();
const sentenceList = (paragraph) => (paragraph.match(/[^.!?]+(?:[.!?]+(?:[”’"']+)?|$)/g) ?? []).map((item) => item.trim()).filter(Boolean);

function uuidFrom(seed) {
  const bytes = crypto.createHash("sha256").update(seed).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const sources = JSON.parse(fs.readFileSync(paths.sources, "utf8"));
const sourceByLesson = new Map(sources
  .filter((source) => source.content_role === "language_richness_corpus")
  .map((source) => [Number(source.publication_ref.match(/Lesson (\d+)/)?.[1]), source]));

function locatedSentence(lesson, paragraphIndex, sentenceIndex) {
  const source = sourceByLesson.get(lesson);
  if (!source) throw new Error(`Missing NCE3 lesson ${lesson} source.`);
  const paragraph = source.paragraphs[paragraphIndex];
  const sentence = paragraph ? sentenceList(paragraph.text)[sentenceIndex] : null;
  if (!sentence) throw new Error(`Missing sentence L${lesson} P${paragraphIndex} S${sentenceIndex}.`);
  return { source, sentence, sentences: sentenceList(paragraph.text) };
}

const sentenceSpecs = [
  {
    key: "l18-idea-is-mistaken", lesson: 18, paragraph: 0, sentence: 1,
    translation: "认为现代艺术只能在博物馆里看到，这种看法是错误的。",
    questionTypes: ["opinion", "discussion"], functions: ["counterargument", "state_position"], focus: "structure",
    chunks: [], glosses: [],
    pattern: "The idea that {claim} is mistaken.",
    slots: [{ name: "claim", role_zh: "被反驳的绝对化观点", original_value: "modern art can only be seen in museums", replacement_examples: ["university education is only useful for young people"] }],
    grammar: "that 引导同位语从句，mistaken 评价的是前面的 idea。",
    usage: "适合直接反驳过度绝对化的观点；后文仍需补充理由。",
    simplified: "It is wrong to think that modern art can only be seen in museums.",
    usePrompt: "认为大学教育只对年轻人有用，这种看法是错误的。",
    hints: [{ zh: "大学教育", en: "university education" }],
    transfer: "The idea that university education is only useful for young people is mistaken.",
    difficulty: 3, transferValue: 5, scores: [5, 5, 2, 5, 5], priority: "core",
    reasons: ["用简洁框架直接指出绝对化观点有误，可迁移到立场与反驳段。"],
  },
  {
    key: "l18-cannot-have-failed-to-notice", lesson: 18, paragraph: 0, sentence: 2,
    translation: "即使对艺术毫无兴趣的人，也不可能没有注意到公共场所展出的现代雕塑。",
    questionTypes: ["opinion", "discussion"], functions: ["give_example", "counterargument"], focus: "mixed",
    chunks: [
      { text: "take no interest in", meaning_zh: "对……毫无兴趣", note: "与 take an interest in 相对，后接名词或动名词。" },
      { text: "cannot have failed to notice", meaning_zh: "不可能没有注意到", note: "以双重否定强调过去必然已经注意到。" },
    ],
    glosses: [],
    pattern: "Even {group} who {limited_engagement} cannot have failed to notice {evidence}.",
    slots: [
      { name: "group", role_zh: "即使缺少关注的人群", original_value: "people", replacement_examples: ["people"] },
      { name: "limited_engagement", role_zh: "缺少关注或参与", original_value: "take no interest in art", replacement_examples: ["take no interest in climate change"] },
      { name: "evidence", role_zh: "明显到无法忽视的证据", original_value: "examples of modern sculpture on display in public places", replacement_examples: ["the increase in extreme weather in recent years"] },
    ],
    grammar: "cannot have failed to notice 相当于 must have noticed，但语气更强调“无法没看见”。",
    usage: "语气较强，只适合证据十分明显的情况，不能代替普通的 may have noticed。",
    simplified: "Even people uninterested in art must have noticed modern sculpture in public places.",
    usePrompt: "即使不关心气候变化的人，也不可能没有注意到近年来极端天气的增多。",
    hints: [{ zh: "气候变化", en: "climate change" }, { zh: "极端天气", en: "extreme weather" }],
    transfer: "Even people who take no interest in climate change cannot have failed to notice the increase in extreme weather in recent years.",
    difficulty: 5, transferValue: 5, scores: [5, 4, 5, 5, 5], priority: "core",
    reasons: ["同时提供自然词块与高强度证据框架，适合迁移到环境、科技和社会议题。"],
  },
  {
    key: "l27-though-possible-difficult", lesson: 27, paragraph: 0, sentence: 2,
    translation: "尽管可以用金钱衡量物质商品的价值，但要估计人们为我们提供的服务的真正价值却极其困难。",
    questionTypes: ["opinion", "discussion", "two_part_multi_part"], functions: ["concession", "compare_or_weigh"], focus: "structure",
    chunks: [], glosses: [],
    pattern: "Though it may be possible to {measurable_action}, it is extremely difficult to {harder_judgement}.",
    slots: [
      { name: "measurable_action", role_zh: "相对容易量化的判断", original_value: "measure the value of material goods in terms of money", replacement_examples: ["measure students' academic performance in terms of exam results"] },
      { name: "harder_judgement", role_zh: "更难准确判断的内容", original_value: "estimate the true value of the services which people perform for us", replacement_examples: ["assess their creativity accurately"] },
    ],
    grammar: "Though 引出有限承认，两个 it 分别服务于不定式结构，形成可量化与难判断的对照。",
    usage: "适合比较量化指标与难以量化的品质，避免把后者直接说成完全无法评价。",
    simplified: "Material goods can be priced, but services are much harder to value accurately.",
    usePrompt: "尽管可以用考试成绩衡量学生的学术表现，但要准确评估他们的创造力却极其困难。",
    hints: [{ zh: "考试成绩", en: "exam results" }, { zh: "学术表现", en: "academic performance" }, { zh: "创造力", en: "creativity" }],
    transfer: "Though it may be possible to measure students' academic performance in terms of exam results, it is extremely difficult to assess their creativity accurately.",
    difficulty: 5, transferValue: 5, scores: [5, 5, 3, 5, 5], priority: "core",
    reasons: ["把“可量化”与“难准确判断”放进同一让步结构，适合教育、经济与公共政策论证。"],
  },
  {
    key: "l27-there-are-times-when-yet", lesson: 27, paragraph: 0, sentence: 3,
    translation: "有时我们愿意付出自己拥有的一切来挽救生命，却可能舍不得为提供这种服务的外科医生支付高额费用。",
    questionTypes: ["opinion", "discussion", "two_part_multi_part"], functions: ["concession", "compare_or_weigh"], focus: "structure",
    chunks: [],
    glosses: [{ text: "grudge", lemma: "grudge", part_of_speech: "verb", meaning_zh: "不情愿给或做", note: "后接名词或动名词。", occurrence_index: 0 }],
    pattern: "There are times when {willing_action}, yet {reluctant_action}.",
    slots: [
      { name: "willing_action", role_zh: "口头上或特定情况下愿意承担的投入", original_value: "we would willingly give everything we possess to save our lives", replacement_examples: ["governments are willing to spend heavily on major infrastructure"] },
      { name: "reluctant_action", role_zh: "与前项形成反差的现实选择", original_value: "we might grudge paying a surgeon a high fee for offering us precisely this service", replacement_examples: ["they are reluctant to fund basic community services"] },
    ],
    grammar: "There are times when 引出并非始终成立的情形，yet 突出行为或态度上的反差。",
    usage: "适合揭示资源分配或态度上的矛盾，不宜把偶发现象写成普遍规律。",
    simplified: "People may value a service greatly but still be unwilling to pay for it.",
    usePrompt: "有时候政府愿意为大型基础设施投入巨资，却不愿意资助基本的社区服务。",
    hints: [{ zh: "大型基础设施", en: "major infrastructure" }, { zh: "社区服务", en: "community services" }],
    transfer: "There are times when governments are willing to spend heavily on major infrastructure, yet they are reluctant to fund basic community services.",
    difficulty: 4, transferValue: 5, scores: [5, 4, 3, 5, 5], priority: "core",
    reasons: ["用有限情形加转折揭示投入意愿的矛盾，能够承担比较与批评论证功能。"],
  },
  {
    key: "l27-conditions-are-such-that", lesson: 27, paragraph: 0, sentence: 4,
    translation: "社会条件决定，技能必须像商店里的商品一样付费获得。",
    questionTypes: ["opinion", "discussion", "causes_solutions"], functions: ["explain_mechanism", "describe_result"], focus: "structure",
    chunks: [], glosses: [],
    pattern: "{conditions} are such that {result}.",
    slots: [
      { name: "conditions", role_zh: "造成强烈结果的环境或压力", original_value: "The conditions of society", replacement_examples: ["The pressures in urban housing markets"] },
      { name: "result", role_zh: "由这些条件造成的结果", original_value: "skills have to be paid for in the same way that goods are paid for at a shop", replacement_examples: ["many young people cannot afford to buy a home independently"] },
    ],
    grammar: "such that 表示前述条件达到会产生后项结果的程度；本句主语为复数，因此使用 are。",
    usage: "属于较正式且力度较强的结果结构，前项必须确实足以解释后项。",
    simplified: "Social conditions mean that skills, like goods, have a price.",
    usePrompt: "城市住房市场的压力如此之大，以至于许多年轻人无法独立买房。",
    hints: [{ zh: "城市住房市场", en: "urban housing markets" }],
    transfer: "The pressures in urban housing markets are such that many young people cannot afford to buy a home independently.",
    difficulty: 4, transferValue: 4, scores: [5, 4, 2, 5, 4], priority: "supporting",
    reasons: ["提供正式的“条件达到某种程度—产生结果”结构，适合机制解释。"],
  },
  {
    key: "l29-whether-depends-on", lesson: 29, paragraph: 0, sentence: 0,
    translation: "我们是否觉得一个笑话好笑，很大程度上取决于我们的成长环境。",
    questionTypes: ["opinion", "discussion", "two_part_multi_part"], functions: ["explain_mechanism", "compare_or_weigh"], focus: "structure",
    chunks: [], glosses: [],
    pattern: "Whether {contrasting_evaluations} largely depends on {influence}.",
    slots: [
      { name: "contrasting_evaluations", role_zh: "对同一事物的两种相反判断", original_value: "we find a joke funny or not", replacement_examples: ["people see public surveillance as a necessary safeguard or an invasion of privacy"] },
      { name: "influence", role_zh: "影响判断的背景因素", original_value: "where we have been brought up", replacement_examples: ["how much they trust public institutions"] },
    ],
    grammar: "Whether 引导名词性从句作主语，or 连接两种相反判断；depend on 后接决定该判断的因素。",
    usage: "适合解释同一政策为何会引起不同评价；后项必须是真正影响判断的因素，而不是同义改写。",
    simplified: "People's reactions to a joke depend greatly on their upbringing.",
    usePrompt: "人们把公共监控视为必要保障还是侵犯隐私，很大程度上取决于他们对公共机构的信任程度。",
    hints: [{ zh: "公共监控", en: "public surveillance" }, { zh: "必要保障", en: "a necessary safeguard" }, { zh: "侵犯隐私", en: "an invasion of privacy" }, { zh: "公共机构", en: "public institutions" }],
    transfer: "Whether people see public surveillance as a necessary safeguard or an invasion of privacy largely depends on how much they trust public institutions.",
    difficulty: 4, transferValue: 5, scores: [5, 5, 3, 5, 5], priority: "core",
    reasons: ["把分歧判断与其背景原因连接起来，适合社会、科技和教育议题中的机制解释。"],
  },
  {
    key: "l29-bound-up-with", lesson: 29, paragraph: 0, sentence: 1,
    translation: "幽默感与民族特征有着一种难以解释的紧密联系。",
    questionTypes: ["opinion", "discussion", "causes_solutions"], functions: ["explain_mechanism", "describe_result"], focus: "mixed",
    chunks: [{ text: "bound up with", meaning_zh: "与……密切相关", note: "常用 closely bound up with；表示两个因素难以分开理解，不等于已经证明严格因果。" }], glosses: [],
    pattern: "{subject} is {degree} bound up with {factor}.",
    slots: [
      { name: "subject", role_zh: "需要解释的态度或现象", original_value: "The sense of humour", replacement_examples: ["Public attitudes towards welfare"] },
      { name: "degree", role_zh: "关联程度", original_value: "mysteriously", replacement_examples: ["closely"] },
      { name: "factor", role_zh: "与前项密切相关的因素", original_value: "national characteristics", replacement_examples: ["perceptions of fairness"] },
    ],
    grammar: "be bound up with 后接名词或名词短语；正式写作中 closely 比 mysteriously 更容易自然迁移。",
    usage: "用于说明紧密联系，不能在没有证据时直接写成 causes 或 results in。",
    simplified: "A society's sense of humour is closely linked to its national characteristics.",
    usePrompt: "公众对社会福利的态度与他们对公平的看法密切相关。",
    hints: [{ zh: "社会福利", en: "welfare" }, { zh: "对公平的看法", en: "perceptions of fairness" }],
    transfer: "Public attitudes towards welfare are closely bound up with perceptions of fairness.",
    difficulty: 4, transferValue: 5, scores: [5, 5, 5, 5, 5], priority: "core",
    reasons: ["完整句既展示关系表达，也提醒学习者区分紧密关联与严格因果。"],
  },
  {
    key: "l29-universal-appeal", lesson: 29, paragraph: 0, sentence: 5,
    translation: "尽管存在民族差异，某些滑稽情境仍具有普遍吸引力。",
    questionTypes: ["opinion", "discussion"], functions: ["concession", "qualify_claim"], focus: "mixed",
    chunks: [{ text: "have a universal appeal", meaning_zh: "具有普遍吸引力", note: "适合描述能跨越文化或群体差异的内容；不要用于只在局部市场流行的事物。" }], glosses: [],
    pattern: "In spite of {differences}, {content} have a universal appeal.",
    slots: [
      { name: "differences", role_zh: "本来可能限制传播的差异", original_value: "national differences", replacement_examples: ["cultural differences"] },
      { name: "content", role_zh: "能够跨越差异的内容", original_value: "certain funny situations", replacement_examples: ["stories about family relationships"] },
    ],
    grammar: "In spite of 后接名词短语；appeal 在这里是不可数名词，have universal appeal 也很常见。",
    usage: "让步前项与普遍性后项必须形成真实反差；不要把 global popularity 和 universal appeal 完全等同。",
    simplified: "Some humorous situations appeal to people across cultures.",
    usePrompt: "尽管存在文化差异，关于家庭关系的故事往往具有普遍吸引力。",
    hints: [{ zh: "文化差异", en: "cultural differences" }, { zh: "家庭关系", en: "family relationships" }],
    transfer: "In spite of cultural differences, stories about family relationships often have universal appeal.",
    difficulty: 3, transferValue: 4, scores: [5, 5, 4, 4, 4], priority: "supporting",
    reasons: ["把让步与跨文化普遍性放在同一句中，适合文化和媒体类论证。"],
  },
  {
    key: "l38-shed-light-on", lesson: 38, paragraph: 0, sentence: 7,
    translation: "即使看似微不足道的遗物，也能为了解早期人类历史提供有价值的线索。",
    questionTypes: ["opinion", "discussion", "two_part_multi_part"], functions: ["give_example", "explain_mechanism"], focus: "mixed",
    chunks: [{ text: "shed interesting light on", meaning_zh: "为理解……提供有价值的线索", note: "现代正式写作更常见 shed light on；后接需要被解释的问题或现象。" }], glosses: [],
    pattern: "Even seemingly {minor_evidence} can shed light on {broader_issue}.",
    slots: [
      { name: "minor_evidence", role_zh: "表面上不起眼的证据", original_value: "insignificant remains", replacement_examples: ["minor changes in consumer behaviour"] },
      { name: "broader_issue", role_zh: "证据所帮助解释的更大问题", original_value: "the history of early man", replacement_examples: ["broader economic trends"] },
    ],
    grammar: "Even 强调出人意料的证据价值；shed light on 后接名词短语。",
    usage: "表示帮助理解而非彻底证明；若证据只能说明相关性，不要写成 prove。",
    simplified: "Small pieces of evidence can help us understand early human history.",
    usePrompt: "即使消费者行为中看似微小的变化，也能帮助我们理解更广泛的经济趋势。",
    hints: [{ zh: "消费者行为", en: "consumer behaviour" }, { zh: "更广泛的经济趋势", en: "broader economic trends" }],
    transfer: "Even seemingly minor changes in consumer behaviour can shed light on broader economic trends.",
    difficulty: 4, transferValue: 5, scores: [5, 5, 5, 5, 5], priority: "core",
    reasons: ["以小证据说明大问题，同时包含正式写作中高频且边界清楚的证据表达。"],
  },
  {
    key: "l38-assumption-and-reason", lesson: 38, paragraph: 0, sentence: 8,
    translation: "直到现在，历史学家一直认为日历随着农业出现，因为当时人类确实需要了解季节。",
    questionTypes: ["discussion", "causes_solutions", "two_part_multi_part"], functions: ["explain_mechanism", "state_position"], focus: "structure",
    chunks: [], glosses: [],
    pattern: "For many years, {group} assumed that {claim}, because {reason}.",
    slots: [
      { name: "group", role_zh: "持有旧观点的群体", original_value: "historians", replacement_examples: ["educators"] },
      { name: "claim", role_zh: "过去被普遍接受的解释", original_value: "calendars came into being with the advent of agriculture", replacement_examples: ["intelligence was fixed"] },
      { name: "reason", role_zh: "旧观点看似合理的依据", original_value: "man was faced with a real need to understand something about the seasons", replacement_examples: ["exam results were treated as a reliable measure of ability"] },
    ],
    grammar: "先交代长期存在的旧假设，再用 because 给出其当时看似合理的依据；现代写作不必机械保留原句的 for then。",
    usage: "适合随后引入新证据修正旧观点；不能虚构某一群体长期持有的共识。",
    simplified: "Historians believed calendars appeared with agriculture because farmers needed to understand the seasons.",
    usePrompt: "多年来，教育工作者一直认为智力是固定的，因为考试成绩被视为衡量能力的可靠标准。",
    hints: [{ zh: "教育工作者", en: "educators" }, { zh: "固定的", en: "fixed" }, { zh: "衡量能力的可靠标准", en: "a reliable measure of ability" }],
    transfer: "For many years, educators assumed that intelligence was fixed because exam results were treated as a reliable measure of ability.",
    difficulty: 4, transferValue: 5, scores: [5, 4, 3, 5, 5], priority: "core",
    reasons: ["训练“旧假设—当时依据”的完整论证组织，为下一句引入反证预留位置。"],
  },
  {
    key: "l38-by-correlating", lesson: 38, paragraph: 1, sentence: 5,
    translation: "通过关联世界不同地区留下的标记，历史学家得以解读这套复杂符号。",
    questionTypes: ["discussion", "causes_solutions", "two_part_multi_part"], functions: ["explain_mechanism", "describe_result"], focus: "structure",
    chunks: [], glosses: [],
    pattern: "By {method}, {researchers} have been able to {result}.",
    slots: [
      { name: "method", role_zh: "产生发现的比较或分析方法", original_value: "correlating markings made in various parts of the world", replacement_examples: ["comparing data collected in different regions"] },
      { name: "researchers", role_zh: "执行研究的主体", original_value: "historians", replacement_examples: ["researchers"] },
      { name: "result", role_zh: "通过该方法取得的发现", original_value: "read this difficult code", replacement_examples: ["identify common patterns in consumer behaviour"] },
    ],
    grammar: "By + 动名词说明方法；主句 present perfect 强调该方法截至目前产生的成果。",
    usage: "方法必须能够合理支持后项结果；若只是同时观察到两个变量，避免夸大为因果发现。",
    simplified: "Comparing markings from different regions helped historians understand the code.",
    usePrompt: "通过比较不同地区收集的数据，研究人员已经能够识别消费者行为中的共同模式。",
    hints: [{ zh: "不同地区", en: "different regions" }, { zh: "共同模式", en: "common patterns" }, { zh: "消费者行为", en: "consumer behaviour" }],
    transfer: "By comparing data collected in different regions, researchers have been able to identify common patterns in consumer behaviour.",
    difficulty: 4, transferValue: 5, scores: [5, 5, 3, 5, 5], priority: "core",
    reasons: ["用方法状语自然引出研究结果，适合数据、教育、环境和公共政策论证。"],
  },
  {
    key: "l38-not-simply-form-of", lesson: 38, paragraph: 1, sentence: 8,
    translation: "人们早已知道，墙上的狩猎场景并不只是一种艺术表达。",
    questionTypes: ["opinion", "discussion"], functions: ["counterargument", "qualify_claim"], focus: "structure",
    chunks: [], glosses: [],
    pattern: "It has long been {evidence_verb} that {phenomenon} is not simply {narrow_explanation}.",
    slots: [
      { name: "evidence_verb", role_zh: "表示长期认识的被动动词", original_value: "known", replacement_examples: ["recognised"] },
      { name: "phenomenon", role_zh: "需要重新理解的现象", original_value: "the hunting scenes depicted on walls", replacement_examples: ["academic success"] },
      { name: "narrow_explanation", role_zh: "被否定的单一解释", original_value: "a form of artistic expression", replacement_examples: ["a product of intelligence"] },
    ],
    grammar: "It has long been recognised that... 是正式的客观陈述；not simply 限定单一解释，并暗示还存在其他因素。",
    usage: "只能用于确有长期证据或广泛共识的判断；后文应说明除该因素外还有什么。",
    simplified: "The wall paintings were more than artistic decoration.",
    usePrompt: "人们早已认识到，学业成功并不只是智力的产物。",
    hints: [{ zh: "学业成功", en: "academic success" }, { zh: "智力的产物", en: "a product of intelligence" }],
    transfer: "It has long been recognised that academic success is not simply a product of intelligence.",
    difficulty: 4, transferValue: 5, scores: [5, 5, 3, 5, 5], priority: "core",
    reasons: ["以长期共识反驳单因解释，适合作为复杂论证的起点。"],
  },
];

const compactSentenceSpecs = [
  {
    key: "l41-praise-but-not-adopt", lesson: 41, paragraph: 0, sentence: 3,
    translation: "尽管他们赞美宁静生活的种种好处，真正搬到乡下住过的人却只有一个，而且不到六个月便回了城。",
    pattern: "Though {group} extol {claimed_benefits}, only {limited_adoption}.",
    slots: [
      ["group", "公开赞成某种做法的群体", "they", "many employers"],
      ["claimed_benefits", "被公开赞美的好处", "the virtues of the peaceful life", "the benefits of flexible working"],
      ["limited_adoption", "与赞美形成反差的有限实践", "one of them has ever gone to live in the country and he was back in town within six months", "a minority allow employees to choose where they work"],
    ],
    usePrompt: "尽管许多雇主赞美弹性工作的好处，真正允许员工选择工作地点的却只是少数。",
    hints: [{ zh: "雇主", en: "employers" }, { zh: "弹性工作", en: "flexible working" }, { zh: "少数", en: "a minority" }],
    transfer: "Though many employers extol the benefits of flexible working, only a minority allow employees to choose where they work.",
    simplified: "Many people praise country life, but very few actually choose it.",
    usage: "适合揭示公开态度与实际行为之间的落差；only 后的数量必须有合理依据。",
  },
  {
    key: "l41-only-part-picture", lesson: 41, paragraph: 1, sentence: 3,
    translation: "这种田园诗般的乡村景象只是完整情况的一部分。",
    pattern: "{positive_indicator} is only part of the picture.",
    slots: [["positive_indicator", "容易被单独强调的局部现象", "This idyllic pastoral scene", "A fall in the headline unemployment rate"]],
    usePrompt: "总体失业率下降只是完整情况的一部分，因为许多劳动者仍处于就业不足状态。",
    hints: [{ zh: "总体失业率", en: "the headline unemployment rate" }, { zh: "就业不足", en: "underemployed" }],
    transfer: "A fall in the headline unemployment rate is only part of the picture, as many workers remain underemployed.",
    simplified: "The attractive rural scene does not show the whole reality.",
    usage: "用于补充被单一指标遮蔽的信息；后文必须明确说明其余部分。",
  },
  {
    key: "l44-by-comparison-offer", lesson: 44, paragraph: 2, sentence: 0,
    translation: "相比之下，渡轮旅行和游轮提供了多种文明而舒适的享受。",
    pattern: "By comparison, {alternative} offer {comparative_advantage}.",
    slots: [["alternative", "与前文对象比较的替代方案", "ferry trips or cruises", "online courses"], ["comparative_advantage", "该方案的相对优势", "a great variety of civilized comforts", "a wider range of specialist subjects"]],
    usePrompt: "相比之下，在线课程提供了更广泛的专业科目选择。",
    hints: [{ zh: "在线课程", en: "online courses" }, { zh: "专业科目", en: "specialist subjects" }],
    transfer: "By comparison, online courses offer a wider range of specialist subjects.",
    simplified: "Ferries and cruises are more comfortable by comparison.",
    usage: "前文必须已经出现明确的比较对象；不能把 By comparison 当作普通的 moreover。",
  },
  {
    key: "l44-reputation-and-even", lesson: 44, paragraph: 3, sentence: 0,
    translation: "飞机素有危险的名声，甚至经验丰富的旅行者也会对它感到畏惧。",
    pattern: "{subject} have a reputation for {negative_quality}, and even {experienced_group} are {reaction}.",
    slots: [["subject", "被评价的事物", "Aeroplanes", "nuclear power stations"], ["negative_quality", "公众印象中的负面特征", "being dangerous", "posing serious risks"], ["experienced_group", "按理更能接受风险的人群", "hardened travellers", "people familiar with the technology"], ["reaction", "该人群的反应", "intimidated by them", "concerned about their safety"]],
    usePrompt: "核电站素有风险很高的名声，甚至熟悉这项技术的人也可能担心其安全性。",
    hints: [{ zh: "核电站", en: "nuclear power stations" }, { zh: "熟悉这项技术", en: "familiar with the technology" }],
    transfer: "Nuclear power stations have a reputation for posing serious risks, and even people familiar with the technology may be concerned about their safety.",
    simplified: "Many people, including experienced travellers, believe that flying is dangerous.",
    usage: "reputation 表示普遍印象，不自动证明该评价客观正确。",
  },
  {
    key: "l45-freedom-restricted", lesson: 45, paragraph: 0, sentence: 0,
    translation: "在民主国家，任何限制新闻自由的行为都会受到合理谴责。",
    pattern: "In {political_context}, efforts to restrict {protected_freedom} are rightly condemned.",
    slots: [["political_context", "规则成立的制度背景", "democratic countries", "democratic societies"], ["protected_freedom", "受到保护的公共表达", "the freedom of the press", "legitimate public criticism"]],
    usePrompt: "在民主社会，压制合法公共批评的行为理应受到谴责。",
    hints: [{ zh: "压制", en: "suppress" }, { zh: "合法公共批评", en: "legitimate public criticism" }],
    transfer: "In democratic societies, efforts to suppress legitimate public criticism are rightly condemned.",
    simplified: "Democratic societies should condemn restrictions on press freedom.",
    usage: "rightly condemned 带有明确立场，只用于能够被充分辩护的规范性判断。",
  },
  {
    key: "l45-enjoy-but-doubt", lesson: 45, paragraph: 0, sentence: 3,
    translation: "尽管我们可能喜欢阅读别人的生活，但我们是否同样喜欢别人阅读自己的生活却非常可疑。",
    pattern: "Though {accepted_benefit}, it is doubtful whether {unacceptable_cost}.",
    slots: [["accepted_benefit", "人们乐于接受的便利或好处", "we may enjoy reading about the lives of others", "consumers may enjoy personalised online services"], ["unacceptable_cost", "他们未必愿意承受的代价", "we would equally enjoy reading about ourselves", "they would accept the extensive data collection required to provide them"]],
    usePrompt: "尽管消费者可能喜欢个性化网络服务，但他们是否愿意接受提供这些服务所需的大规模数据收集却很难确定。",
    hints: [{ zh: "个性化网络服务", en: "personalised online services" }, { zh: "大规模数据收集", en: "extensive data collection" }],
    transfer: "Though consumers may enjoy personalised online services, it is doubtful whether they would accept the extensive data collection required to provide them.",
    simplified: "People enjoy reading about others but may dislike publicity about themselves.",
    usage: "适合权衡便利与隐私、成本或风险；whether 从句应表达真正不确定的接受程度。",
  },
  {
    key: "l45-such-influence-not-only", lesson: 45, paragraph: 0, sentence: 5,
    translation: "报纸影响力极大，不仅能显著改变普通人的生活，甚至能够推翻一个政府。",
    pattern: "{actor} exert such influence that they can not only {ordinary_effect} but can even {extreme_effect}.",
    slots: [["actor", "具有广泛影响力的主体", "Newspapers", "social media platforms"], ["ordinary_effect", "常见层面的影响", "bring about major changes to the lives of ordinary people", "shape consumer behaviour"], ["extreme_effect", "更大尺度的影响", "overthrow a government", "alter the course of an election"]],
    usePrompt: "社交媒体平台能够塑造消费者行为，甚至可能改变选举进程。",
    hints: [{ zh: "塑造消费者行为", en: "shape consumer behaviour" }, { zh: "改变选举进程", en: "alter the course of an election" }],
    transfer: "Social media platforms can shape consumer behaviour and may even alter the course of an election.",
    simplified: "Newspapers can influence both individuals and governments.",
    usage: "such...that 表示影响强到足以产生后果；even 后的强结果必须有证据支持。",
  },
  {
    key: "l47-need-leads-pollution", lesson: 47, paragraph: 0, sentence: 4,
    translation: "不断生产越来越多廉价食品的需求会导致另一种污染。",
    pattern: "The need to {economic_pressure} leads to {unintended_result}.",
    slots: [["economic_pressure", "市场或社会要求持续增加的活动", "produce ever increasing quantities of cheap food", "deliver goods ever more quickly"], ["unintended_result", "由此产生的非预期结果", "a different kind of pollution", "greater packaging waste"]],
    usePrompt: "不断加快商品配送速度的需求会导致更多包装浪费。",
    hints: [{ zh: "商品配送", en: "deliver goods" }, { zh: "包装浪费", en: "packaging waste" }],
    transfer: "The need to deliver goods ever more quickly leads to greater packaging waste.",
    simplified: "Producing more cheap food creates another form of pollution.",
    usage: "适合解释系统压力造成的副作用；前项必须能合理导致后项。",
  },
  {
    key: "l47-price-we-pay", lesson: 47, paragraph: 0, sentence: 0,
    translation: "污染是我们为人口过多、工业过度发展的地球付出的代价。",
    pattern: "{harm} is the price {group} pay for {benefit_or_system}.",
    slots: [["harm", "发展带来的负面代价", "Pollution", "Loss of privacy"], ["group", "承担代价的群体", "we", "consumers"], ["benefit_or_system", "带来便利但同时造成代价的体系", "an overpopulated, overindustrialized planet", "free digital services"]],
    usePrompt: "隐私的丧失可能是消费者为免费数字服务付出的代价。",
    hints: [{ zh: "隐私的丧失", en: "loss of privacy" }, { zh: "免费数字服务", en: "free digital services" }],
    transfer: "Loss of privacy may be the price consumers pay for free digital services.",
    simplified: "Industrial development and population growth create pollution.",
    usage: "属于带评价色彩的权衡表达；不要把并非必然的代价写成无法避免。",
  },
  {
    key: "l51-functions-taken-over", lesson: 51, paragraph: 0, sentence: 5,
    translation: "尽管这些大型机器仍然存在，它们的许多功能已经被小型而强大的个人电脑取代。",
    pattern: "Though {older_system} still exist, many of their functions have been taken over by {newer_system}.",
    slots: [["older_system", "仍然存在的旧系统", "these large machines", "traditional bank branches"], ["newer_system", "承接其功能的新系统", "small powerful personal computers", "mobile banking services"]],
    usePrompt: "尽管传统银行网点仍然存在，它们的许多功能已经由移动银行服务承担。",
    hints: [{ zh: "传统银行网点", en: "traditional bank branches" }, { zh: "移动银行服务", en: "mobile banking services" }],
    transfer: "Though traditional bank branches still exist, many of their functions have been taken over by mobile banking services.",
    simplified: "Small computers now perform many tasks once done by mainframes.",
    usage: "take over functions 表示功能转移，不等于旧系统已经完全消失。",
  },
  {
    key: "l51-considering-how-recent", lesson: 51, paragraph: 1, sentence: 0,
    translation: "考虑到这些发展出现得如此之晚，早在20世纪60年代就有人预测出今天的一些计算机用途，显得更加非凡。",
    pattern: "Considering how {recent_or_limited}, it is even more remarkable that {unexpected_achievement}.",
    slots: [["recent_or_limited", "使后项更出人意料的限制条件", "recent these developments are", "limited the available data were"], ["unexpected_achievement", "在限制下实现的成果", "Leon Bagrit was able to predict some of today's uses of computers", "researchers identified the main source of the outbreak"]],
    usePrompt: "考虑到当时可用的数据如此有限，研究人员能够找出疫情的主要来源就更加难得。",
    hints: [{ zh: "可用的数据", en: "the available data" }, { zh: "疫情的主要来源", en: "the main source of the outbreak" }],
    transfer: "Considering how limited the available data were, it is even more remarkable that researchers identified the main source of the outbreak.",
    simplified: "Bagrit's early predictions were remarkable because computers were still new.",
    usage: "Considering 引出的事实必须确实增加后项成果的难度或意外程度。",
  },
  {
    key: "l51-foresaw-a-time", lesson: 51, paragraph: 1, sentence: 2,
    translation: "巴格里特预见到这样一个时代：计算机会小到可以手持，并能够提供交通信息、帮助诊断疾病和减轻重复性文书工作。",
    pattern: "{thinker} foresaw a time when {parallel_predictions}.",
    slots: [["thinker", "提出长期预测的人或机构", "Bagrit", "early environmental scientists"], ["parallel_predictions", "若干并列的未来变化", "computers would become small and perform several practical functions", "renewable energy would become cheaper and more widely available"]],
    usePrompt: "早期环境科学家曾预见，可再生能源会变得更便宜、更容易获得，并最终取代部分化石燃料。",
    hints: [{ zh: "早期环境科学家", en: "early environmental scientists" }, { zh: "更容易获得", en: "more widely available" }, { zh: "化石燃料", en: "fossil fuels" }],
    transfer: "Early environmental scientists foresaw a time when renewable energy would become cheaper and more widely available, eventually replacing some fossil fuels.",
    simplified: "Bagrit predicted that small computers would perform many practical tasks.",
    usage: "foresaw a time when 适合有依据的历史预测；并列变化应围绕同一未来趋势。",
  },
  {
    key: "l53-worked-so-well", lesson: 53, paragraph: 0, sentence: 2,
    translation: "这套制度运行得非常成功，因此也被其他国家采用。",
    pattern: "{system} has worked so well that it has been adopted by {other_users}.",
    slots: [["system", "已经证明有效的制度或做法", "The system", "The deposit-return scheme"], ["other_users", "采用该制度的其他主体", "other countries", "several neighbouring cities"]],
    usePrompt: "这项押金退还制度运行得非常成功，因此已被几个邻近城市采用。",
    hints: [{ zh: "押金退还制度", en: "deposit-return scheme" }, { zh: "邻近城市", en: "neighbouring cities" }],
    transfer: "The deposit-return scheme has worked so well that it has been adopted by several neighbouring cities.",
    simplified: "Other countries adopted the successful Swedish system.",
    usage: "so...that 必须以实际成效解释后续推广，不能只凭宣传声称成功。",
  },
  {
    key: "l53-open-public-inspection", lesson: 53, paragraph: 0, sentence: 13,
    translation: "监察专员的工作毫不隐秘，因为他的往来文件对公众开放查阅。",
    pattern: "There is nothing secretive about {institution}, for {records} are open to public inspection.",
    slots: [["institution", "需要证明透明的机构或流程", "the Ombudsman's work", "the funding process"], ["records", "可供公众检查的材料", "his correspondence", "all major spending decisions"]],
    usePrompt: "这一资助过程并不隐秘，因为所有重大支出决定都向公众开放查阅。",
    hints: [{ zh: "资助过程", en: "funding process" }, { zh: "重大支出决定", en: "major spending decisions" }, { zh: "开放查阅", en: "open to public inspection" }],
    transfer: "There is nothing secretive about the funding process, as all major spending decisions are open to public inspection.",
    simplified: "The Ombudsman's correspondence can be inspected by the public.",
    usage: "只有存在真实、可执行的公开查阅机制时才能使用；现代英语中 as 通常比原句的 for 更自然。",
  },
  {
    key: "l53-impossible-until-second", lesson: 53, paragraph: 1, sentence: 3,
    translation: "监察专员原本无法采取行动，但收到同村另一名外国人的类似投诉后，立即派律师调查。",
    pattern: "It was impossible for {authority} to {action}, but when {additional_evidence}, {authority} immediately {response}.",
    slots: [["authority", "需要证据才能行动的机构", "the Ombudsman", "the regulator"], ["action", "证据不足时无法采取的行动", "take action", "open a formal investigation"], ["additional_evidence", "改变证据状态的新信息", "he received a similar complaint", "a second independent report emerged"], ["response", "新证据出现后的行动", "sent a lawyer to investigate", "requested the company's internal records"]],
    usePrompt: "监管机构原本无法展开正式调查，但第二份独立报告出现后，它立即要求公司提交内部记录。",
    hints: [{ zh: "监管机构", en: "the regulator" }, { zh: "正式调查", en: "a formal investigation" }, { zh: "内部记录", en: "internal records" }],
    transfer: "It was impossible for the regulator to open a formal investigation, but when a second independent report emerged, it immediately requested the company's internal records.",
    simplified: "A second complaint gave the Ombudsman enough reason to investigate.",
    usage: "适合展示新证据如何改变行动门槛；前后因果链必须清楚。",
  },
  {
    key: "l55-hard-enough-more-difficult", lesson: 55, paragraph: 0, sentence: 2,
    translation: "发现行星已经足够困难，而在行星上发现生命将困难得多。",
    pattern: "{first_task} is hard enough, but {more_demanding_task} is infinitely more difficult.",
    slots: [["first_task", "已经具有难度的第一层任务", "Finding planets", "Collecting reliable data"], ["more_demanding_task", "在其基础上更困难的任务", "finding life on them", "establishing a causal relationship"]],
    usePrompt: "收集可靠数据已经足够困难，而建立因果关系则困难得多。",
    hints: [{ zh: "可靠数据", en: "reliable data" }, { zh: "建立因果关系", en: "establish a causal relationship" }],
    transfer: "Collecting reliable data is hard enough, but establishing a causal relationship is considerably more difficult.",
    simplified: "Finding life is much harder than finding planets.",
    usage: "现代正式写作中 considerably more difficult 往往比 infinitely 更克制；两项任务应具有递进关系。",
  },
  {
    key: "l55-once-so-that", lesson: 55, paragraph: 2, sentence: 6,
    translation: "一旦发现行星，我们还必须设法遮住其恒星的光，以便看清行星并分析其大气。",
    pattern: "Once {first_stage}, {actor} must {second_stage}, so that {purpose}.",
    slots: [["first_stage", "完成的第一阶段", "we detected a planet", "a new medicine has passed initial safety tests"], ["actor", "继续执行下一阶段的主体", "we", "researchers"], ["second_stage", "随后必须完成的行动", "find a way of blotting out the light from its star", "conduct larger clinical trials"], ["purpose", "下一行动服务的目的", "we can analyse its atmosphere", "they can identify less common side effects"]],
    usePrompt: "一种新药通过初步安全测试后，研究人员必须开展更大规模的临床试验，以便发现较少见的副作用。",
    hints: [{ zh: "初步安全测试", en: "initial safety tests" }, { zh: "临床试验", en: "clinical trials" }, { zh: "副作用", en: "side effects" }],
    transfer: "Once a new medicine has passed initial safety tests, researchers must conduct larger clinical trials so that they can identify less common side effects.",
    simplified: "After finding a planet, scientists must block its star's light to study it.",
    usage: "用于按顺序说明方法；so that 后必须是真正由第二阶段实现的目的。",
  },
  {
    key: "l55-discovery-change-view", lesson: 55, paragraph: 3, sentence: 6,
    translation: "如果能在另一颗行星上发现细菌这样的低等生命，它将彻底改变我们对自身的认识。",
    pattern: "If {major_discovery}, it would completely change {current_understanding}.",
    slots: [["major_discovery", "足以改变认识的重大发现", "we discovered lowly forms of life on another planet", "researchers found a reliable cure for dementia"], ["current_understanding", "会被改变的现有认识或实践", "our view of ourselves", "how ageing is understood and treated"]],
    usePrompt: "如果研究人员找到一种可靠的失智症疗法，它将彻底改变人们理解和治疗衰老的方式。",
    hints: [{ zh: "可靠的疗法", en: "a reliable cure" }, { zh: "失智症", en: "dementia" }, { zh: "衰老", en: "ageing" }],
    transfer: "If researchers found a reliable cure for dementia, it would completely change how ageing is understood and treated.",
    simplified: "Finding life elsewhere would transform humanity's view of itself.",
    usage: "completely change 是强断言，只用于真正具有范式转变潜力的发现。",
  },
  {
    key: "l59-value-beyond-worth", lesson: 59, paragraph: 0, sentence: 5,
    translation: "长期拥有的物品充满与过去的联系，因此会逐渐获得超越实际价值的意义。",
    pattern: "{objects} are full of associations with {past}, and so they gradually acquire a value beyond {market_worth}.",
    slots: [["objects", "因经历而产生额外意义的事物", "Things owned for a long time", "Historic public buildings"], ["past", "与其关联的历史或记忆", "the past", "a community's shared past"], ["market_worth", "无法涵盖全部意义的经济价值", "their true worth", "their market price"]],
    usePrompt: "历史公共建筑与社区共同的过去紧密相连，因此可能获得超越市场价格的价值。",
    hints: [{ zh: "历史公共建筑", en: "historic public buildings" }, { zh: "社区共同的过去", en: "a community's shared past" }, { zh: "市场价格", en: "market price" }],
    transfer: "Historic public buildings are closely associated with a community's shared past and may therefore acquire value beyond their market price.",
    simplified: "Old possessions gain sentimental value through their links with the past.",
    usage: "适合区分文化、情感价值与市场价格；不要把 beyond 误解为可以完全忽略经济成本。",
  },
  {
    key: "l59-whatever-consists", lesson: 59, paragraph: 2, sentence: 3,
    translation: "无论收藏由什么构成，总有相关的事情可做，从安放新藏品到查阅资料核实事实。",
    pattern: "Whatever {activity} consists of, there is always {range}, from {simple_task} to {advanced_task}.",
    slots: [["activity", "内容可能多样的活动", "the collection", "a community project"], ["range", "围绕该活动可开展的工作", "something to do in connection with it", "a wide range of work"], ["simple_task", "范围的一端", "finding the right place for the latest addition", "recruiting volunteers"], ["advanced_task", "范围的另一端", "verifying facts in reference books", "evaluating its long-term impact"]],
    usePrompt: "无论社区项目采取何种形式，都涉及大量工作，从招募志愿者到评估其长期影响。",
    hints: [{ zh: "社区项目", en: "a community project" }, { zh: "招募志愿者", en: "recruit volunteers" }, { zh: "长期影响", en: "long-term impact" }],
    transfer: "Whatever form a community project takes, it involves a wide range of work, from recruiting volunteers to evaluating its long-term impact.",
    simplified: "Every collection creates tasks ranging from organisation to research.",
    usage: "from...to... 的两端应属于同一工作范围，并呈现清晰跨度。",
  },
  {
    key: "l59-not-only-but-also", lesson: 59, paragraph: 2, sentence: 4,
    translation: "这种爱好不仅使人在所选领域增长知识，也使人了解与之相关的一般问题。",
    pattern: "{activity} educates people not only in {specialist_field}, but also in {related_knowledge}.",
    slots: [["activity", "具有学习价值的活动", "This hobby", "Community gardening"], ["specialist_field", "直接学习的专门领域", "the chosen subject", "plant care"], ["related_knowledge", "由此延伸的相关知识", "general matters which have some bearing on it", "nutrition and local ecology"]],
    usePrompt: "社区园艺不仅让参与者学习植物养护，也让他们了解营养和当地生态。",
    hints: [{ zh: "社区园艺", en: "community gardening" }, { zh: "植物养护", en: "plant care" }, { zh: "当地生态", en: "local ecology" }],
    transfer: "Community gardening helps participants learn not only about plant care but also about nutrition and local ecology.",
    simplified: "Collecting teaches both specialist and general knowledge.",
    usage: "not only 与 but also 后保持平行；两个学习结果应彼此相关但不重复。",
  },
  {
    key: "l59-confidence-first-then", lesson: 59, paragraph: 2, sentence: 10,
    translation: "自信由此增长：先来自掌握一个领域，再来自能够谈论这个领域。",
    pattern: "In this way, {outcome} grows, first from {foundation}, then from {application}.",
    slots: [["outcome", "逐步形成的能力或结果", "self-confidence", "professional confidence"], ["foundation", "第一阶段的知识基础", "mastering a subject", "acquiring technical knowledge"], ["application", "第二阶段的实际运用", "being able to talk about it", "applying it in real projects"]],
    usePrompt: "职业自信会以这种方式增长：先来自获得技术知识，再来自把知识应用到真实项目中。",
    hints: [{ zh: "职业自信", en: "professional confidence" }, { zh: "技术知识", en: "technical knowledge" }, { zh: "真实项目", en: "real projects" }],
    transfer: "In this way, professional confidence grows, first from acquiring technical knowledge and then from applying it in real projects.",
    simplified: "Collectors gain confidence by mastering and discussing their subject.",
    usage: "first...then... 应呈现真实的阶段递进；现代句中加入 and 通常更流畅。",
  },
];

for (const spec of compactSentenceSpecs) {
  sentenceSpecs.push({
    ...spec,
    questionTypes: ["opinion", "discussion", "two_part_multi_part"],
    functions: spec.functions ?? ["explain_mechanism", "compare_or_weigh"],
    focus: spec.focus ?? "structure",
    chunks: spec.chunks ?? [],
    glosses: spec.glosses ?? [],
    slots: spec.slots.map(([name, role_zh, original_value, replacement]) => ({ name, role_zh, original_value, replacement_examples: [replacement] })),
    grammar: spec.grammar ?? "保留原句的信息组织关系，仿写时根据现代正式英语调整连接词、时态和搭配。",
    difficulty: spec.difficulty ?? 4,
    transferValue: spec.transferValue ?? 5,
    scores: spec.scores ?? [5, 5, 3, 5, 5],
    priority: spec.priority ?? "core",
    reasons: spec.reasons ?? ["完整句的信息组织方式清晰，可迁移到 IELTS Task 2 的正式论证。"],
  });
}

function makeSentenceCandidate(spec) {
  const { source, sentence, sentences } = locatedSentence(spec.lesson, spec.paragraph, spec.sentence);
  const cardId = uuidFrom(`card:${promptVersion}:${spec.key}`);
  const chunkCloze = spec.chunks.length ? spec.chunks.map((chunk) => ({
    chunk_text: chunk.text,
    prompt_sentence: sentence.replace(chunk.text, "_____"),
    reference_answer: chunk.text,
  })) : null;
  const feedbackPattern = spec.slots.reduce((pattern, item) => {
    const value = item.replacement_examples[0];
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const next = pattern.replace(new RegExp(escaped, "i"), `{${item.name}}`);
    if (next === pattern) throw new Error(`${spec.key}: replacement '${value}' not found in transfer example.`);
    return next;
  }, spec.transfer);
  const slotReplacement = [{
    prompt_zh: spec.usePrompt,
    hints: spec.hints,
    feedback_pattern: feedbackPattern,
    slot_values: spec.slots.map((item) => ({ slot_name: item.name, value: item.replacement_examples[0] })),
    reference_answer: spec.transfer,
  }];
  const card = {
    schema_version: "1.2.0",
    id: cardId,
    source_essay_id: source.id,
    original_sentence: sentence,
    learning_sentence: sentence,
    learning_edits: [],
    translation_zh: spec.translation,
    context_before: sentences[spec.sentence - 1] ?? "",
    context_after: sentences[spec.sentence + 1] ?? "",
    paragraph_index: spec.paragraph,
    sentence_index: spec.sentence,
    task: "academic_task_2",
    question_types: spec.questionTypes,
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
      translation_recall: { prompt_zh: spec.translation, reference_answer: sentence },
      slot_replacement: slotReplacement,
    },
    difficulty: spec.difficulty,
    transfer_value: spec.transferValue,
    source_reliability: "published_language_source",
    content_status: "candidate",
    content_revision: 1,
    normalized_text_hash: sha256(normalizeSentence(sentence)),
    created_at: createdAt,
    updated_at: createdAt,
  };
  return {
    schema_version: "1.0.0",
    candidate_id: uuidFrom(`candidate:${promptVersion}:${spec.key}`),
    card,
    source_match: { match_type: "exact", matched_text: sentence, paragraph_index: spec.paragraph, sentence_index: spec.sentence },
    selection_scores: {
      naturalness: spec.scores[0], context_independence: spec.scores[1], vocabulary_value: spec.scores[2],
      structure_value: spec.scores[3], transfer_value: spec.scores[4],
    },
    recommendation_reasons: spec.reasons,
    uncertainties: ["来源是语言丰富度教材课文，不是 IELTS model essay；需人工确认迁移到 Task 2 书面语后的适用范围。"],
    workflow_status: "candidate",
    priority: spec.priority,
    provenance: { guideline_version: "1.0.0", prompt_version: promptVersion, processor_type: "codex", model_id: null },
    review_history: [{ action: "created", reviewer: "Codex", reason: "从用户提供的教材扫描逐段提取，完成原句定位与首轮查重，等待人工审核。", reviewed_at: createdAt }],
    created_at: createdAt,
    updated_at: createdAt,
  };
}

const slot = (name, role_zh, ...replacement_examples) => ({ name, role_zh, replacement_examples });
const collocationSpecs = [
  { key: "l18-take-no-interest", lesson: 18, p: 0, s: 2, surface: "take no interest in", canonical: "take no interest in", zh: "对……毫无兴趣", pattern: "take no interest in {topic}", slots: [slot("topic", "不感兴趣的主题", "politics", "environmental issues", "celebrity news")], type: "fixed_phrase", usage: "后接名词或动名词；比 be not interested in 更主动地表达完全不关注。", scores: [5, 4, 4, 4], difficulty: 3, note: "与库内 take pleasure in 共享 take + 名词 + in 形式，但意义相反，不合并。" },
  { key: "l18-cannot-have-failed", lesson: 18, p: 0, s: 2, surface: "cannot have failed to notice", canonical: "cannot have failed to notice", zh: "不可能没有注意到", pattern: "cannot have failed to notice {evidence}", slots: [slot("evidence", "明显到无法忽略的证据", "the rise in living costs", "the spread of digital services", "the decline in air quality")], type: "sentence_frame", grammar: "cannot + have failed to + 动词原形", usage: "强烈断言对方过去必然注意到，只用于十分明显的证据。", scores: [5, 5, 5, 5], difficulty: 5, priority: "core" },
  { key: "l18-get-quite-used", lesson: 18, p: 0, s: 4, surface: "have got quite used to", canonical: "get quite used to", zh: "逐渐相当习惯于……", pattern: "get quite used to {situation}", slots: [slot("situation", "逐渐习惯的事物或状态", "working remotely", "crowded public transport", "rapid technological change")], accepted: ["have got quite used to"], grammar: "get used to + 名词或动名词", usage: "to 是介词；后接动词时使用 -ing。", scores: [5, 4, 4, 3], difficulty: 3 },
  { key: "l18-in-response-to", lesson: 18, p: 1, s: 4, surface: "in response to a gust of wind", canonical: "in response to", zh: "作为对……的反应", pattern: "in response to {trigger}", slots: [slot("trigger", "引发反应的事件或变化", "public concern", "rising demand", "new scientific evidence")], usage: "表示行为或变化由前项触发，不自动等同于严格因果。", scores: [5, 4, 5, 5], difficulty: 3, priority: "core" },
  { key: "l18-lined-up-against", lesson: 18, p: 1, s: 6, surface: "Lined up against the wall", canonical: "be lined up against", zh: "沿着／靠着……排成一列", pattern: "be lined up against {surface}", slots: [slot("surface", "排列所依靠的边界", "the wall", "the fence", "the edge of the road")], accepted: ["lined up against"], grammar: "be lined up against + 名词", usage: "偏描写性，主要用于空间布置，不作为通用论证词组。", scores: [5, 3, 3, 2], difficulty: 3, priority: "supporting" },

  { key: "l27-live-by-doing", lesson: 27, p: 0, s: 0, surface: "lives by selling something", canonical: "live by doing something", zh: "靠做某事谋生", pattern: "live by {activity}", slots: [slot("activity", "赖以谋生的活动", "selling handmade goods", "teaching online", "providing specialist advice")], accepted: ["lives by selling something"], type: "sentence_frame", grammar: "live by + 动名词", usage: "这里表示谋生方式，不是“遵循某种原则生活”的另一个 live by 用法。", scores: [5, 5, 4, 4], difficulty: 3, priority: "core" },
  { key: "l27-in-the-light-of", lesson: 27, p: 0, s: 1, surface: "In the light of this statement", canonical: "in the light of", zh: "根据／考虑到……", pattern: "in the light of {information}", slots: [slot("information", "促使重新判断的信息", "recent evidence", "these findings", "changing social conditions")], accepted: ["in light of"], type: "fixed_phrase", usage: "正式书面连接语；现代英语中 in light of 也很常见。", scores: [5, 4, 5, 5], difficulty: 3, priority: "core" },
  { key: "l27-measure-value-in-terms", lesson: 27, p: 0, s: 2, surface: "measure the value of material goods in terms of money", canonical: "measure the value of something in terms of something", zh: "用某种尺度衡量某物的价值", pattern: "measure the value of {object} in terms of {metric}", slots: [slot("object", "被衡量的对象", "education", "public transport", "scientific research"), slot("metric", "衡量所采用的尺度", "exam results", "financial returns", "short-term output")], type: "sentence_frame", usage: "in terms of 在这里引出衡量尺度，不只是泛泛的“从……方面看”。", scores: [5, 5, 5, 5], difficulty: 5, priority: "core", note: "与现有 measure the effectiveness of 和 In terms of... 卡共享词形，但学习目标是“以某尺度衡量价值”，不合并。" },
  { key: "l27-estimate-true-value", lesson: 27, p: 0, s: 2, surface: "estimate the true value of", canonical: "estimate the true value of", zh: "估计……的真正价值", pattern: "estimate the true value of {object}", slots: [slot("object", "难以准确估值的对象", "unpaid care work", "public libraries", "community volunteering")], usage: "适合无法只用价格体现的价值；若已有可靠数据，estimate 不如 calculate 精确。", scores: [5, 4, 4, 5], difficulty: 4 },
  { key: "l27-grudge-paying-fee", lesson: 27, p: 0, s: 3, surface: "grudge paying a surgeon a high fee for offering us precisely this service", canonical: "grudge paying someone a high fee for something", zh: "不情愿为某项服务向某人支付高额费用", pattern: "grudge paying {person} a high fee for {service}", slots: [slot("person", "收取费用的人或机构", "a specialist", "a private company", "a consultant"), slot("service", "被认为收费过高的服务", "urgent treatment", "basic utilities", "professional advice")], type: "sentence_frame", grammar: "grudge + 动名词；pay someone a fee for something", usage: "grudge 带有“虽然可能应付，但心里不情愿”的态度。", scores: [5, 5, 4, 4], difficulty: 5, priority: "core" },
  { key: "l27-only-exception", lesson: 27, p: 1, s: 0, surface: "the only exception to this general rule", canonical: "the only exception to this general rule", zh: "这一普遍规则的唯一例外", pattern: "the only exception to {rule}", slots: [slot("rule", "通常成立的规则或趋势", "this general rule", "the wider trend", "the standard requirement")], grammar: "exception to，而不是 exception of", usage: "只有前文已经建立清晰的一般规律时，才能使用 this general rule。", scores: [5, 4, 5, 5], difficulty: 3, priority: "core" },
  { key: "l27-arouse-pity", lesson: 27, p: 1, s: 1, surface: "arouse the pity of passers-by", canonical: "arouse the pity of", zh: "引起……的怜悯", pattern: "arouse the pity of {group}", slots: [slot("group", "产生怜悯的人群", "the public", "passers-by", "potential donors")], grammar: "arouse + emotion；the pity of + 人群", usage: "语气比 make people feel sorry 更正式，也可能暗示刻意唤起同情。", scores: [5, 4, 4, 3], difficulty: 4 },
  { key: "l27-sacrifice-dignity", lesson: 27, p: 1, s: 4, surface: "sacrifice their human dignity", canonical: "sacrifice human dignity", zh: "牺牲人的尊严", pattern: "sacrifice {value}", slots: [slot("value", "不应轻易放弃的价值", "human dignity", "personal freedom", "long-term wellbeing")], accepted: ["sacrifice their human dignity"], usage: "sacrifice 表示为了另一目标放弃重要价值，后文通常需要说明交换关系。", scores: [5, 4, 4, 5], difficulty: 4, priority: "core" },
  { key: "l27-fully-aware-consequences", lesson: 27, p: 1, s: 6, surface: "is fully aware of the consequences", canonical: "be fully aware of the consequences", zh: "充分意识到后果", pattern: "be fully aware of {consequence}", slots: [slot("consequence", "已经清楚认识到的后果", "the consequences", "the long-term risks", "the social costs involved")], accepted: ["is fully aware of the consequences"], grammar: "be aware of + 名词", usage: "fully 强调知情程度；不能据此自动推出愿意承担后果。", scores: [5, 4, 5, 5], difficulty: 3, priority: "core", note: "与现有 have negative consequences 共享 consequences，但一个表达认知状态，一个表达造成后果，不合并。" },
  { key: "l27-free-from-anxieties", lesson: 27, p: 1, s: 7, surface: "is free from the thousands of anxieties", canonical: "be free from anxieties", zh: "不受焦虑困扰", pattern: "be free from {burden}", slots: [slot("burden", "摆脱的负担或限制", "anxieties", "financial pressure", "unnecessary restrictions")], accepted: ["is free from the thousands of anxieties"], usage: "free from 强调不受某种负面事物影响；anxiety 作抽象概念时也常用不可数形式。", scores: [5, 4, 4, 4], difficulty: 3 },
  { key: "l27-move-place-ease", lesson: 27, p: 1, s: 8, surface: "move from place to place with ease", canonical: "move from place to place with ease", zh: "轻松地辗转各地", pattern: null, slots: [], type: "fixed_phrase", usage: "偏叙事和描述；with ease 表示过程几乎没有困难。", scores: [5, 3, 3, 2], difficulty: 3, priority: "supporting" },
  { key: "l27-sleep-in-open", lesson: 27, p: 1, s: 9, surface: "sleep in the open", canonical: "sleep in the open", zh: "露天睡觉", pattern: null, slots: [], type: "fixed_phrase", usage: "in the open 在这里指户外、无住所遮蔽，不等于公开地做某事。", scores: [5, 4, 3, 2], difficulty: 3, priority: "supporting" },
  { key: "l27-times-real-need", lesson: 27, p: 1, s: 10, surface: "in times of real need", canonical: "in times of real need", zh: "在真正需要的时候", pattern: null, slots: [], type: "fixed_phrase", usage: "表示困难或紧急时期，不指“需要帮助的人”这一人群。", scores: [5, 4, 4, 4], difficulty: 3, note: "与库内 those in need 共享 need，但一个是时间状语，一个指需要帮助的人，不合并。" },
  { key: "l27-speak-with-contempt", lesson: 27, p: 1, s: 11, surface: "speak of tramps with contempt", canonical: "speak of someone with contempt", zh: "以轻蔑的口吻谈论某人", pattern: "speak of {group} with contempt", slots: [slot("group", "被轻蔑谈论的人或群体", "low-paid workers", "older generations", "people receiving welfare")], type: "sentence_frame", usage: "with contempt 描述带有蔑视的态度，适合批评污名化，不宜无证据揣测他人心理。", scores: [5, 5, 4, 4], difficulty: 4, priority: "core" },
  { key: "l27-same-class-as", lesson: 27, p: 1, s: 11, surface: "put them in the same class as beggars", canonical: "put someone in the same class as", zh: "把某人与……归为一类", pattern: "put {group} in the same class as {comparison}", slots: [slot("group", "被归类的对象", "temporary workers", "online learners", "small businesses"), slot("comparison", "被拿来等同的类别", "unskilled labourers", "traditional students", "large corporations")], type: "sentence_frame", usage: "常用于批评过度归类；需说明两类对象为何不应被简单等同。", scores: [5, 5, 5, 5], difficulty: 4, priority: "core" },
  { key: "l27-freedom-from-care", lesson: 27, p: 1, s: 11, surface: "freedom from care", canonical: "freedom from care", zh: "无忧无虑的状态", pattern: null, slots: [], type: "fixed_phrase", usage: "偏文学化；care 在这里表示忧虑而不是照护，Task 2 中需谨慎使用。", scores: [5, 4, 3, 2], difficulty: 4, priority: "supporting" },
];

const compactCollocationSpecs = [
  ["l29-depend-largely",29,0,0,"largely depends on","depend largely on","很大程度上取决于……","depend largely on {factor}",[["factor","主要决定因素","public trust","access to reliable infrastructure"]],"远程办公能否成功，很大程度上取决于员工能否获得可靠的数字基础设施。","The success of remote working depends largely on whether employees have access to reliable digital infrastructure.","depends largely on"],
  ["l29-bound-up",29,0,1,"bound up with national characteristics","be bound up with","与……密切相关","be closely bound up with {factor}",[["factor","密切关联的因素","perceptions of fairness","local economic conditions"]],"公众对税收的态度与他们对公平的看法密切相关。","Public attitudes towards taxation are closely bound up with perceptions of fairness.","closely bound up with"],
  ["l29-compensate-for",29,1,8,"compensate for his unpleasant experiences","compensate for","弥补／抵消……","compensate for {disadvantage}",[["disadvantage","需要被弥补的缺点或损失","long commuting times","reduced face-to-face contact"]],"弹性排班可以在一定程度上弥补远程办公所减少的面对面交流。","Flexible scheduling can partly compensate for the reduced face-to-face contact associated with remote work.","compensate for"],

  ["l38-rely-solely",38,0,2,"rely solely on the written word","rely solely on","完全依赖……","rely solely on {source}",[["source","不应成为唯一依据的信息来源","exam results","short-term financial data"]],"大学录取不应完全依赖考试成绩。","University admissions should not rely solely on examination results.","rely solely on"],
  ["l38-shed-light",38,0,7,"shed interesting light on","shed light on","帮助解释／阐明……","shed light on {issue}",[["issue","需要进一步理解的问题","the effects of air pollution","changes in consumer behaviour"]],"长期研究可以帮助解释空气污染对儿童健康的影响。","Long-term studies can shed light on the effects of air pollution on children's health.","shed light on"],
  ["l38-come-into-being",38,0,8,"came into being","come into being","形成；出现","come into being during {period}",[["period","制度或现象形成的时期","industrialisation","a period of social reform"]],"许多现代劳动保护制度是在快速工业化时期形成的。","Many modern labour protections came into being during periods of rapid industrialisation.","came into being"],
  ["l38-advent-of",38,0,8,"with the advent of agriculture","with the advent of","随着……的出现","with the advent of {innovation}",[["innovation","带来广泛变化的新技术或制度","affordable internet access","mass production"]],"随着可负担互联网的出现，在线教育开始服务更广泛的人群。","With the advent of affordable internet access, online education became available to a much wider population.","With the advent of"],

  ["l41-extol-virtues",41,0,3,"extol the virtues of the peaceful life","extol the virtues of","极力赞扬……的好处","extol the virtues of {policy}",[["policy","被高度赞扬的做法","remote working","free higher education"]],"企业经常极力赞扬远程办公的好处，却未必给予员工真正的选择。","Companies often extol the virtues of remote working without necessarily giving employees genuine choice.","extol the virtues of"],
  ["l41-live-under-illusion",41,1,0,"lives under the illusion that","live under the illusion that","误以为……","live under the illusion that {false_belief}",[["false_belief","被误当作事实的看法","technology is always neutral","economic growth benefits everyone equally"]],"一些政策制定者误以为经济增长会同等地惠及所有人。","Some policymakers live under the illusion that economic growth benefits everyone equally.","live under the illusion that"],
  ["l41-part-of-picture",41,1,3,"only part of the picture","only part of the picture","只是完整情况的一部分",null,[],"较低的总体失业率只是完整情况的一部分，因为许多劳动者仍然就业不足。","A lower headline unemployment rate is only part of the picture, as many workers remain underemployed.","only part of the picture"],

  ["l44-take-mind-off",44,0,3,"take your mind off the journey","take one's mind off","使某人暂时不去想……","take one's mind off {concern}",[["concern","暂时转移注意力的压力或担忧","work-related stress","financial worries"]],"体育锻炼可以帮助人们暂时摆脱工作压力。","Physical exercise can help people take their minds off work-related stress.","take their minds off"],
  ["l44-more-often-than-not",44,1,1,"more often than not","more often than not","往往；多数情况下",null,[],"如果公共交通班次过少，通勤者往往会选择开车。","When public transport services are infrequent, commuters will more often than not choose to drive.","more often than not"],
  ["l44-reputation-for",44,3,0,"have the reputation of being dangerous","have a reputation for","以……著称／有……名声","have a reputation for {quality}",[["quality","广为人知的特征","high academic standards","poor working conditions"]],"这所大学以严格的学术标准著称。","The university has a reputation for maintaining rigorous academic standards.","has a reputation for"],

  ["l45-restrict-press",45,0,0,"restrict the freedom of the press","restrict the freedom of the press","限制新闻自由",null,[],"政府不应以国家安全为名，不成比例地限制新闻自由。","Governments should not disproportionately restrict the freedom of the press in the name of national security.","restrict the freedom of the press"],
  ["l45-public-attention",45,0,2,"attract far more public attention than","attract public attention","吸引公众关注","attract public attention to {issue}",[["issue","需要公众注意的问题","unsafe working conditions","the loss of urban green space"]],"调查性报道可以使公众关注不安全的工作条件。","Investigative reporting can attract public attention to unsafe working conditions.","attract public attention"],
  ["l45-exert-influence",45,0,5,"exert such tremendous influence","exert considerable influence","产生相当大的影响","exert considerable influence over {group_or_process}",[["group_or_process","受到影响的群体或过程","consumer behaviour","public debate"]],"大型数字平台对公共讨论产生相当大的影响。","Large digital platforms exert considerable influence over public debate.","exert considerable influence"],
  ["l45-price-for-fame",45,2,7,"paying the price for fame","pay the price for","为……付出代价","pay the price for {choice_or_benefit}",[["choice_or_benefit","带来负面后果的选择或好处","rapid expansion","constant online exposure"]],"一些网红会因为不断把私人生活暴露在公众审视之下而付出代价。","Some online personalities pay the price for constantly exposing their private lives to public scrutiny.","pay the price for"],

  ["l47-price-we-pay",47,0,0,"the price we pay for","the price we pay for","我们为……付出的代价","the price we pay for {benefit}",[["benefit","同时带来代价的便利或增长","cheap consumer goods","free digital services"]],"电子垃圾可能是我们为廉价消费电子产品付出的代价。","Electronic waste may be the price we pay for cheap consumer electronics.","the price we pay for"],
  ["l47-ever-increasing",47,0,4,"ever increasing quantities of cheap food","ever-increasing quantities of","数量不断增加的……","ever-increasing quantities of {resource_or_waste}",[["resource_or_waste","持续增多的资源或废弃物","plastic waste","energy"]],"快速配送服务产生了数量不断增加的包装废弃物。","Rapid delivery services generate ever-increasing quantities of packaging waste.","ever-increasing quantities of"],
  ["l47-source-irritation",47,1,2,"a source of profound irritation","a source of considerable irritation","令人十分烦恼的来源","a source of considerable irritation for {group}",[["group","受到持续干扰的人群","local residents","public transport users"]],"深夜建筑施工会成为当地居民非常烦恼的来源。","Late-night construction work can be a source of considerable irritation for local residents.","a source of considerable irritation"],

  ["l51-taken-over",51,0,5,"functions have been taken over by","functions be taken over by","功能由……接替","functions have been taken over by {replacement}",[["replacement","承担旧系统功能的新主体","mobile applications","automated systems"]],"传统银行网点的许多功能已经由移动应用接替。","Many functions of traditional bank branches have been taken over by mobile applications.","functions have been taken over by"],
  ["l51-humble-beginnings",51,0,12,"From those humble beginnings","from humble beginnings","从不起眼的开端发展而来","from humble beginnings, {development}",[["development","后来取得的发展","the company became a global employer","the technology entered widespread use"]],"这项技术从不起眼的开端发展成了全球通信的重要基础。","From humble beginnings, the technology developed into an essential part of global communication.","From humble beginnings"],
  ["l51-dismiss-idea",51,1,1,"dismissed the idea that","dismiss the idea that","否定……的观点","dismiss the idea that {claim}",[["claim","被认为缺乏依据的观点","automation will eliminate all jobs","economic growth alone solves poverty"]],"多数经济学家否定自动化会消灭所有工作的观点。","Most economists dismiss the idea that automation will eliminate all jobs.","dismiss the idea that"],
  ["l51-foresaw-time",51,1,2,"foresaw a time when","foresee a time when","预见……的时代","foresee a time when {future_change}",[["future_change","有依据的长期变化","renewable energy becomes dominant","routine diagnosis is partly automated"]],"早期科学家曾预见可再生能源会占据主导地位的时代。","Early scientists foresaw a time when renewable energy would become the dominant source of power.","foresaw a time when"],

  ["l53-political-pressure",53,0,9,"not subject to political pressure","be subject to political pressure","受到政治压力影响","be subject to {pressure}",[["pressure","影响独立判断的外部压力","political pressure","commercial pressure"]],"独立监管机构不应受到政治压力影响。","Independent regulators should not be subject to political pressure.","subject to political pressure"],
  ["l53-public-inspection",53,0,13,"open to public inspection","be open to public inspection","向公众开放查阅",null,[],"政府采购记录都应向公众开放查阅。","Government procurement records should be open to public inspection.","open to public inspection"],
  ["l53-varies-according",53,0,15,"varies according to the nature of the complaint","vary according to the nature of","根据……的性质而变化","vary according to the nature of {case}",[["case","决定处理方式的个案类型","the offence","the complaint"]],"处罚力度应根据违法行为的性质而变化。","The severity of the penalty should vary according to the nature of the offence.","vary according to the nature of"],
  ["l53-put-end",53,1,8,"put an end to an unpleasant practice","put an end to","终止……","put an end to {harmful_practice}",[["harmful_practice","需要被终止的有害做法","discriminatory hiring","illegal dumping"]],"更严格的执法可以终止某些行业的非法倾倒行为。","Stricter enforcement could put an end to illegal dumping in some industries.","put an end to"],

  ["l55-relative-terms",55,0,1,"in relative terms","in relative terms","相对而言",null,[],"相对而言，这项公共交通投资的成本并不高。","In relative terms, the cost of this public transport investment is modest.","In relative terms"],
  ["l55-detect-presence",55,2,0,"capable of detecting the presence of life","be capable of detecting the presence of","能够检测到……的存在","be capable of detecting the presence of {substance}",[["substance","需要被检测的物质或迹象","toxic chemicals","early disease"]],"新型传感器能够检测到饮用水中有毒化学物质的存在。","The new sensors are capable of detecting the presence of toxic chemicals in drinking water.","capable of detecting the presence of"],
  ["l55-blot-out",55,2,6,"blotting out the light from its star","blot out","遮蔽／挡住……","blot out {light_or_view}",[["light_or_view","需要被遮挡的光线或视线","artificial light","the view of the sky"]],"设计不当的高层建筑可能遮蔽周围住宅的自然光。","Poorly designed high-rise buildings can blot out natural light from neighbouring homes.","blot out"],
  ["l55-realms-fiction",55,3,5,"in the realms of science fiction","in the realm of science fiction","属于科幻范畴",null,[],"完全由机器管理的城市目前仍主要属于科幻范畴。","Cities managed entirely by machines remain largely in the realm of science fiction.","in the realm of science fiction"],

  ["l59-in-belief",59,0,3,"in the belief that","in the belief that","因为相信……","act in the belief that {claim}",[["claim","支撑行动但可能错误的看法","more data always improve decisions","economic growth benefits everyone"]],"一些机构因为相信更多数据总会改善决策而收集过量个人信息。","Some institutions collect excessive personal information in the belief that more data will always improve decision-making.","in the belief that"],
  ["l59-beyond-worth",59,0,5,"acquire a value beyond their true worth","acquire value beyond","获得超越……的价值","acquire value beyond {market_measure}",[["market_measure","不能完全体现其意义的经济尺度","their market price","replacement cost"]],"随着时间推移，历史建筑会因其文化意义而获得超越市场价格的价值。","Over time, historic buildings can acquire value beyond their market price because of their cultural significance.","acquire value beyond"],
  ["l59-bearing-on",59,2,4,"have some bearing on it","have a bearing on","与……有关／对……有影响","have a bearing on {decision_or_issue}",[["decision_or_issue","会受到相关信息影响的问题","public policy","the final decision"]],"当地就业数据应当会影响新的培训政策。","Local employment data should have a bearing on the new training policy.","have a bearing on"],
  ["l59-authority-on",59,2,9,"become an authority on one's hobby","become an authority on","成为……方面的权威","become an authority on {subject}",[["subject","长期钻研的专门领域","urban history","renewable-energy law"]],"经过多年研究，她成为城市历史方面的权威。","After years of research, she became an authority on urban history.","became an authority on"],
];

for (const [key, lesson, p, s, surface, canonical, zh, pattern, rawSlots, usePrompt, useAnswer, useTarget] of compactCollocationSpecs) {
  collocationSpecs.push({
    key, lesson, p, s, surface, canonical, zh, pattern,
    slots: rawSlots.map(([name, role_zh, ...replacement_examples]) => slot(name, role_zh, ...replacement_examples)),
    usage: "用于正式书面表达时，应保证搭配对象、语义逻辑和语域自然，不因复用原文而强行套用。",
    scores: [5, 5, 5, 5], difficulty: 4, priority: "core",
    accepted: surface === canonical ? [] : [surface],
    use: { prompt_zh: usePrompt, hints: [], target_surface: useTarget, reference_answer: useAnswer, transfer_type: "cross_topic" },
  });
}

function makeCollocation(spec) {
  const { source, sentence } = locatedSentence(spec.lesson, spec.p, spec.s);
  if (!sentence.includes(spec.surface)) throw new Error(`${spec.key}: surface '${spec.surface}' not found.`);
  const canonical = normalizeCollocation(spec.canonical);
  const accepted = [spec.canonical, ...(spec.accepted ?? [])].filter((item, index, values) =>
    values.findIndex((other) => normalizeCollocation(other) === normalizeCollocation(item)) === index);
  return {
    schema_version: "1.1.0",
    id: uuidFrom(`collocation:${promptVersion}:${spec.key}`),
    canonical_text: spec.canonical,
    translation_prompt: spec.zh,
    pattern: spec.pattern,
    slots: spec.slots,
    expression_type: spec.type ?? "collocation",
    grammar_pattern: spec.grammar ?? null,
    usage_note: spec.usage ?? null,
    common_error: spec.error ?? null,
    accepted_answers: accepted,
    exercise_seed: spec.use ? { guided_application: spec.use } : {},
    topics: source.topics,
    argument_functions: [],
    source_links: [{
      source_essay_id: source.id,
      paragraph_index: spec.p,
      sentence_index: spec.s,
      sentence_text: sentence,
      card_id: null,
      surface_form: spec.surface,
      learning_surface_form: null,
      occurrence_index: 0,
      learning_occurrence_index: null,
      role: "primary",
    }],
    selection_scores: {
      naturalness: spec.scores[0], active_recall_value: spec.scores[1], transfer_value: spec.scores[2], ielts_usefulness: spec.scores[3],
    },
    difficulty: spec.difficulty,
    normalized_text_hash: sha256(canonical),
    deduplication: { group_key: canonical, merge_target_id: null, confidence: "high", note: spec.note ?? null },
    recommendation_reasons: [spec.priority === "supporting"
      ? "来源表达自然且具有语言丰富度，但 IELTS Task 2 迁移范围较窄，建议作为补充项审核。"
      : "中国学习者不容易主动产出，搭配边界清楚，并能迁移到新的书面表达场景。"],
    uncertainties: spec.note ? ["已标记与现有库的相邻词形或学习目标，需人工确认是否保持独立。"] : [],
    workflow_status: "candidate",
    learning_mode: spec.learningMode ?? "recall_use",
    priority: spec.priority ?? "core",
    provenance: { guideline_version: "1.2.0", prompt_version: promptVersion, processor_type: "codex", model_id: null },
    review_history: [{ action: "created", reviewer: "codex", reason: "从用户提供的《新概念英语 3》扫描逐段提取并完成首轮全库查重，等待人工审核。", reviewed_at: createdAt }],
    content_revision: 1,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

const generatedCards = sentenceSpecs.filter((spec) => batchConfig.lessons.has(spec.lesson)).map(makeSentenceCandidate);
const generatedCollocations = collocationSpecs.filter((spec) => batchConfig.lessons.has(spec.lesson)).map(makeCollocation);
const existingCards = JSON.parse(fs.readFileSync(paths.cards, "utf8"));
const approvedCards = JSON.parse(fs.readFileSync(paths.approvedCards, "utf8"));
const existingCollocations = JSON.parse(fs.readFileSync(paths.collocations, "utf8"));
const approvedCollocations = JSON.parse(fs.readFileSync(paths.approvedCollocations, "utf8"));

const retainedCards = existingCards.filter((item) => item.provenance?.prompt_version !== promptVersion);
const retainedCollocations = existingCollocations.filter((item) => item.provenance?.prompt_version !== promptVersion);
const allCards = [...retainedCards, ...generatedCards];
const allCollocations = [...retainedCollocations, ...generatedCollocations];

function assertUnique(items, hashOf, label) {
  const seen = new Map();
  for (const item of items) {
    const hash = hashOf(item);
    if (seen.has(hash)) throw new Error(`${label} duplicate: ${seen.get(hash)} / ${item.id ?? item.candidate_id}`);
    seen.set(hash, item.id ?? item.candidate_id);
  }
}
assertUnique(allCards, (item) => item.card.normalized_text_hash, "sentence candidate");
assertUnique(allCollocations, (item) => item.normalized_text_hash, "collocation candidate");

fs.writeFileSync(paths.cards, `${JSON.stringify(allCards, null, 2)}\n`, "utf8");
fs.writeFileSync(paths.collocations, `${JSON.stringify(allCollocations, null, 2)}\n`, "utf8");

const tokens = (text) => new Set(normalizeCollocation(text).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean));
const similarity = (left, right) => {
  const a = tokens(left); const b = tokens(right);
  const overlap = [...a].filter((item) => b.has(item)).length;
  return overlap / Math.max(1, new Set([...a, ...b]).size);
};
const nearest = (text, collection, value) => collection
  .map((item) => ({ text: value(item), score: similarity(text, value(item)) }))
  .sort((a, b) => b.score - a.score)[0];

const review = [
  `# 《新概念英语 3》${batchConfig.label}候选审核`,
  "",
  `- 生成时间：${createdAt}`,
  `- 批次：\`${promptVersion}\``,
  `- 新增句子候选：${generatedCards.length}，全部为 \`candidate\``,
  `- 新增 Collocation 候选：${generatedCollocations.length}，全部为 \`candidate\``,
  `- 查重基线：${approvedCards.length} 张正式句子卡、${approvedCollocations.length} 条正式 Collocation`,
  "- 精确重复：句子 0；Collocation 0",
  "- 排除项：基础透明或场景过窄的 on display、flash on and off、feel envious of 等未生成候选。",
  "",
  "## 句子候选",
  "",
];
for (const [index, candidate] of generatedCards.entries()) {
  const source = sources.find((item) => item.id === candidate.card.source_essay_id);
  const close = nearest(candidate.card.learning_sentence, approvedCards, (item) => item.learning_sentence);
  review.push(
    `### ${index + 1}. ${candidate.card.learning_sentence}`,
    "",
    `- 来源：${source.source_name} · ${source.title} · 第 ${candidate.card.paragraph_index + 1} 段第 ${candidate.card.sentence_index + 1} 句`,
    `- 中文：${candidate.card.translation_zh}`,
    `- 重点：${candidate.card.primary_focus}`,
    `- 最近正式句相似度：${close.score.toFixed(2)} · ${close.text}`,
    `- 仿写：${candidate.card.transfer_example}`,
    `- 推荐：${candidate.recommendation_reasons.join("；")}`,
    "",
  );
}
review.push("## Collocation 候选", "");
for (const [index, candidate] of generatedCollocations.entries()) {
  const source = sources.find((item) => item.id === candidate.source_links[0].source_essay_id);
  const close = nearest(candidate.canonical_text, approvedCollocations, (item) => item.canonical_text);
  review.push(
    `### ${index + 1}. ${candidate.canonical_text}`,
    "",
    `- 中文：${candidate.translation_prompt}`,
    `- 来源：${source.title} · 第 ${candidate.source_links[0].paragraph_index + 1} 段第 ${candidate.source_links[0].sentence_index + 1} 句`,
    `- 原文形态：${candidate.source_links[0].surface_form}`,
    `- 最近正式搭配相似度：${close.score.toFixed(2)} · ${close.text}`,
    `- 优先级：${candidate.priority}`,
    ...(candidate.deduplication.note ? [`- 查重说明：${candidate.deduplication.note}`] : []),
    "",
  );
}
fs.writeFileSync(paths.review, `${review.join("\n")}\n`, "utf8");

process.stdout.write(`Generated ${generatedCards.length} sentence candidates and ${generatedCollocations.length} collocation candidates; nothing approved.\n`);
