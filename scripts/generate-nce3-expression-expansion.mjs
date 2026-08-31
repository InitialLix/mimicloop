import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const generatedAt = "2026-08-19T03:30:00.000Z";
const promptVersion = "nce3-high-recall-core-appreciation-v1";
const sourceFile = path.join(root, "data/source_essays.json");
const cardFile = path.join(root, "data/approved_cards.seed.json");
const candidateFile = path.join(root, "data/candidate_collocations.json");

const normalize = (text) => text.normalize("NFKC").toLowerCase().replace(/[.!?,;:]+$/g, "").replace(/\s+/g, " ").trim();
const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");
const uuidFrom = (key) => {
  const hex = sha256(key).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ["8", "9", "a", "b"][Number.parseInt(hex[16], 16) % 4];
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
};
const splitSentences = (paragraph) => (paragraph.match(/[^.!?]+(?:[.!?]+(?:[”’"']+)?|$)/g) ?? []).map((item) => item.trim()).filter(Boolean);

const core = (lesson, surface, canonical, zh, promptZh, referenceAnswer, targetSurface = canonical) => ({
  lesson, surface, canonical, zh, mode: "recall_use", promptZh, referenceAnswer, targetSurface,
});
const appreciation = (lesson, surface, canonical, zh) => ({ lesson, surface, canonical, zh, mode: "appreciation" });

const specs = [
  core(27, "The conditions of society are such that", "conditions are such that", "情况是如此，以至于……", "许多城市的住房条件使低收入家庭难以住在工作地点附近。", "In many cities, housing conditions are such that low-income families struggle to live near their workplaces."),
  core(27, "make it possible for him to", "make it possible for someone to", "使某人能够……", "灵活的工作安排使父母能够花更多时间陪伴孩子。", "Flexible working arrangements make it possible for parents to spend more time with their children.", "make it possible for parents to"),
  core(29, "have a universal appeal", "have universal appeal", "具有普遍吸引力", "讲述普通人克服逆境的故事往往具有普遍吸引力。", "Stories about ordinary people overcoming adversity often have universal appeal."),
  core(29, "stems largely from", "stem largely from", "主要源于……", "公众对这项政策的不信任主要源于政府缺乏透明度。", "Public distrust of the policy stems largely from the government's lack of transparency.", "stems largely from"),
  core(29, "enable you to judge for yourself", "enable someone to judge for themselves", "使某人能够自行判断", "公布完整数据将使读者能够自行判断这些结论是否可靠。", "Publishing the full data will enable readers to judge for themselves whether the conclusions are reliable.", "enable readers to judge for themselves"),
  core(38, "be in a unique position", "be in a unique position to", "处于能够……的独特位置", "地方政府最了解社区需求，因此特别有能力发现服务缺口。", "Local governments are in a unique position to identify gaps in public services.", "in a unique position to"),
  core(38, "is always faced with a difficult task", "be faced with a difficult task", "面临一项艰巨任务", "政策制定者在平衡经济增长与环境保护时面临一项艰巨任务。", "Policymakers are faced with a difficult task when balancing economic growth with environmental protection.", "are faced with a difficult task"),
  core(38, "making a real effort to", "make a real effort to", "切实努力去……", "学校应切实努力减少弱势学生之间的成绩差距。", "Schools should make a real effort to narrow the attainment gap among disadvantaged students."),
  core(41, "fails to mention", "fail to mention", "没有提及……", "这份报告赞扬了远程办公的灵活性，却没有提及它对初级员工的长期影响。", "The report praises the flexibility of remote work but fails to mention its long-term effects on junior employees.", "fails to mention"),
  core(41, "are prepared to tolerate", "be prepared to tolerate", "愿意容忍……", "如果公共交通可靠，居民或许愿意容忍更少的停车位。", "Residents may be prepared to tolerate fewer parking spaces if public transport is reliable.", "prepared to tolerate"),
  core(41, "involves considerable planning", "involve considerable planning", "需要周密规划", "在全国范围内推行新的课程需要周密规划。", "Introducing a new curriculum nationwide involves considerable planning.", "involves considerable planning"),
  core(41, "make do with second best", "make do with second best", "退而求其次；将就次优选择", "偏远地区的患者不应因为专科医生不足而只能接受次优治疗。", "Patients in remote areas should not have to make do with second-best care because specialists are scarce.", "make do with second-best"),
  core(44, "have the disadvantage of", "have the disadvantage of", "存在……的缺点", "网络课程虽然灵活，却存在减少面对面交流的缺点。", "Online courses are flexible but have the disadvantage of reducing face-to-face interaction."),
  core(44, "keep you occupied", "keep someone occupied", "让某人一直有事可做", "课后活动可以让孩子保持忙碌，同时帮助他们培养社交技能。", "After-school activities can keep children occupied while helping them develop social skills.", "keep children occupied"),
  core(44, "there is nothing to prevent you from", "there is nothing to prevent someone from", "没有什么能阻止某人……", "只要隐私得到保护，就没有什么能阻止医院共享匿名研究数据。", "Provided that privacy is protected, there is nothing to prevent hospitals from sharing anonymized research data.", "there is nothing to prevent hospitals from"),
  core(45, "bring about major changes", "bring about major changes", "带来重大变化", "对清洁能源的持续投资可以给国家电力系统带来重大变化。", "Sustained investment in clean energy can bring about major changes in a country's power system."),
  appreciation(45, "struggle against economic odds", "struggle against economic odds", "在不利经济条件下艰难维持"),
  core(45, "act as spokesmen for", "act as spokespeople for", "担任……的发言人", "社区领袖可以担任居民的发言人，与地方政府协商。", "Community leaders can act as spokespeople for residents in negotiations with local authorities."),
  core(45, "acquired a market value", "acquire a market value", "获得市场价值", "一旦个人数据被汇总并出售，它就会获得市场价值。", "Personal data acquire a market value once they are aggregated and sold."),
  core(47, "threatens to overwhelm us", "threaten to overwhelm", "可能压垮；有令……不堪重负之势", "城市产生的大量电子垃圾可能压垮现有的回收系统。", "The volume of electronic waste produced by cities threatens to overwhelm existing recycling systems.", "threatens to overwhelm"),
  core(47, "on a scale ranging from 1 to 7", "on a scale ranging from ... to ...", "按从……到……的量表", "参与者按照从一到十分的量表对服务质量进行评分。", "Participants rated the quality of the service on a scale ranging from one to ten.", "on a scale ranging from one to ten"),
  core(47, "rises to a staggering", "rise to a staggering", "上升到惊人的……", "在一些大城市，住房支出会上升到家庭收入的惊人一半。", "In some major cities, housing costs rise to a staggering half of household income."),
  core(51, "is notoriously difficult", "be notoriously difficult", "出了名地难", "长期经济趋势出了名地难以准确预测。", "Long-term economic trends are notoriously difficult to predict accurately.", "are notoriously difficult"),
  core(51, "pointed the way to the future", "point the way to the future", "指明未来方向", "早期的电池技术为更清洁的交通方式指明了未来方向。", "Early battery technologies pointed the way to the future of cleaner transport.", "pointed the way to the future"),
  core(51, "relieve office workers and accountants of dull, repetitive clerical work", "relieve someone of repetitive work", "使某人摆脱重复性工作", "自动化可以使护士摆脱重复的行政工作，让他们有更多时间照顾患者。", "Automation can relieve nurses of repetitive administrative work, leaving them more time for patient care.", "relieve nurses of repetitive administrative work"),
  core(51, "have become commonplace", "become commonplace", "变得司空见惯", "在许多工作场所，视频会议如今已经司空见惯。", "Video conferences have become commonplace in many workplaces."),
  core(51, "couldn't possibly have foreseen", "could not possibly have foreseen", "不可能预见到……", "早期互联网设计者不可能预见到社交媒体对政治讨论的影响。", "The early designers of the internet could not possibly have foreseen the impact of social media on political debate."),
  core(53, "safeguard the interest of the individual", "safeguard the interests of", "维护……的利益", "独立监管机构有助于维护消费者的利益。", "Independent regulators help to safeguard the interests of consumers."),
  core(53, "is suitably qualified to", "be suitably qualified to", "具备适当资质去……", "只有具备适当资质的专业人员才能评估儿童的心理健康。", "Only professionals who are suitably qualified to assess children's mental health should do so.", "suitably qualified to"),
  core(53, "act on his behalf", "act on someone's behalf", "代表某人行事", "在患者无法作出决定时，家属可能需要代表患者行事。", "Family members may need to act on a patient's behalf when the patient cannot make a decision.", "act on a patient's behalf"),
  core(53, "strongly denied the accusation", "strongly deny the accusation", "坚决否认指控", "该公司坚决否认其故意误导消费者的指控。", "The company strongly denied the accusation that it had deliberately misled consumers.", "strongly denied the accusation"),
  core(53, "further complaints were lodged against him", "further complaints were lodged against", "又有人对……提出投诉", "事故发生后，又有人对这家运营商提出投诉。", "Further complaints were lodged against the operator after the accident."),
  core(53, "might have gone unnoticed", "might have gone unnoticed", "本可能未被察觉", "如果没有独立审计，这一系统性错误本可能一直未被察觉。", "Without an independent audit, the systematic error might have gone unnoticed."),
  appreciation(55, "will prove infinitely more difficult", "prove infinitely more difficult", "结果会困难得多"),
  core(55, "provides ideal conditions", "provide ideal conditions for", "为……提供理想条件", "稳定的监管环境能为长期投资提供理想条件。", "A stable regulatory environment can provide ideal conditions for long-term investment."),
  core(55, "find a way of blotting out", "find a way of doing something", "找到做某事的方法", "城市必须找到既增加住房供应又不破坏绿地的方法。", "Cities must find a way of increasing the housing supply without destroying green spaces.", "find a way of increasing"),
  core(55, "change our view of ourselves", "change our view of", "改变我们对……的看法", "人工智能的快速发展可能会改变我们对人类创造力的看法。", "The rapid development of artificial intelligence may change our view of human creativity."),
  core(59, "without being aware of doing so", "without being aware of doing so", "在自己没有意识到的情况下", "许多消费者在没有意识到的情况下分享了敏感数据。", "Many consumers share sensitive data without being aware of doing so."),
  core(59, "what can only be described as clutter", "what can only be described as", "只能称作……的东西", "许多网站充斥着只能称作视觉杂乱的信息。", "Many websites are filled with what can only be described as visual clutter."),
  core(59, "the chances that she will ever be able to afford such purchases are remote", "the chances that ... are remote", "……的可能性很小", "短期内所有燃煤电厂都会关闭的可能性很小。", "The chances that every coal-fired power station will close in the near future are remote.", "The chances that"),
  core(59, "to such an extent that", "to such an extent that", "达到如此程度，以至于……", "一些城市扩张得如此迅速，以至于公共服务难以跟上。", "Some cities have expanded to such an extent that public services struggle to keep pace."),
  core(59, "not confined to any one country", "not be confined to any one country", "并不局限于任何一个国家", "网络诈骗并不局限于任何一个国家，需要国际合作。", "Online fraud is not confined to any one country and requires international cooperation.", "not confined to any one country"),

  appreciation(18, "on display in public places", "on display in public places", "在公共场所展出"),
  appreciation(18, "Oddly shaped forms", "oddly shaped forms", "形状奇特的物体"),
  appreciation(18, "a gust of wind", "a gust of wind", "一阵风"),
  appreciation(18, "flickered continuously", "flicker continuously", "持续闪烁"),
  appreciation(18, "flashed on and off angrily", "flash on and off angrily", "忽明忽暗地猛烈闪烁"),
  appreciation(18, "not only seemed designed to shock people emotionally, but to give them electric shocks as well", "not only be designed to ..., but to ... as well", "不仅旨在……，而且还……"),
  appreciation(27, "give everything we possess", "give everything one possesses", "倾尽自己拥有的一切"),
  appreciation(27, "ask you to feel sorry for him", "ask someone to feel sorry for one", "求某人同情自己"),
  appreciation(27, "lead the life he leads", "lead the life one leads", "过自己所选择的生活"),
  appreciation(27, "where the next meal is coming from", "where the next meal is coming from", "下一顿饭从哪里来"),
  appreciation(27, "the thousands of anxieties which afflict other people", "anxieties that afflict people", "困扰人们的种种焦虑"),
  appreciation(27, "keep himself alive", "keep oneself alive", "维持生存"),
  appreciation(27, "their simple way of life", "a simple way of life", "简朴的生活方式"),
  appreciation(29, "laugh to tears", "laugh to tears", "笑出眼泪"),
  appreciation(29, "come into fashion", "come into fashion", "开始流行"),
  appreciation(29, "kept on pestering his doctor", "keep on pestering someone", "不停纠缠某人"),
  appreciation(29, "dreaded having to spend", "dread having to do something", "害怕不得不做某事"),
  appreciation(29, "thinking of all the fun he was missing", "think of all the fun one is missing", "想着自己错过的种种乐趣"),
  appreciation(29, "The man took heart", "take heart", "振作起来；有了信心"),
  appreciation(29, "sure enough", "sure enough", "果然"),
  appreciation(29, "hobble along to a party", "hobble along", "一瘸一拐地走"),
  appreciation(29, "drank a little more than was good for him", "more than was good for someone", "超过适宜的程度"),
  appreciation(38, "the great mass of evidence", "a great mass of evidence", "大量证据"),
  appreciation(38, "steadily accumulates", "accumulate steadily", "不断积累"),
  appreciation(38, "as it were", "as it were", "可以说；仿佛"),
  appreciation(38, "the few scanty clues available", "the few scanty clues available", "现有的少量线索"),
  appreciation(38, "seemingly insignificant remains", "seemingly insignificant remains", "看似无关紧要的遗迹"),
  appreciation(38, "have long been puzzled by", "have long been puzzled by", "长期以来一直对……感到困惑"),
  appreciation(38, "the passage of days", "the passage of days", "时日的流逝"),
  appreciation(38, "as near as early man could get to writing", "as near as someone could get to", "某人所能达到的最接近……的程度"),
  appreciation(41, "City born and city bred", "city born and city bred", "生在城市、长在城市"),
  appreciation(41, "go into raptures at the mere mention of the country", "go into raptures at the mere mention of", "一提到……便赞叹不已"),
  appreciation(41, "the gentle pace of living", "the gentle pace of living", "悠缓的生活节奏"),
  appreciation(41, "This idyllic pastoral scene", "an idyllic pastoral scene", "田园诗般的景象"),
  appreciation(41, "the dubious privilege of living in the country", "the dubious privilege of", "所谓的、值得怀疑的特权"),
  appreciation(41, "is beyond me", "be beyond someone", "令某人无法理解"),
  appreciation(41, "do without the few pastoral pleasures", "do without", "没有……也能过；舍弃"),
  appreciation(41, "draws to its close", "draw to a close", "接近尾声"),
  appreciation(41, "run wild", "run wild", "兴奋失控；尽情撒欢"),
  appreciation(41, "stagger home loaded with", "stagger home loaded with", "满载着……踉跄回家"),
  appreciation(41, "Nor is the city without its moments of beauty", "Nor is ... without its moments of ...", "……也并非没有令人……的时刻"),
  appreciation(41, "the peace that descends on deserted city streets", "the peace that descends on", "降临在……之上的宁静"),
  appreciation(41, "tucked away in their homes", "be tucked away", "安然躲在；隐居于"),
  appreciation(41, "obstinately pretend", "obstinately pretend", "固执地假装"),
  appreciation(44, "get cramped and stuffy", "get cramped and stuffy", "变得拥挤而闷热"),
  appreciation(44, "the monotonous rhythm", "the monotonous rhythm", "单调的节奏"),
  appreciation(44, "sleep comes in snatches", "sleep comes in snatches", "睡得断断续续"),
  appreciation(44, "fumbling to find your ticket", "fumble to find", "摸索着寻找"),
  appreciation(44, "a great variety of civilized comforts", "a great variety of civilized comforts", "多种舒适而文明的享受"),
  appreciation(44, "hardened travellers", "hardened travellers", "久经旅途的旅行者"),
  appreciation(44, "nothing can match them for speed and comfort", "nothing can match ... for ...", "在……方面没有什么能比得上……"),
  appreciation(44, "settle back in a deep armchair", "settle back", "舒适地靠坐下来"),
  appreciation(44, "soar effortlessly", "soar effortlessly", "轻松翱翔"),
  appreciation(44, "hidden from view", "be hidden from view", "被遮挡而看不见"),
  appreciation(44, "stretch out for miles", "stretch out for miles", "绵延数英里"),
  appreciation(44, "fresh and uncrumpled", "fresh and uncrumpled", "神清气爽、衣着整洁"),
  appreciation(44, "a long and arduous journey", "a long and arduous journey", "漫长而艰苦的旅程"),
  appreciation(45, "facts are sacred", "facts are sacred", "事实神圣不可侵犯"),
  appreciation(45, "cause untold suffering", "cause untold suffering", "造成难以言表的痛苦"),
  appreciation(45, "fame and fortune overnight", "fame and fortune overnight", "一夜之间名利双收"),
  appreciation(45, "a perpetual struggle against poverty", "a perpetual struggle against poverty", "与贫困长期不息的斗争"),
  appreciation(45, "lived in obscurity", "live in obscurity", "默默无闻地生活"),
  appreciation(45, "The rise to fame was swift", "a swift rise to fame", "迅速成名"),
  appreciation(45, "Gifts poured in", "gifts pour in", "礼物纷至沓来"),
  appreciation(45, "pressing for interviews", "press for interviews", "一再要求采访"),
  appreciation(45, "the victims of commercialization", "victims of commercialization", "商业化的受害者"),
  appreciation(47, "sheer volume of rubbish", "the sheer volume of", "数量之庞大"),
  appreciation(47, "an even more insidious kind of pollution", "an insidious kind of", "一种更隐蔽、更有害的……"),
  appreciation(47, "at any time of the day or night", "at any time of the day or night", "不分昼夜、随时"),
  appreciation(47, "at maximum volume", "at maximum volume", "以最大音量"),
  appreciation(47, "the worst offenders", "the worst offenders", "问题最严重的一方"),
  appreciation(47, "a golden memory", "a golden memory", "珍贵而遥远的记忆"),
  appreciation(51, "commonly known as PCs", "commonly known as", "通常称为……"),
  appreciation(51, "in common use today", "be in common use", "如今被普遍使用"),
  appreciation(51, "Considering how recent these developments are", "considering how recent ... are", "考虑到……出现得如此之晚"),
  appreciation(51, "as long ago as the 1960s", "as long ago as", "早在……"),
  appreciation(53, "much admired all over the world for", "be much admired for", "因……而广受赞誉"),
  appreciation(53, "enlightened social policies", "enlightened social policies", "开明的社会政策"),
  appreciation(53, "high-handed or incompetent public officers", "high-handed or incompetent", "专横或不称职的"),
  appreciation(53, "from all levels of society", "from all levels of society", "来自社会各个阶层"),
  appreciation(53, "examines every single letter in detail", "examine every ... in detail", "逐一详细审查"),
  appreciation(53, "a typical example of", "a typical example of", "……的典型例子"),
  appreciation(53, "There was nothing in the record to show that", "there is nothing to show that", "没有任何证据表明……"),
  appreciation(53, "The policeman in question", "the ... in question", "所涉及的……；有关的……"),
  appreciation(53, "prompt action", "prompt action", "迅速采取的行动"),
  appreciation(55, "the outer edges of", "the outer edges of", "……的外围边缘"),
  appreciation(55, "In the first instance", "in the first instance", "首先；第一步"),
  appreciation(55, "cherish the hope", "cherish the hope that", "怀着……的希望"),
  appreciation(55, "lowly forms of life", "lowly forms of life", "低等生命形式"),
  appreciation(55, "As Earth-dwellers", "Earth-dwellers", "地球居民"),
  appreciation(59, "tend to amass possessions", "amass possessions", "积攒大量物品"),
  appreciation(59, "indiscriminate collectors", "indiscriminate collectors", "不加选择的收藏者"),
  appreciation(59, "full of associations with the past", "be full of associations with the past", "承载着与往昔的种种联想"),
  appreciation(59, "in an attempt to avoid waste", "in an attempt to", "试图……"),
  appreciation(59, "become a mania", "become a mania", "发展成一种狂热"),
  appreciation(59, "fall out in every direction", "fall out in every direction", "朝四面八方散落"),
  appreciation(59, "Whatever it consists of", "whatever it consists of", "无论它由什么组成"),
  appreciation(59, "in connection with it", "in connection with", "与……有关"),
  appreciation(59, "like-minded collectors", "like-minded people", "志趣相投的人"),
  appreciation(59, "compare notes", "compare notes", "交流心得；互相核对信息"),
  appreciation(59, "in search of a rare specimen", "in search of", "寻找……"),
  appreciation(59, "occupying spare time so constructively", "occupy spare time constructively", "以有益的方式利用闲暇时间"),
];

const sources = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
const cards = JSON.parse(fs.readFileSync(cardFile, "utf8"));
const existing = JSON.parse(fs.readFileSync(candidateFile, "utf8"))
  .filter((item) => item.provenance?.prompt_version !== promptVersion);
const sourceByLesson = new Map(sources.flatMap((source) => {
  const match = source.local_raw_file?.match(/lesson-(\d+)\.txt$/);
  return match ? [[Number(match[1]), source]] : [];
}));
const cardsByLocation = new Map(cards.map((card) => [`${card.source_essay_id}:${card.paragraph_index}:${card.sentence_index}`, card]));
const existingCanonical = new Set(existing.map((item) => normalize(item.canonical_text)));

function locate(spec) {
  const source = sourceByLesson.get(spec.lesson);
  if (!source) throw new Error(`Missing source for lesson ${spec.lesson}`);
  for (const paragraph of source.paragraphs) {
    const sentences = splitSentences(paragraph.text);
    for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex += 1) {
      if (sentences[sentenceIndex].includes(spec.surface)) {
        return { source, paragraphIndex: paragraph.paragraph_index, sentenceIndex, sentence: sentences[sentenceIndex] };
      }
    }
  }
  throw new Error(`L${spec.lesson}: surface not found: ${spec.surface}`);
}

const generated = [];
for (const spec of specs) {
  const normalizedCanonical = normalize(spec.canonical);
  if (existingCanonical.has(normalizedCanonical)) continue;
  const located = locate(spec);
  const card = cardsByLocation.get(`${located.source.id}:${located.paragraphIndex}:${located.sentenceIndex}`) ?? null;
  const learningSurface = card?.learning_sentence.includes(spec.surface) ? spec.surface : null;
  const useSeed = spec.mode === "recall_use" ? {
    guided_application: {
      prompt_zh: spec.promptZh,
      hints: [],
      target_surface: spec.targetSurface,
      reference_answer: spec.referenceAnswer,
      transfer_type: "cross_topic",
    },
  } : {};
  generated.push({
    schema_version: "1.2.0",
    id: uuidFrom(`collocation:${promptVersion}:L${spec.lesson}:${normalizedCanonical}`),
    canonical_text: spec.canonical,
    translation_prompt: spec.zh,
    pattern: null,
    slots: [],
    expression_type: spec.mode === "appreciation" ? "fixed_phrase" : "collocation",
    grammar_pattern: null,
    usage_note: spec.mode === "appreciation" ? "原文欣赏表达：理解其语气和语境即可，不进入强制 Recall → Use。" : "先保证新语境中的自然度和搭配逻辑，再考虑复用表达。",
    common_error: null,
    accepted_answers: [spec.canonical],
    exercise_seed: useSeed,
    topics: located.source.topics,
    argument_functions: [],
    source_links: [{
      source_essay_id: located.source.id,
      paragraph_index: located.paragraphIndex,
      sentence_index: located.sentenceIndex,
      sentence_text: located.sentence,
      card_id: card?.id ?? null,
      surface_form: spec.surface,
      learning_surface_form: learningSurface,
      occurrence_index: 0,
      learning_occurrence_index: learningSurface ? 0 : null,
      role: "primary",
    }],
    selection_scores: spec.mode === "recall_use"
      ? { naturalness: 5, active_recall_value: 5, transfer_value: 5, ielts_usefulness: 4 }
      : { naturalness: 5, active_recall_value: 2, transfer_value: 2, ielts_usefulness: 2 },
    difficulty: spec.mode === "recall_use" ? 4 : 3,
    normalized_text_hash: sha256(normalizedCanonical),
    deduplication: { group_key: normalizedCanonical, merge_target_id: null, confidence: "high", note: null },
    recommendation_reasons: [spec.mode === "recall_use"
      ? "现代书面英语自然、跨语境迁移价值较高，适合进入 Core Recall → Use。"
      : "中文含义容易理解，但英文不容易主动写出；表达地道而语境或修辞色彩较强，适合作为 Appreciation。"],
    uncertainties: [],
    workflow_status: "candidate",
    learning_mode: spec.mode,
    priority: spec.mode === "recall_use" ? "core" : "supporting",
    provenance: { guideline_version: "1.2.0", prompt_version: promptVersion, processor_type: "codex", model_id: "gpt-5" },
    review_history: [{ action: "created", reviewer: "codex", reason: "按段落高召回提取，并按主动产出价值分为 Core / Appreciation；已完成全库规范化查重，等待发布审核。", reviewed_at: generatedAt }],
    content_revision: 1,
    created_at: generatedAt,
    updated_at: generatedAt,
  });
  existingCanonical.add(normalizedCanonical);
}

fs.writeFileSync(candidateFile, `${JSON.stringify([...existing, ...generated], null, 2)}\n`);
const counts = generated.reduce((result, item) => ({ ...result, [item.learning_mode]: (result[item.learning_mode] ?? 0) + 1 }), {});
console.log(`Generated ${generated.length} candidates: ${JSON.stringify(counts)}`);
