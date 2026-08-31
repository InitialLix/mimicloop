export const topicLabels: Record<string, string> = {
  education_children: "教育与儿童",
  technology_ai_digital_media: "科技与数字媒体",
  environment_energy_animals: "环境与动物",
  health_diet_lifestyle: "健康与生活方式",
  government_public_policy_spending: "政府与公共政策",
  work_economy_business_consumption: "工作与经济",
  society_family_population_equality: "社会与家庭",
  crime_law_punishment: "犯罪与法律",
  culture_art_language_media: "文化与媒体",
  cities_housing_transport: "城市与交通",
  globalization_tourism_migration: "全球化与旅游",
  science_space_ethics: "科学与伦理",
};

export const functionLabels: Record<string, string> = {
  paraphrase_prompt: "改写题目",
  state_position: "表明立场",
  topic_sentence: "中心观点",
  explain_mechanism: "解释机制",
  give_example: "举例",
  describe_result: "描述结果",
  concession: "让步",
  counterargument: "转折反驳",
  compare_or_weigh: "比较权衡",
  qualify_claim: "限定观点",
  propose_solution: "提出方案",
  conclude_or_infer: "总结推论",
};

export const focusLabels = {
  vocabulary: "词汇型",
  structure: "结构型",
  mixed: "综合型",
} as const;

export const collocationTypeLabels = {
  collocation: "搭配",
  fixed_phrase: "固定短语",
  sentence_frame: "句型",
} as const;

export const partOfSpeechLabels: Record<string, string> = {
  noun: "名词",
  verb: "动词",
  adjective: "形容词",
  adverb: "副词",
  preposition: "介词",
  conjunction: "连词",
  pronoun: "代词",
  determiner: "限定词",
  phrase: "短语",
  other: "其他",
};

export function sourceDisplayLabel(answerOrigin: string, author: string, sourceName?: string) {
  if (answerOrigin === "published_language_textbook") return sourceName ?? "新概念英语 3";
  if (answerOrigin === "teacher_model") return /simon/i.test(author) ? "Simon 教师范文" : `${author} 教师范文`;
  if (answerOrigin === "official_scored_candidate") return "IELTS 官方考生作答";
  if (answerOrigin === "official_examiner_model") return "IELTS 官方示范作答";
  return author;
}

export function isLanguageRichnessSource(source: { answer_origin: string; content_role?: string }) {
  return source.content_role === "language_richness_corpus" || source.answer_origin === "published_language_textbook";
}

export function modelDisplayName(model: string) {
  return model.replace(/^deepseek(?=$|[-_])/i, "DeepSeek");
}
