import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cards = JSON.parse(fs.readFileSync(path.join(root, "data", "approved_cards.seed.json"), "utf8"));
const sources = JSON.parse(fs.readFileSync(path.join(root, "data", "source_essays.json"), "utf8"));
const sourceById = new Map(sources.map((source) => [source.id, source]));

const expectedCardIds = {
  3: "0b0ee530-2f77-5d25-a6cb-6baa331b7c26", 4: "4c1ff5ac-d150-537d-a5d6-8b0fd06fe278", 6: "4c4447fc-9bbf-5e22-8c85-ba8143f06a14", 7: "10f5261a-aa1f-540a-a06e-ced6247d7222", 8: "848db1ba-b554-5af3-9337-5ff5995cd850",
  10: "9f289ff7-319b-5763-9a3f-7a6a576c30d9", 11: "c32302d0-ea7c-5000-bc58-f971b91e0228", 12: "d0af186f-5278-5fa9-8fbc-b32d65f886d3", 13: "ab1f7ac2-ba9f-5187-acc4-9ccfdb49cc84", 17: "eaa247b6-6310-5ce8-9b8c-11cf02218239",
  19: "a73254eb-90b2-5e79-b902-036d6bb2850f", 20: "c8264aed-707b-5623-9868-22ee594988ed", 21: "ce476d52-f1cf-5f9b-8148-48054e35876e", 24: "b95d5410-a599-58db-897f-586aebe943f5", 25: "11181579-1073-58bc-923a-b9e42568f1c3",
  26: "80f573d9-ce96-5e2e-98f2-1a87bd051676", 27: "8a890de8-ad30-59d2-b08b-1fa9ff4d984f", 30: "4e5360fe-22bf-5d77-98ff-8db6f60350d2", 32: "0bcab9ce-aae9-5295-9de0-eae275382998", 34: "47cb32a0-3618-5aba-b384-7143221aa483",
  35: "62ef26bd-9bcd-5360-8f7b-8760af91a62c", 36: "6b235f55-92ff-50c5-b810-533af1d4a129", 39: "46c73496-5a73-555f-9e70-9ada1c6a927e", 47: "a405d61c-c842-586a-a615-804bd49a7cee", 48: "ee16ee95-bd1e-59b9-b44a-a8117493905f",
  49: "eac896dc-0f47-5980-b545-38698b320ebd", 50: "6b294668-2829-5a7e-a1af-605fede039eb", 52: "6672927e-67bc-52fc-a21d-973050c0fcd0", 55: "6f787792-feb9-5d16-b76b-043be58e358b", 56: "8794154b-7d2e-5776-b5de-6e77180eba66",
  58: "8508dfcf-3f1a-51e5-b0f9-0b6bb279f840", 63: "a75ef395-9bd6-5642-947d-c4d802850da0", 66: "243ac1fa-e7b8-58b9-ab1e-546442d913fa", 68: "94a7290d-2293-57f8-90a9-1993f112106f", 71: "c5133f81-0e4e-50ac-b903-7d93f37e621a",
  78: "aa548843-5fa7-5776-8a9f-cc8652886ed1", 80: "17b39b8e-269d-5fd8-a21c-d384afe71e83", 81: "82c6d65e-73c7-5294-a751-9382569e259e", 82: "2c3d7522-b93e-5bc5-956d-d8ef0f8a93df", 83: "55801fda-61a8-556a-be29-76f83ed93b5f",
  86: "7281e021-7d4b-5a07-aae9-ee19c891237e", 88: "c2c83fe5-e8af-5d0d-9287-d8b5efb68032", 93: "5b043b26-5234-5349-92a7-3881093bc61f", 97: "01399a5e-ba7e-54c2-804f-94389816f2ab", 100: "1f886f0e-0bea-5951-be96-c0f27bd4e568",
  101: "71901f65-0703-5778-b656-89591d62c4ef", 103: "60751b13-ae53-5285-aba2-8bb94c117b92", 105: "e2c085b2-50ec-5ae1-8ffa-ee0338d2ae59", 107: "a6266716-2bc0-5b5e-9ee1-81ff134a7478", 108: "1fdd8353-32af-530a-b89a-4362282f8be6",
  110: "7be623f0-7f42-5790-bebc-c0377146e616", 114: "31d3ee76-5a97-57e1-96b4-b866af4fa285", 115: "754d6f53-5f1a-542d-8021-484552c0923c", 118: "6c11ad46-33cf-541a-9d1d-fb11478e4471", 121: "615980cc-cea2-5729-bdaa-18553f972367",
  122: "d1a216a5-ab48-59f0-b6d7-57ad742c5a61", 123: "2fdbaf32-fdbb-5aa1-9cce-9de4c8c50d68", 124: "f15d70ed-10c6-5448-8f63-603421d1a7c9", 125: "38bea868-0bad-53b3-b0af-2854fe5766fd", 126: "0320e515-9b3c-570a-ae22-c540eea10537",
  128: "118a349e-93b7-52a5-a326-fae9ba1a814d", 130: "519ce1be-b51f-509c-aaf4-050882cc37d3", 131: "a6989730-082d-5532-b9d2-7e5845c1765e", 133: "c18ff589-91f6-537d-80c4-9ba3fb224da0", 134: "b1f62de6-adc4-5abd-800a-7d110ee07481",
  135: "629776ea-4656-5953-8de3-5fc0e6f7a3c0", 136: "934be959-cfa7-5b6f-ae39-95ad62e27a51", 137: "f2f33ee9-fe37-5058-9a4b-cb5d4433905e", 138: "9a643bc2-6768-56b8-802b-3b5014233ff7", 139: "9b91499e-cf46-5266-b45a-e3e3aec4de6d",
  141: "f35e3f6f-9589-537b-bd27-96fe8a10fdda", 143: "984ba355-94cf-5032-931f-521f04d0b6c0", 144: "881343c0-72a1-5798-8f11-04c108ca7484", 147: "527182d4-a2c8-5afe-bd80-37f1e12d782d", 148: "baaa0270-dbe9-5507-8f39-589b3d259192",
  149: "ec75144f-1ead-5dca-9cd0-5683a854b687", 150: "e08f236a-8d13-5948-9821-999f28b6ba47", 151: "90f615b0-91a4-5294-93dc-823f40a34388"
};

const expectedSourceIds = {
  0: "f9f35bf9-1bbe-5b2c-b490-a0bc12bf3542", 1: "ef5eef5b-bda2-5264-a3ff-ef73868668f8", 2: "4a4c8606-7614-5afa-9aed-357386ba9ccf", 3: "3484d64d-6290-5d09-b561-bbaf76ad422c",
  4: "0ada3747-afbf-5094-bdb0-8464c128186d", 5: "78de0558-7145-5e4e-9777-8333c42f854c", 6: "9d526adb-6712-5c12-b11c-e594c7449351", 7: "940c9ceb-de71-5661-a1d8-35de6f0161d2",
  8: "1e8f1de1-4d6f-4bdb-9f30-2ac4d1e4e901", 9: "6ced019f-a9b4-5b80-a0f7-e93faf73215f", 10: "351228c3-175f-53cf-a2be-ce9e3124e88d", 11: "e7833f0b-a5a3-5e6d-ab7f-f548b3281209",
  12: "a5e4fa97-436d-50f8-b551-e8cf4baeac75", 13: "16cad076-123e-51b3-8107-a9b8785ec47d", 14: "60d2f47f-70f4-5cb1-8abc-34ecb680e97a", 15: "5b71e1e9-cedb-54cd-9100-3d8dae2be1de",
  16: "ecec7ebf-5481-5015-966d-9f497ab6c488", 17: "88d5baae-3781-5417-ac4c-0b93b0eadcd9", 18: "43dfb4e0-6c10-5d39-9bbc-10074e19f849", 19: "3531cc70-67fb-52cc-9285-6f3cd34f8e30",
  20: "2f9a2ef2-5e70-4cea-8a41-3bd5e2f5fa02", 21: "cf75c032-d0d6-52b6-a414-3c433f69969e", 22: "0bbea91d-c006-5f3f-a74e-6b51761cfa01", 23: "9120627e-b077-526d-87af-e54fc32afd8e",
  24: "50f6c053-91e9-591a-934a-479dc5c70cc0", 25: "3a0b3f03-6f81-4dfb-ab52-4ce6f3060b13", 26: "f818b947-a185-5f22-ab25-08ce8eab264b", 27: "b8816581-fb18-5756-a135-125a665157d5"
};

const splitSentences = (paragraph) =>
  (paragraph.match(/[^.!?]+(?:[.!?]+(?:[”’"']+)?|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const sourceSentenceAt = (sourceIndex, paragraphIndex, sentenceIndex) => {
  const source = sources[sourceIndex];
  if (!source || source.id !== expectedSourceIds[sourceIndex]) {
    throw new Error(`Source order changed at index ${sourceIndex}`);
  }
  const paragraph = source.paragraphs.find((item) => item.paragraph_index === paragraphIndex);
  const sentence = paragraph ? splitSentences(paragraph.text)[sentenceIndex] : null;
  if (!sentence) throw new Error(`Unknown source sentence ${sourceIndex}:${paragraphIndex}:${sentenceIndex}`);
  return { source, sentence };
};

const roleLabels = {
  action: "要完成的动作", area: "被优先考虑的事物", cause: "原因或机制", change: "被比较的变化", cost: "成本或代价", degree: "程度修饰语",
  factor: "相关因素", field: "发展或研究领域", goal: "要实现的目标", group: "相关人群", idea: "被评价的观点", institution: "机构或经济体",
  need: "要满足的需要", object: "作用对象", option: "可选择的对象", outcome: "产生的结果", pressure_target: "承受压力的对象", problem: "要处理的问题",
  quality: "被提升或评价的品质", responsibility: "承担的责任", service: "服务、机会或资源", source: "影响来源", target: "行为指向的对象", value: "被重视的价值",
  person: "相关的人", activity: "行为或经历", market: "市场或领域", tradition: "传统或文化内容", threat_target: "受到影响的对象"
};

const cardSeeds = [
  { canonical: "be linked in part to", prompt: "在某种程度上与……有关", pattern: "be linked in part to {factor}", slots: { factor: ["poor sleep", "heavier traffic", "social isolation"] }, sources: [[3, "been linked in part to"]], grammar: "be linked in part to + 名词或动名词", note: "in part 限定关联程度，避免把相关关系写成绝对因果。" },
  { canonical: "a sedentary lifestyle", prompt: "久坐的生活方式", pattern: null, sources: [[3, "the sedentary lifestyle"]], type: "collocation", accepted: ["sedentary lifestyle"], priority: "supporting" },
  { canonical: "a compelling reason", prompt: "有说服力的理由", pattern: "a compelling reason to {action}", slots: { action: ["change the policy", "protect local habitats", "delay the decision"] }, sources: [[4, "compelling reason"]] },
  { canonical: "ensure the survival of", prompt: "确保……的生存／延续", pattern: "ensure the survival of {object}", slots: { object: ["endangered species", "local traditions", "small businesses"] }, sources: [[6, "ensures the survival of"]] },
  { canonical: "far outweigh the costs of", prompt: "远远超过……的成本", pattern: "far outweigh the costs of {action}", slots: { action: ["implementation", "conservation", "public investment"] }, sources: [[7, "far outweigh the costs of"]], error: "outweigh 本身已表示超过，不与 exceed 重复使用。" },
  { canonical: "maintain the natural balance", prompt: "维持自然平衡", pattern: null, sources: [[8, "maintain the natural balance"]], priority: "supporting" },
  { canonical: "career progression", prompt: "职业发展／晋升", pattern: null, sources: [[10, "career progression"]], priority: "supporting" },
  { canonical: "an improved quality of life", prompt: "改善后的生活质量", pattern: null, sources: [[10, "an improved quality of life"]], accepted: ["improved quality of life"], priority: "supporting" },
  { canonical: "knowledge and skill gaps", prompt: "知识与技能缺口", pattern: null, sources: [[11, "knowledge and skill gaps"]] },
  { canonical: "future prosperity", prompt: "未来的繁荣", pattern: null, sources: [[12, "future prosperity"]], priority: "supporting" },
  { canonical: "value one thing above another", prompt: "把……看得比……更重要", pattern: "value {value} above {option}", slots: { value: ["creativity", "long-term stability", "public welfare"], option: ["technical expertise", "short-term profit", "personal convenience"] }, sources: [[13, "value creative thinking skills above practical or technical skills"]], type: "sentence_frame" },
  { canonical: "dominate the market", prompt: "占据／主导市场", pattern: "dominate the {market}", slots: { market: ["global market", "domestic market", "online advertising market"] }, sources: [[19, "dominate the market"]] },
  { canonical: "depend on state subsidies", prompt: "依赖政府补贴", pattern: "depend on {source}", slots: { source: ["state subsidies", "private donations", "tourism revenue"] }, sources: [[20, "depend on state subsidies"]] },
  { canonical: "contribute to the economy", prompt: "为经济作出贡献", pattern: "contribute to {outcome}", slots: { outcome: ["economic growth", "social development", "environmental protection"] }, sources: [[21, "contribute to the economy of the host country"]] },
  { canonical: "a risk of insufficient funding for", prompt: "……资金不足的风险", pattern: "a risk of insufficient funding for {service}", slots: { service: ["building maintenance", "public healthcare", "research programmes"] }, sources: [[24, "a risk of insufficient funding for"]] },
  { canonical: "make every effort to", prompt: "尽一切努力去……", pattern: "make every effort to {action}", slots: { action: ["attract investment", "reduce waste", "protect vulnerable groups"] }, sources: [[25, "every effort should be made to"]], accepted: ["every effort should be made to"], grammar: "主动：make every effort to；被动：every effort should be made to" },
  { canonical: "pay a deposit", prompt: "支付定金／首付", pattern: null, sources: [[26, "pay a deposit"]], priority: "supporting" },
  { canonical: "pay a mortgage", prompt: "偿还房贷", pattern: null, sources: [[26, "pay a deposit and a mortgage"]], priority: "supporting" },
  { canonical: "count on", prompt: "依靠／指望……", pattern: "count on {person}", slots: { person: ["family members", "public services", "community support"] }, sources: [[27, "count on"]], type: "fixed_phrase", priority: "supporting" },
  { canonical: "consider it a priority to", prompt: "把做……视为优先事项", pattern: "consider it a priority to {action}", slots: { action: ["meet basic needs", "protect public health", "reduce inequality"] }, sources: [[30, "consider it a priority to"]], type: "sentence_frame" },
  { canonical: "job satisfaction", prompt: "工作满意度", pattern: null, sources: [[32, "job satisfaction"]], priority: "supporting" },
  { canonical: "professional achievements", prompt: "职业成就", pattern: null, sources: [[32, "professional achievements"]], priority: "supporting" },
  { canonical: "a limited amount of", prompt: "有限数量的……", pattern: "a limited amount of {object}", slots: { object: ["funding", "testing", "personal data"] }, sources: [[34, "a limited amount of"]], priority: "supporting" },
  { canonical: "measure the effectiveness of", prompt: "衡量……的有效性", pattern: "measure the effectiveness of {object}", slots: { object: ["a new policy", "a medical treatment", "the programme"] }, sources: [[35, "the effectiveness of a new drug can be measured"]], grammar: "可用主动 measure the effectiveness of，也可使用被动 the effectiveness of ... can be measured。" },
  { canonical: "subject someone to trauma", prompt: "使……遭受创伤", pattern: "subject {person} to {outcome}", slots: { person: ["animals", "children", "victims"], outcome: ["unnecessary trauma", "extreme stress", "public humiliation"] }, sources: [[36, "subject animals to this kind of trauma"]], error: "subject 在此结构中后接 to，不写成 subject someone with。" },
  { canonical: "a necessary evil", prompt: "不得已而为之的坏事", pattern: null, sources: [[39, "a necessary evil"]], type: "fixed_phrase" },
  { canonical: "have something to gain from", prompt: "能从……中获益", pattern: "have something to gain from {activity}", slots: { activity: ["international cooperation", "public consultation", "the reform"] }, sources: [[47, "has anything to gain from"]], accepted: ["have anything to gain from"], type: "sentence_frame" },
  { canonical: "go against the values of", prompt: "违背……的价值观", pattern: "go against the values of {group}", slots: { group: ["a fair society", "the local community", "the institution"] }, sources: [[48, "goes against the values of"]] },
  { canonical: "against one's will", prompt: "违背某人的意愿", pattern: null, sources: [[48, "against their will"]], accepted: ["against their will"], type: "fixed_phrase" },
  { canonical: "lead to resentment", prompt: "引发不满／怨恨", pattern: null, sources: [[49, "lead to resentment"]] },
  { canonical: "as a means of", prompt: "作为……的手段", pattern: "as a means of {activity}", slots: { activity: ["learning a language", "reducing emissions", "building trust"] }, sources: [[50, "as a means of"]], type: "fixed_phrase" },
  { canonical: "arouse emotions", prompt: "唤起情感", pattern: "arouse {outcome}", slots: { outcome: ["strong emotions", "public concern", "people's curiosity"] }, sources: [[52, "arouses emotions"]] },
  { canonical: "take steps to mitigate", prompt: "采取措施缓解……", pattern: "take steps to mitigate {problem}", slots: { problem: ["potential risks", "climate change", "social inequality"] }, sources: [[55, "take steps to mitigate"]] },
  { canonical: "be eligible to receive", prompt: "有资格获得……", pattern: "be eligible to receive {service}", slots: { service: ["a pension", "financial support", "public housing"] }, sources: [[56, "be eligible to receive"]], grammar: "eligible 后接 to do，不能写成 eligible for receive。" },
  { canonical: "a rise in demand for", prompt: "对……需求的上升", pattern: "a rise in demand for {service}", slots: { service: ["healthcare", "housing", "skilled workers"] }, sources: [[58, "a rise in the demand for"], [136, "a rise in demand for"]], accepted: ["a rise in the demand for"] },
  { canonical: "have an obligation to", prompt: "有义务去……", pattern: "have an obligation to {action}", slots: { action: ["help vulnerable people", "protect personal data", "reduce pollution"] }, sources: [[63, "have an obligation to"]] },
  { canonical: "those in need", prompt: "需要帮助的人", pattern: null, sources: [[66, "those who are in need"]], accepted: ["those who are in need"], type: "fixed_phrase", priority: "supporting" },
  { canonical: "share common interests", prompt: "拥有共同兴趣", pattern: "share common {object}", slots: { object: ["interests", "goals", "concerns"] }, sources: [[68, "share common interests"]] },
  { canonical: "a poor substitute for", prompt: "……的拙劣替代品", pattern: "a poor substitute for {object}", slots: { object: ["real interaction", "professional care", "practical experience"] }, sources: [[71, "a poor substitute for"]] },
  { canonical: "pursue a university degree", prompt: "攻读大学学位", pattern: "pursue a {object}", slots: { object: ["university degree", "professional qualification", "career in medicine"] }, sources: [[78, "pursue a university degree"]] },
  { canonical: "harm the prospects of", prompt: "损害……的前景", pattern: "harm the prospects of {group}", slots: { group: ["young workers", "small businesses", "future generations"] }, sources: [[80, "harm the prospects of"]] },
  { canonical: "be in conflict with", prompt: "与……相冲突", pattern: "be in conflict with {idea}", slots: { idea: ["individual freedom", "public safety", "environmental goals"] }, sources: [[81, "in conflict with"]] },
  { canonical: "reach one's potential", prompt: "发挥某人的潜能", pattern: "reach one's {goal}", slots: { goal: ["full potential", "academic potential", "professional potential"] }, sources: [[82, "reach their potential"]], accepted: ["reach their potential"] },
  { canonical: "the odds are stacked in favour of", prompt: "成功机会偏向……", pattern: "the odds are stacked in favour of {group}", slots: { group: ["wealthier applicants", "large companies", "urban residents"] }, sources: [[83, "the odds of success were stacked in favour of"]], accepted: ["the odds of success were stacked in favour of"], type: "sentence_frame" },
  { canonical: "base admission on", prompt: "把录取建立在……基础上", pattern: "base admission on {area}", slots: { area: ["academic merit", "gender", "relevant experience"] }, sources: [[86, "base admission to university courses on"]] },
  { canonical: "be based on merit", prompt: "以能力／表现为依据", pattern: "be based on {area}", slots: { area: ["merit", "evidence", "individual need"] }, sources: [[88, "be based on merit"]] },
  { canonical: "face the dilemma of whether to", prompt: "面临是否要……的两难选择", pattern: "face the dilemma of whether to {action}", slots: { action: ["work or study", "expand or consolidate", "regulate or encourage innovation"] }, sources: [[93, "face the dilemma of whether to"]], type: "sentence_frame" },
  { canonical: "a competitive job market", prompt: "竞争激烈的就业市场", pattern: null, sources: [[97, "the job market is becoming increasingly competitive", "The job market is becoming increasingly competitive"], [148, "competitive job market"]], accepted: ["competitive job market"], priority: "supporting" },
  { canonical: "rich cultural diversity", prompt: "丰富的文化多样性", pattern: null, sources: [[100, "rich cultural diversity"]], priority: "supporting" },
  { canonical: "preserve traditions and customs", prompt: "保护／延续传统与习俗", pattern: "preserve {tradition}", slots: { tradition: ["traditions and customs", "minority languages", "cultural heritage"] }, sources: [[101, "preserve traditions, customs and behaviours"]] },
  { canonical: "have a devastating effect on", prompt: "对……产生毁灭性影响", pattern: "have a devastating effect on {threat_target}", slots: { threat_target: ["local ecosystems", "public health", "the regional economy"] }, sources: [[103, "have a devastating effect on"]] },
  { canonical: "limit emissions from", prompt: "限制来自……的排放", pattern: "limit emissions from {source}", slots: { source: ["factories", "private vehicles", "power stations"] }, sources: [[105, "limit emissions from"]] },
  { canonical: "take responsibility for", prompt: "为……承担责任", pattern: "take responsibility for {responsibility}", slots: { responsibility: ["environmental damage", "personal decisions", "employee welfare"] }, sources: [[107, "take responsibility for"]] },
  { canonical: "play one's part in", prompt: "在……中尽自己的一份力", pattern: "play one's part in {activity}", slots: { activity: ["protecting the environment", "supporting the community", "reducing waste"] }, sources: [[108, "play their part in"]], accepted: ["play their part in"] },
  { canonical: "derive a sense of satisfaction from", prompt: "从……中获得满足感", pattern: "derive a sense of satisfaction from {activity}", slots: { activity: ["helping others", "professional achievement", "creative work"] }, sources: [[110, "derive a sense of satisfaction from"]] },
  { canonical: "live in complete isolation", prompt: "完全与世隔绝地生活", pattern: null, sources: [[114, "live in complete isolation"]], priority: "supporting" },
  { canonical: "act as a deterrent", prompt: "起到威慑作用", pattern: "act as a deterrent to {activity}", slots: { activity: ["dangerous driving", "tax avoidance", "violent crime"] }, sources: [[115, "act as a deterrent"]] },
  { canonical: "deter someone from doing something", prompt: "阻止／威慑某人做某事", pattern: "deter {person} from {activity}", slots: { person: ["drivers", "young people", "companies"], activity: ["speeding", "committing crimes", "breaking the rules"] }, sources: [[118, "deter people from driving too quickly"], [143, "deter teenagers from committing crimes"]], type: "sentence_frame" },
  { canonical: "cover running costs", prompt: "支付日常运营成本", pattern: "cover {cost}", slots: { cost: ["running costs", "maintenance costs", "basic expenses"] }, sources: [[121, "cover its running costs"]] },
  { canonical: "meet the changing needs of", prompt: "满足……不断变化的需求", pattern: "meet the changing needs of {group}", slots: { group: ["customers", "older citizens", "the labour market"] }, sources: [[122, "meet the changing needs of"]] },
  { canonical: "with the sole aim of", prompt: "唯一目的是……", pattern: "with the sole aim of {activity}", slots: { activity: ["maximising profit", "winning votes", "reducing costs"] }, sources: [[123, "with the sole aim of"]], type: "fixed_phrase" },
  { canonical: "have a role to play in", prompt: "在……中可以发挥作用", pattern: "have a role to play in {activity}", slots: { activity: ["supporting communities", "protecting consumers", "reducing inequality"] }, sources: [[123, "have a wider role to play in"]], accepted: ["have a wider role to play in"] },
  { canonical: "use accounting loopholes", prompt: "利用会计漏洞", pattern: null, sources: [[124, "using accounting loopholes"]], accepted: ["using accounting loopholes"], priority: "supporting" },
  { canonical: "place importance on", prompt: "重视……", pattern: "place importance on {value}", slots: { value: ["social responsibility", "long-term planning", "employee wellbeing"] }, sources: [[125, "place as much importance on"]], accepted: ["place as much importance on"], group: "importance-on", mergeConfidence: "medium", dedupNote: "与 attach great importance to 意义接近，但动词、介词和比较结构不同，建议保持独立并人工复核。", uncertainties: ["是否与 attach great importance to 合并为同一表达族需人工确认。"] },
  { canonical: "the cost of living", prompt: "生活成本", pattern: null, sources: [[126, "the cost of living"]], essaySources: [[2, 1, 1, "the cost of living"]], priority: "supporting" },
  { canonical: "take steps to tackle", prompt: "采取措施解决……", pattern: "take steps to tackle {problem}", slots: { problem: ["urban poverty", "air pollution", "skills shortages"] }, sources: [[128, "steps that governments could take to tackle"]], accepted: ["take steps to tackle"], group: "take-steps-response", mergeConfidence: "medium", dedupNote: "与 take steps to mitigate 共享框架，但 tackle 与 mitigate 的力度和搭配对象不同。", uncertainties: ["需确认是否只做表达族关联而不合并。"] },
  { canonical: "reduce pressure on", prompt: "减轻……的压力", pattern: "reduce pressure on {pressure_target}", slots: { pressure_target: ["major cities", "public services", "natural resources"] }, sources: [[130, "reduce the pressure on"]], accepted: ["reduce the pressure on"] },
  { canonical: "in equal measure", prompt: "同等程度地", pattern: null, sources: [[131, "in equal measure"]], type: "fixed_phrase" },
  { canonical: "a host of", prompt: "大量／许多……", pattern: "a host of {object}", slots: { object: ["practical problems", "local businesses", "social benefits"] }, sources: [[17, "a host of"], [133, "a whole host of"]], accepted: ["a whole host of"], type: "fixed_phrase", priority: "supporting" },
  { canonical: "consider something from the opposite angle", prompt: "从相反角度看待……", pattern: "consider {idea} from the opposite angle", slots: { idea: ["the policy", "the trend", "the same evidence"] }, sources: [[134, "considered from the opposite angle"]], accepted: ["considered from the opposite angle"], type: "sentence_frame" },
  { canonical: "bear the weight of", prompt: "承担……的沉重负担", pattern: "bear the weight of {responsibility}", slots: { responsibility: ["household bills", "public expectations", "financial responsibility"] }, sources: [[135, "bear the weight of"]] },
  { canonical: "push up property prices", prompt: "推高房价", pattern: "push up {cost}", slots: { cost: ["property prices", "rents", "production costs"] }, sources: [[136, "push up property prices"]] },
  { canonical: "be faced with rising costs", prompt: "面临不断上涨的成本", pattern: "be faced with rising {cost}", slots: { cost: ["living costs", "energy costs", "transport costs"] }, sources: [[137, "be faced with rising living costs"]], accepted: ["be faced with rising living costs"] },
  { canonical: "speak from experience", prompt: "根据亲身经历来说", pattern: null, sources: [[138, "speak from experience"]], type: "fixed_phrase" },
  { canonical: "dispel the idea that", prompt: "消除……这种想法", pattern: "dispel the idea that {idea}", slots: { idea: ["crime is glamorous", "success comes easily", "the policy has no cost"] }, sources: [[139, "dispel any ideas that"]], accepted: ["dispel any ideas that"], type: "sentence_frame" },
  { canonical: "have a powerful impact", prompt: "产生强大的影响", pattern: "have a powerful impact on {target}", slots: { target: ["young people", "public opinion", "consumer behaviour"] }, sources: [[141, "have a powerful impact"]] },
  { canonical: "turn one's life around", prompt: "彻底改变某人的人生", pattern: null, sources: [[143, "turned their lives around"]], accepted: ["turn their lives around"], type: "fixed_phrase" },
  { canonical: "serve a prison sentence", prompt: "服刑", pattern: null, sources: [[143, "serving a prison sentence"]], accepted: ["serving a prison sentence"], priority: "supporting" },
  { canonical: "be incompatible with the needs of", prompt: "与……的需求不相容", pattern: "be incompatible with the needs of {group}", slots: { group: ["younger people", "local communities", "the modern workplace"] }, sources: [[144, "incompatible with the needs of"]] },
  { canonical: "a disparity between generations", prompt: "代际差异", pattern: "a disparity between {group}", slots: { group: ["generations", "income groups", "urban and rural areas"] }, sources: [[147, "the greatest disparity between the generations"]], accepted: ["disparity between the generations"] },
  { canonical: "attach great importance to", prompt: "高度重视……", pattern: "attach great importance to {value}", slots: { value: ["hard work", "social stability", "academic achievement"] }, sources: [[148, "attach great importance to"]], group: "importance-on", mergeConfidence: "medium", dedupNote: "与 place importance on 意义接近，但固定动词和介词不同，建议保持独立并建立表达族。", uncertainties: ["是否与 place importance on 合并需人工确认。"] },
  { canonical: "take pride in", prompt: "为……感到自豪", pattern: "take pride in {activity}", slots: { activity: ["one's work", "local traditions", "professional standards"] }, sources: [[148, "taking pride in"]], accepted: ["taking pride in"] },
  { canonical: "come into contact with", prompt: "与……接触", pattern: "come into contact with {person}", slots: { person: ["people from different backgrounds", "new ideas", "harmful substances"] }, sources: [[149, "come into contact with"]] },
  { canonical: "treat someone with respect", prompt: "尊重地对待……", pattern: "treat {person} with respect", slots: { person: ["colleagues", "older people", "members of the public"] }, sources: [[149, "treat others with respect"]] },
  { canonical: "a sense of community", prompt: "社区归属感", pattern: null, sources: [[150, "a more ‘old-fashioned’ sense of community"]], accepted: ["sense of community"], priority: "supporting" },
  { canonical: "dismiss something as irrelevant", prompt: "把……斥为无关紧要", pattern: "dismiss {idea} as irrelevant", slots: { idea: ["traditional ideas", "public concerns", "the evidence"] }, sources: [[151, "dismiss all traditional ideas as irrelevant"]], type: "sentence_frame" }
];

const sourceOnlySeeds = [
  { canonical: "promote local film-making", prompt: "推动本地电影制作", pattern: "promote {activity}", slots: { activity: ["local film-making", "cultural exchange", "public participation"] }, essaySources: [[0, 0, 1, "promote local film-making"]], priority: "supporting" },
  { canonical: "have a huge budget for", prompt: "为……投入巨额预算", pattern: "have a huge budget for {activity}", slots: { activity: ["special effects", "public infrastructure", "scientific research"] }, essaySources: [[0, 1, 1, "have huge budgets for"]], accepted: ["have huge budgets for"] },
  { canonical: "global appeal", prompt: "全球吸引力", pattern: null, essaySources: [[0, 1, 2, "the global appeal"]], accepted: ["the global appeal"], priority: "supporting" },
  { canonical: "suffer in comparison", prompt: "相比之下显得逊色", pattern: "suffer in comparison with {comparison}", slots: { comparison: ["foreign competitors", "larger institutions", "better-funded alternatives"] }, essaySources: [[0, 1, 4, "suffers in comparison"]], accepted: ["suffers in comparison"] },
  { canonical: "be funded by government subsidies", prompt: "由政府补贴资助", pattern: "be funded by {source}", slots: { source: ["government subsidies", "private donations", "tourism revenue"] }, essaySources: [[0, 2, 4, "were partly funded by government subsidies"]], accepted: ["be partly funded by government subsidies"] },

  { canonical: "be charged more than", prompt: "被收取高于……的费用", pattern: "be charged more than {comparison}", slots: { comparison: ["local residents", "other customers", "the standard rate"] }, essaySources: [[1, 0, 0, "should be charged more than"]], accepted: ["should be charged more than"] },
  { canonical: "a shortsighted view", prompt: "目光短浅的观点", pattern: null, essaySources: [[1, 1, 1, "a very shortsighted view"]], accepted: ["a very shortsighted view"], priority: "supporting" },

  { canonical: "rely on someone for help", prompt: "依靠某人的帮助", pattern: "rely on {person} for {service}", slots: { person: ["parents", "local charities", "public agencies"], service: ["financial help", "practical advice", "emergency support"] }, essaySources: [[2, 1, 2, "rely on their parents for help"]], accepted: ["rely on their parents for help"] },
  { canonical: "quality of life", prompt: "生活质量", pattern: null, essaySources: [[2, 1, 4, "a better quality of life"]], accepted: ["a better quality of life"], group: "quality-of-life", mergeConfidence: "medium", dedupNote: "与 an improved quality of life 共享核心名词搭配，但修饰语承担不同语义。", uncertainties: ["需与 an improved quality of life 一并审核粒度。"], priority: "supporting" },
  { canonical: "depend on support from", prompt: "依赖来自……的支持", pattern: "depend on support from {source}", slots: { source: ["family members", "local authorities", "charitable organisations"] }, essaySources: [[2, 1, 5, "depend on support from"]] },
  { canonical: "have the freedom to", prompt: "有做……的自由", pattern: "have the freedom to {action}", slots: { action: ["choose a career", "travel abroad", "express an opinion"] }, essaySources: [[2, 2, 2, "have more freedom to"]], accepted: ["have more freedom to"], type: "fixed_phrase" },

  { canonical: "the key consideration", prompt: "首要考虑因素", pattern: null, essaySources: [[3, 0, 1, "the key consideration"]], priority: "supporting" },
  { canonical: "meet one's basic needs", prompt: "满足基本生活需要", pattern: "meet {person} basic needs", slots: { person: ["their", "children's", "older people's"] }, essaySources: [[3, 1, 0, "meet their basic needs"]], accepted: ["meet their basic needs"] },
  { canonical: "choose a career path", prompt: "选择职业道路", pattern: "choose a {object}", slots: { object: ["career path", "field of study", "long-term goal"] }, essaySources: [[3, 1, 4, "choosing a career path"]], accepted: ["choosing a career path"] },
  { canonical: "raise a family", prompt: "养育家庭／子女", pattern: null, essaySources: [[3, 1, 4, "raise a family"]], priority: "supporting" },
  { canonical: "make a huge difference to", prompt: "对……产生巨大影响", pattern: "make a huge difference to {target}", slots: { target: ["workers' wellbeing", "educational outcomes", "the local economy"] }, essaySources: [[3, 2, 2, "make a huge difference to"]] },
  { canonical: "contribute something positive to society", prompt: "为社会作出积极贡献", pattern: "contribute something positive to {target}", slots: { target: ["society", "the local community", "public debate"] }, essaySources: [[3, 2, 4, "contribute something positive to society"]] },

  { canonical: "be cleared for human use", prompt: "获准供人类使用", pattern: "be cleared for {purpose}", slots: { purpose: ["human use", "public release", "clinical testing"] }, essaySources: [[4, 0, 0, "cleared for human use"]] },
  { canonical: "ethical arguments against", prompt: "反对……的伦理论据", pattern: "ethical arguments against {idea}", slots: { idea: ["animal experimentation", "capital punishment", "genetic screening"] }, essaySources: [[4, 1, 0, "ethical arguments against"]] },
  { canonical: "a reliable alternative to", prompt: "……的可靠替代方案", pattern: "a reliable alternative to {object}", slots: { object: ["animal testing", "private transport", "fossil fuels"] }, essaySources: [[4, 2, 0, "reliable alternatives to"]], accepted: ["reliable alternatives to"] },

  { canonical: "government support for", prompt: "政府对……的支持", pattern: "government support for {object}", slots: { object: ["artists", "local businesses", "public transport"] }, essaySources: [[5, 0, 1, "government support for"]], priority: "supporting" },
  { canonical: "be spent on", prompt: "被用于……", pattern: "be spent on {service}", slots: { service: ["education", "public healthcare", "transport infrastructure"] }, essaySources: [[5, 2, 2, "be spent on"]], type: "fixed_phrase", priority: "supporting" },
  { canonical: "alternative sources of financial support", prompt: "其他资金支持来源", pattern: null, essaySources: [[5, 3, 0, "alternative sources of financial support"]], priority: "supporting" },

  { canonical: "on a volunteer basis", prompt: "以志愿方式", pattern: null, essaySources: [[6, 0, 0, "on a volunteer basis"]], type: "fixed_phrase" },
  { canonical: "society as a whole", prompt: "整个社会", pattern: null, essaySources: [[6, 0, 0, "society as a whole"]], type: "fixed_phrase", priority: "supporting" },

  { canonical: "a rich variety of", prompt: "种类丰富的……", pattern: "a rich variety of {object}", slots: { object: ["musical styles", "cultural traditions", "learning resources"] }, essaySources: [[7, 0, 0, "a rich variety of"]] },
  { canonical: "throughout one's life", prompt: "贯穿某人的一生", pattern: null, essaySources: [[7, 1, 0, "throughout our lives"]], accepted: ["throughout our lives"], type: "fixed_phrase", priority: "supporting" },
  { canonical: "be given more importance than", prompt: "比……受到更多重视", pattern: "be given more importance than {comparison}", slots: { comparison: ["short-term profit", "personal convenience", "international trends"] }, essaySources: [[7, 3, 0, "should be given more importance than"]], accepted: ["should be given more importance than"], group: "importance-on", mergeConfidence: "medium", dedupNote: "与 place/attach importance on 属同一意义族，但被动比较框架不同。", uncertainties: ["保留独立框架还是仅作表达族关联，需人工确认。"] },

  { canonical: "improve motor skills", prompt: "提升动作技能", pattern: "improve {skill}", slots: { skill: ["motor skills", "communication skills", "problem-solving skills"] }, essaySources: [[8, 1, 3, "improve users’ motor skills"]], accepted: ["improve users’ motor skills"], priority: "supporting" },
  { canonical: "prepare someone for real-world tasks", prompt: "使某人为现实任务做好准备", pattern: "prepare {person} for {activity}", slots: { person: ["students", "trainees", "young people"], activity: ["real-world tasks", "future employment", "independent living"] }, essaySources: [[8, 1, 3, "prepare them for real-world tasks"]], accepted: ["prepare them for real-world tasks"] },
  { canonical: "be outweighed by the drawbacks", prompt: "被缺点所抵消／压过", pattern: "be outweighed by {comparison}", slots: { comparison: ["the drawbacks", "the financial costs", "the long-term risks"] }, essaySources: [[8, 2, 0, "are outweighed by the drawbacks"]], accepted: ["be outweighed by drawbacks", "are outweighed by the drawbacks"] },
  { canonical: "be highly addictive", prompt: "极易使人上瘾", pattern: null, essaySources: [[8, 2, 1, "be highly addictive"]], priority: "supporting" },
  { canonical: "progress through the levels of", prompt: "逐级通过……的关卡", pattern: "progress through the levels of {object}", slots: { object: ["a game", "a training programme", "a qualification"] }, essaySources: [[8, 2, 2, "progress through the levels of"]], priority: "supporting" },

  { canonical: "increase the retirement age", prompt: "提高退休年龄", pattern: "increase the {object}", slots: { object: ["retirement age", "minimum wage", "tax threshold"] }, essaySources: [[9, 2, 1, "increase the retirement age"]] },
  { canonical: "a productive working life", prompt: "富有成效的职业生涯", pattern: null, essaySources: [[9, 2, 2, "a productive working life"]], priority: "supporting" },
  { canonical: "take measures to tackle", prompt: "采取措施处理……", pattern: "take measures to tackle {problem}", slots: { problem: ["population ageing", "air pollution", "housing shortages"] }, essaySources: [[9, 3, 0, "measures can be taken to tackle"]], accepted: ["measures can be taken to tackle"], group: "take-steps-response", mergeConfidence: "medium", dedupNote: "与 take steps to tackle 意义高度接近，但名词搭配形式不同。", uncertainties: ["需决定与 take steps to tackle 合并还是保留 accepted 变体。"] },

  { canonical: "in a variety of ways", prompt: "以多种方式", pattern: null, essaySources: [[10, 1, 3, "in a variety of ways"]], type: "fixed_phrase", priority: "supporting" },

  { canonical: "have an influence on", prompt: "对……产生影响", pattern: "have an influence on {target}", slots: { target: ["communication", "consumer choices", "public opinion"] }, essaySources: [[11, 0, 0, "have had an influence on"]], accepted: ["have had an influence on"] },
  { canonical: "have an impact on", prompt: "对……造成影响", pattern: "have an impact on {target}", slots: { target: ["relationships", "health outcomes", "the environment"] }, essaySources: [[11, 1, 0, "has had an impact on"]], accepted: ["has had an impact on"] },
  { canonical: "create new possibilities for", prompt: "为……创造新的可能", pattern: "create new possibilities for {target}", slots: { target: ["distance learning", "international cooperation", "flexible employment"] }, essaySources: [[11, 1, 2, "create new possibilities for"]] },
  { canonical: "discourage real interaction", prompt: "阻碍真实互动", pattern: "discourage {activity}", slots: { activity: ["real interaction", "public participation", "independent thought"] }, essaySources: [[11, 2, 3, "discouraging real interaction"]], accepted: ["discouraging real interaction"] },

  { canonical: "present a challenge", prompt: "构成挑战", pattern: "present {degree} a challenge", slots: { degree: ["more of", "something of", "a considerable"] }, essaySources: [[12, 0, 0, "present more of a challenge"]], accepted: ["present more of a challenge"] },
  { canonical: "require little equipment", prompt: "几乎不需要设备", pattern: "require {degree} equipment", slots: { degree: ["very little", "specialist", "expensive"] }, essaySources: [[12, 1, 2, "requires very little equipment"]], accepted: ["requires very little equipment"], priority: "supporting" },
  { canonical: "a high level of expertise", prompt: "高水平的专业能力", pattern: "a high level of {skill}", slots: { skill: ["expertise", "technical knowledge", "self-discipline"] }, essaySources: [[12, 2, 2, "a high level of knowledge and expertise"]], accepted: ["a high level of knowledge and expertise"] },
  { canonical: "become competent at", prompt: "逐渐熟练掌握……", pattern: "become competent at {activity}", slots: { activity: ["film editing", "academic writing", "data analysis"] }, essaySources: [[12, 2, 3, "became competent at"]], accepted: ["became competent at"] },

  { canonical: "with regard to", prompt: "关于／就……而言", pattern: "with regard to {idea}", slots: { idea: ["personal success", "public spending", "environmental policy"] }, essaySources: [[13, 1, 0, "with regard to"]], type: "fixed_phrase", priority: "supporting" },
  { canonical: "a positive relationship between", prompt: "……之间的正向关系", pattern: "a positive relationship between {factor} and {outcome}", slots: { factor: ["equality", "education", "public trust"], outcome: ["personal success", "social mobility", "economic growth"] }, essaySources: [[13, 3, 0, "a positive relationship between"]] },
  { canonical: "waste an opportunity", prompt: "浪费一次机会", pattern: "waste {object}", slots: { object: ["an opportunity", "public resources", "valuable time"] }, essaySources: [[13, 2, 3, "wasted their opportunity"]], accepted: ["wasted their opportunity"], priority: "supporting" },

  { canonical: "equal educational opportunities", prompt: "平等的受教育机会", pattern: null, essaySources: [[14, 0, 0, "the same educational opportunities"]], accepted: ["the same educational opportunities"], priority: "supporting" },
  { canonical: "aim for equal proportions", prompt: "以比例相等为目标", pattern: "aim for {outcome}", slots: { outcome: ["equal proportions", "balanced representation", "long-term stability"] }, essaySources: [[14, 1, 3, "aim for equal proportions"]] },
  { canonical: "according to one's qualifications", prompt: "根据某人的资历", pattern: "according to {person} qualifications", slots: { person: ["their", "applicants'", "employees'"] }, essaySources: [[14, 2, 1, "according to their qualifications"]], accepted: ["according to their qualifications"], type: "fixed_phrase", priority: "supporting" },
  { canonical: "achieve good grades", prompt: "取得好成绩", pattern: null, essaySources: [[14, 2, 2, "achieve good grades"]], priority: "supporting" },

  { canonical: "put emphasis on", prompt: "把重点放在……", pattern: "put {degree} emphasis on {value}", slots: { degree: ["more", "greater", "particular"], value: ["enjoyment", "practical skills", "long-term outcomes"] }, essaySources: [[15, 1, 2, "put more of an emphasis on"]], accepted: ["put more of an emphasis on"], group: "emphasis-on", mergeConfidence: "medium", dedupNote: "canonical 省略可变限定语，原文含 more of an。", uncertainties: ["需确认 canonical 是否改为 put more emphasis on。"] },
  { canonical: "play an important role in", prompt: "在……中发挥重要作用", pattern: "play an important role in {activity}", slots: { activity: ["public education", "community development", "protecting cultural heritage"] }, essaySources: [[15, 2, 4, "play an important role in"]], group: "role-in", mergeConfidence: "medium", dedupNote: "与 have a role to play in 同义但语法框架不同。", uncertainties: ["建议保留独立表达并建立表达族，待人工确认。"] },

  { canonical: "straight after school", prompt: "中学毕业后立即", pattern: null, essaySources: [[16, 0, 1, "straight after school"]], type: "fixed_phrase", priority: "supporting" },
  { canonical: "gain real experience", prompt: "获得真实工作经验", pattern: "gain {object}", slots: { object: ["real experience", "practical knowledge", "professional confidence"] }, essaySources: [[16, 1, 4, "gain real experience"]] },
  { canonical: "learn practical skills", prompt: "学习实用技能", pattern: "learn {skill}", slots: { skill: ["practical skills", "technical skills", "communication skills"] }, essaySources: [[16, 1, 4, "learn practical skills"]], priority: "supporting" },
  { canonical: "a successful career", prompt: "成功的职业生涯", pattern: null, essaySources: [[16, 1, 5, "a successful career"]], priority: "supporting" },
  { canonical: "continue one's studies", prompt: "继续学业", pattern: null, essaySources: [[16, 2, 0, "continue their studies"]], accepted: ["continue their studies"], priority: "supporting" },
  { canonical: "academic qualifications", prompt: "学历／学术资质", pattern: null, essaySources: [[16, 2, 1, "academic qualifications"]], priority: "supporting" },
  { canonical: "be more likely to", prompt: "更有可能……", pattern: "be more likely to {action}", slots: { action: ["find stable work", "adopt healthier habits", "support the policy"] }, essaySources: [[16, 3, 0, "are more likely to"]], accepted: ["are more likely to"], type: "fixed_phrase", priority: "supporting" },

  { canonical: "be better spent on", prompt: "更适合用于……", pattern: "be better spent on {service}", slots: { service: ["public healthcare", "teacher training", "transport infrastructure"] }, essaySources: [[17, 1, 2, "be better spent on"]] },
  { canonical: "cut costs related to", prompt: "削减与……相关的成本", pattern: "cut costs related to {activity}", slots: { activity: ["translation", "administration", "energy use"] }, essaySources: [[17, 1, 4, "cut all kinds of costs related to"]], accepted: ["cut costs related to"] },
  { canonical: "be less widely spoken", prompt: "使用范围较小", pattern: null, essaySources: [[17, 2, 0, "are less widely spoken"]], accepted: ["are less widely spoken"], priority: "supporting" },

  { canonical: "take steps to reduce", prompt: "采取措施减少……", pattern: "take steps to reduce {problem}", slots: { problem: ["environmental damage", "household waste", "social inequality"] }, essaySources: [[18, 0, 0, "take steps to reduce"]], group: "take-steps-response", mergeConfidence: "medium", dedupNote: "与 tackle/mitigate 共享 take steps to 框架，但后接动词及语义力度不同。", uncertainties: ["建议只建立表达族，不直接合并，待人工确认。"] },
  { canonical: "address environmental problems", prompt: "应对环境问题", pattern: "address {problem}", slots: { problem: ["environmental problems", "skills shortages", "public health risks"] }, essaySources: [[18, 0, 1, "address these problems"]], accepted: ["address these problems"] },
  { canonical: "make more effort to", prompt: "更加努力去……", pattern: "make more effort to {action}", slots: { action: ["reduce pollution", "support vulnerable groups", "enforce the rules"] }, essaySources: [[18, 2, 0, "make more effort to"]], group: "effort-to", mergeConfidence: "medium", dedupNote: "与 make every effort to 结构相近，但 more 表比较、every 表最大程度。", uncertainties: ["需与 make every effort to 分组审核。"] },
  { canonical: "impose taxes on", prompt: "对……征税", pattern: "impose {object} on {target}", slots: { object: ["taxes", "strict limits", "financial penalties"], target: ["drivers", "polluting industries", "high-income households"] }, essaySources: [[18, 2, 2, "impose ‘green taxes’ on"]], accepted: ["impose green taxes on"] },
  { canonical: "take public transport", prompt: "乘坐公共交通", pattern: null, essaySources: [[18, 3, 1, "take public transport"]], priority: "supporting" },

  { canonical: "take pleasure in", prompt: "从……中获得乐趣", pattern: "take pleasure in {activity}", slots: { activity: ["creative work", "helping others", "learning new skills"] }, essaySources: [[19, 1, 1, "from which we take pleasure"]], accepted: ["take pleasure from"], grammar: "常用 take pleasure in doing；原文使用 from which ... take pleasure。" },
  { canonical: "a sense of purpose in life", prompt: "生活的目标感", pattern: null, essaySources: [[19, 2, 4, "a sense of purpose in life"]], priority: "supporting" },
  { canonical: "fulfil basic needs", prompt: "满足基本需求", pattern: "fulfil {need}", slots: { need: ["basic needs", "legal obligations", "social responsibilities"] }, essaySources: [[19, 3, 0, "basic needs for shelter, food and company need to be fulfilled"]], accepted: ["basic needs need to be fulfilled"] },

  { canonical: "for the benefit of", prompt: "为了……的利益", pattern: "for the benefit of {group}", slots: { group: ["humans", "future generations", "the local community"] }, essaySources: [[20, 1, 1, "for the benefit of humans"]], accepted: ["for the benefit of humans"], type: "fixed_phrase" },
  { canonical: "have the right to", prompt: "有权做……", pattern: "have the right to {action}", slots: { action: ["make personal choices", "access education", "express an opinion"] }, essaySources: [[20, 1, 1, "have the right to"], [25, 3, 0, "have the right to"]], type: "fixed_phrase" },
  { canonical: "encourage the extinction of", prompt: "助长……的灭绝", pattern: "encourage the extinction of {object}", slots: { object: ["a species", "minority languages", "local traditions"] }, essaySources: [[20, 1, 1, "encourage the extinction of"]], priority: "supporting" },
  { canonical: "exist side by side with", prompt: "与……共存", pattern: "exist side by side with {object}", slots: { object: ["wild animals", "different cultures", "new technologies"] }, essaySources: [[20, 1, 4, "exist side by side with"]] },
  { canonical: "a waste of resources", prompt: "对资源的浪费", pattern: null, essaySources: [[20, 2, 0, "a waste of resources"]], priority: "supporting" },
  { canonical: "absorb carbon dioxide", prompt: "吸收二氧化碳", pattern: null, essaySources: [[20, 2, 2, "absorb carbon dioxide"]], priority: "supporting" },
  { canonical: "do everything one can to", prompt: "尽己所能去……", pattern: "do everything one can to {action}", slots: { action: ["protect wildlife", "reduce waste", "support a family"] }, essaySources: [[20, 3, 0, "do everything we can to"]], accepted: ["do everything we can to"], type: "sentence_frame" },

  { canonical: "a range of measures", prompt: "一系列措施", pattern: "a range of {object}", slots: { object: ["measures", "policy options", "support services"] }, essaySources: [[21, 0, 1, "a range of other measures"], [21, 4, 0, "other road safety measures"]], accepted: ["a range of other measures"], priority: "supporting" },
  { canonical: "promote better driving habits", prompt: "促进更好的驾驶习惯", pattern: "promote {activity}", slots: { activity: ["better driving habits", "responsible consumption", "healthy lifestyles"] }, essaySources: [[21, 0, 1, "promote better driving habits"]], priority: "supporting" },
  { canonical: "have negative consequences", prompt: "产生负面后果", pattern: "have negative consequences for {target}", slots: { target: ["public health", "road users", "the environment"] }, essaySources: [[21, 1, 3, "have negative consequences"]] },
  { canonical: "pay attention to", prompt: "重视／注意……", pattern: "pay attention to {object}", slots: { object: ["road design", "early warning signs", "public feedback"] }, essaySources: [[21, 3, 2, "attention could be paid to"]], accepted: ["attention could be paid to"], grammar: "主动 pay attention to；被动 attention is paid to。" },
  { canonical: "introduce road safety measures", prompt: "推行道路安全措施", pattern: "introduce {object}", slots: { object: ["road safety measures", "stricter regulations", "financial incentives"] }, essaySources: [[21, 4, 0, "road safety measures should also be introduced"]], accepted: ["road safety measures should be introduced"], priority: "supporting" },

  { canonical: "make a profit", prompt: "赚取利润", pattern: null, essaySources: [[22, 0, 0, "make a profit"]], priority: "supporting" },
  { canonical: "social obligations", prompt: "社会责任／义务", pattern: null, essaySources: [[22, 0, 0, "the social obligations"]], accepted: ["the social obligations"], priority: "supporting" },
  { canonical: "invest in improvements and innovations", prompt: "投资改进与创新", pattern: "invest in {field}", slots: { field: ["improvements and innovations", "staff training", "clean technology"] }, essaySources: [[22, 1, 2, "invest in improvements and innovations"]] },
  { canonical: "make a positive contribution to society", prompt: "为社会作出积极贡献", pattern: "make a positive contribution to {target}", slots: { target: ["society", "the local economy", "public debate"] }, essaySources: [[22, 1, 4, "make a positive contribution to society"]] },
  { canonical: "be in good financial health", prompt: "财务状况良好", pattern: null, essaySources: [[22, 1, 4, "is in good financial health"]], accepted: ["is in good financial health"] },
  { canonical: "pay a living wage", prompt: "支付维持生活的工资", pattern: null, essaySources: [[22, 2, 2, "pay a “living wage”"]], accepted: ["pay a living wage"], priority: "supporting" },
  { canonical: "a proportion of profits", prompt: "一定比例的利润", pattern: "a proportion of {object}", slots: { object: ["profits", "tax revenue", "the annual budget"] }, essaySources: [[22, 2, 3, "a proportion of their profits"]], accepted: ["a proportion of their profits"], priority: "supporting" },

  { canonical: "major drawbacks of", prompt: "……的主要弊端", pattern: "major drawbacks of {object}", slots: { object: ["city living", "remote work", "private transport"] }, essaySources: [[23, 0, 0, "major drawbacks of"]] },
  { canonical: "affordable housing", prompt: "可负担住房", pattern: null, essaySources: [[23, 2, 1, "affordable or social housing"]], accepted: ["affordable or social housing"], priority: "supporting" },
  { canonical: "a congestion charge", prompt: "交通拥堵费", pattern: null, essaySources: [[23, 2, 3, "a congestion charge"]], priority: "supporting" },
  { canonical: "curb the traffic problem", prompt: "遏制交通拥堵问题", pattern: "curb {problem}", slots: { problem: ["the traffic problem", "excessive spending", "harmful emissions"] }, essaySources: [[23, 2, 3, "curb the traffic problem"]] },
  { canonical: "implement a range of measures", prompt: "实施一系列措施", pattern: "implement a range of {object}", slots: { object: ["measures", "policy reforms", "safety standards"] }, essaySources: [[23, 3, 0, "implement a range of measures"]] },
  { canonical: "enhance quality of life", prompt: "提升生活质量", pattern: "enhance the quality of life for {group}", slots: { group: ["city residents", "older people", "low-income families"] }, essaySources: [[23, 3, 0, "enhance the quality of life for"]], accepted: ["enhance the quality of life for"], group: "quality-of-life", mergeConfidence: "medium", dedupNote: "与 quality of life 名词项相关，但本项重点是 enhance 的动宾搭配。", uncertainties: ["与 quality of life 建立表达族但不直接合并，待人工确认。"] },

  { canonical: "the developed world", prompt: "发达国家和地区", pattern: null, essaySources: [[24, 0, 0, "the developed world"]], type: "fixed_phrase", priority: "supporting" },
  { canonical: "on an individual level", prompt: "从个人层面看", pattern: null, essaySources: [[24, 1, 1, "On an individual level"]], type: "fixed_phrase" },
  { canonical: "the trend towards", prompt: "向……发展的趋势", pattern: "the trend towards {activity}", slots: { activity: ["living alone", "remote work", "cashless payments"] }, essaySources: [[24, 1, 3, "the trend towards"]] },
  { canonical: "result in greater demand for", prompt: "导致对……更大的需求", pattern: "result in greater demand for {service}", slots: { service: ["housing", "healthcare", "skilled workers"] }, essaySources: [[24, 1, 3, "result in greater demand for"]] },
  { canonical: "beneficial and detrimental effects on", prompt: "对……的利弊影响", pattern: "beneficial and detrimental effects on {target}", slots: { target: ["individuals", "the economy", "local communities"] }, essaySources: [[24, 3, 0, "beneficial and detrimental effects on"]] },

  { canonical: "be passionate about", prompt: "对……充满热情", pattern: "be passionate about {activity}", slots: { activity: ["one's studies", "creative work", "environmental protection"] }, essaySources: [[25, 2, 1, "are passionate about"]], accepted: ["are passionate about"] },
  { canonical: "a preferred area of study", prompt: "偏好的学习领域", pattern: null, essaySources: [[25, 2, 0, "their preferred areas of study"]], accepted: ["preferred areas of study"], priority: "supporting" },

  { canonical: "a productive member of society", prompt: "对社会有贡献的一员", pattern: null, essaySources: [[26, 0, 0, "productive members of society"]], accepted: ["productive members of society"], priority: "supporting" },
  { canonical: "break the law", prompt: "违法", pattern: null, essaySources: [[26, 0, 1, "breaking the law"]], accepted: ["breaking the law"], priority: "supporting" },
  { canonical: "become involved in crime", prompt: "卷入犯罪", pattern: null, essaySources: [[26, 1, 1, "became involved in crime"]], accepted: ["became involved in crime"] },
  { canonical: "a criminal lifestyle", prompt: "犯罪生活方式", pattern: null, essaySources: [[26, 1, 1, "a criminal lifestyle"]], priority: "supporting" },
  { canonical: "a credible source of information", prompt: "可信的信息来源", pattern: "a credible source of {object}", slots: { object: ["information", "evidence", "professional advice"] }, essaySources: [[26, 2, 3, "credible sources of information"]], accepted: ["credible sources of information"] },

  { canonical: "be relevant to", prompt: "与……相关／适用于……", pattern: "be relevant to {group}", slots: { group: ["younger people", "the current debate", "local conditions"] }, essaySources: [[27, 1, 0, "becoming less relevant for younger people"]], accepted: ["be relevant for", "becoming less relevant for"] },
  { canonical: "make one's own choices", prompt: "自己作出选择", pattern: null, essaySources: [[27, 1, 2, "make their own choices"]], accepted: ["make their own choices"], priority: "supporting" },
  { canonical: "traditional roles", prompt: "传统角色分工", pattern: null, essaySources: [[27, 1, 4, "The traditional roles"]], accepted: ["traditional roles"], priority: "supporting" },
  { canonical: "be applicable to", prompt: "适用于……", pattern: "be applicable to {target}", slots: { target: ["the modern world", "different age groups", "this situation"] }, essaySources: [[27, 2, 0, "are certainly applicable to"]], accepted: ["are applicable to"] },
  { canonical: "good manners", prompt: "良好的礼貌修养", pattern: null, essaySources: [[27, 2, 2, "good manners"]], priority: "supporting" }
];
const seeds = [...cardSeeds, ...sourceOnlySeeds];

const normalize = (text) => text.normalize("NFKC").toLowerCase().replace(/[.!?,;:]+$/g, "").replace(/\s+/g, " ").trim();
const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");
const uuidFromKey = (key) => {
  const hex = crypto.createHash("sha1").update(`mimicloop-collocation:${key}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
};
const countOccurrences = (text, needle) => text.split(needle).length - 1;
const sourceLocationKey = (sourceId, paragraphIndex, sentenceIndex) =>
  `${sourceId}:${paragraphIndex}:${sentenceIndex}`;
const cardBySourceLocation = new Map(
  cards.map((card) => [
    sourceLocationKey(card.source_essay_id, card.paragraph_index, card.sentence_index),
    card
  ])
);

for (const [indexText, expectedId] of Object.entries(expectedCardIds)) {
  const index = Number(indexText);
  if (cards[index]?.id !== expectedId) throw new Error(`Card order changed at index ${index}; expected ${expectedId}`);
}

const createdAt = "2026-08-17T06:50:00.000Z";
const records = seeds.map((seed) => {
  const cardSourceLinks = (seed.sources ?? []).map(([cardIndex, surface, learningSurface = surface]) => {
    const card = cards[cardIndex];
    if (!card) throw new Error(`Unknown card index ${cardIndex} for ${seed.canonical}`);
    if (!expectedCardIds[cardIndex]) throw new Error(`Missing stable card assertion for index ${cardIndex}`);
    if (countOccurrences(card.original_sentence, surface) < 1) throw new Error(`Surface '${surface}' missing from original card ${card.id}`);
    if (countOccurrences(card.learning_sentence, learningSurface) < 1) throw new Error(`Learning surface '${learningSurface}' missing from card ${card.id}`);
    return {
      source_essay_id: card.source_essay_id,
      paragraph_index: card.paragraph_index,
      sentence_index: card.sentence_index,
      sentence_text: card.original_sentence,
      card_id: card.id,
      surface_form: surface,
      learning_surface_form: learningSurface,
      occurrence_index: 0,
      learning_occurrence_index: 0
    };
  });
  const essaySourceLinks = (seed.essaySources ?? []).map(
    ([sourceIndex, paragraphIndex, sentenceIndex, surface]) => {
      const { source, sentence } = sourceSentenceAt(sourceIndex, paragraphIndex, sentenceIndex);
      if (countOccurrences(sentence, surface) < 1) {
        throw new Error(`Surface '${surface}' missing from source sentence ${sourceIndex}:${paragraphIndex}:${sentenceIndex}`);
      }
      const linkedCard = cardBySourceLocation.get(
        sourceLocationKey(source.id, paragraphIndex, sentenceIndex)
      );
      if (linkedCard) {
        throw new Error(
          `Source sentence ${sourceIndex}:${paragraphIndex}:${sentenceIndex} has card ${linkedCard.id}; use card source instead`
        );
      }
      return {
        source_essay_id: source.id,
        paragraph_index: paragraphIndex,
        sentence_index: sentenceIndex,
        sentence_text: sentence,
        card_id: null,
        surface_form: surface,
        learning_surface_form: null,
        occurrence_index: 0,
        learning_occurrence_index: null
      };
    }
  );
  const sourceLinks = [...cardSourceLinks, ...essaySourceLinks].map((link, linkIndex) => ({
    ...link,
    role: linkIndex === 0 ? "primary" : "supporting"
  }));
  if (!sourceLinks.length) throw new Error(`No source links for ${seed.canonical}`);
  const linkedCards = sourceLinks
    .filter((link) => link.card_id !== null)
    .map((link) => cards.find((card) => card.id === link.card_id));
  const linkedSources = sourceLinks.map((link) => sourceById.get(link.source_essay_id));
  const topics = [...new Set(linkedSources.flatMap((source) => source.topics))].sort();
  const argumentFunctions = [...new Set(linkedCards.flatMap((card) => card.argument_functions))].sort();
  const slots = Object.entries(seed.slots ?? {}).map(([name, examples]) => ({
    name,
    role_zh: roleLabels[name] ?? "可替换内容",
    replacement_examples: examples
  }));
  const acceptedAnswers = [...new Set([seed.canonical, ...(seed.accepted ?? [])])];
  return {
    schema_version: "1.2.0",
    id: uuidFromKey(seed.canonical),
    canonical_text: seed.canonical,
    translation_prompt: seed.prompt,
    pattern: seed.pattern,
    slots,
    expression_type: seed.type ?? "collocation",
    grammar_pattern: seed.grammar ?? null,
    usage_note: seed.note ?? null,
    common_error: seed.error ?? null,
    accepted_answers: acceptedAnswers,
    topics,
    argument_functions: argumentFunctions,
    source_links: sourceLinks,
    selection_scores: seed.scores ?? {
      naturalness: 5,
      active_recall_value: seed.priority === "supporting" ? 4 : 5,
      transfer_value: seed.priority === "supporting" ? 3 : 4,
      ielts_usefulness: seed.priority === "supporting" ? 4 : 5
    },
    difficulty: seed.difficulty ?? 3,
    normalized_text_hash: sha256(normalize(seed.canonical)),
    deduplication: {
      group_key: seed.group ?? normalize(seed.canonical),
      merge_target_id: null,
      confidence: seed.mergeConfidence ?? "high",
      note: seed.dedupNote ?? null
    },
    recommendation_reasons: [seed.reason ?? "来源表达自然，具有主动回忆价值，并可直接服务于 IELTS Task 2 写作。"],
    uncertainties: seed.uncertainties ?? [],
    workflow_status: "candidate",
    learning_mode: "recall_use",
    priority: seed.priority ?? "core",
    provenance: {
      guideline_version: "1.2.0",
      prompt_version: "collocation-full-corpus-extraction-v2",
      processor_type: "codex",
      model_id: "gpt-5"
    },
    review_history: [{
      action: "created",
      reviewer: "codex",
      reason: "从完整来源范文正文离线提取并完成首轮规范化；如存在正式句子卡则同时建立关联，等待人工审核。",
      reviewed_at: createdAt
    }],
    content_revision: 1,
    created_at: createdAt,
    updated_at: createdAt
  };
});

records.sort((left, right) => {
  const leftLink = left.source_links[0];
  const rightLink = right.source_links[0];
  const leftSourceIndex = sources.findIndex((source) => source.id === leftLink.source_essay_id);
  const rightSourceIndex = sources.findIndex((source) => source.id === rightLink.source_essay_id);
  return leftSourceIndex - rightSourceIndex ||
    leftLink.paragraph_index - rightLink.paragraph_index ||
    leftLink.sentence_index - rightLink.sentence_index ||
    left.canonical_text.localeCompare(right.canonical_text);
});

const idSet = new Set();
const hashSet = new Set();
for (const record of records) {
  if (idSet.has(record.id)) throw new Error(`Duplicate collocation id ${record.id}`);
  if (hashSet.has(record.normalized_text_hash)) throw new Error(`Duplicate canonical form ${record.canonical_text}`);
  idSet.add(record.id);
  hashSet.add(record.normalized_text_hash);
}

const reviewBatchSize = 20;
const expressionCounts = Object.fromEntries([...new Set(records.map((record) => record.expression_type))].sort().map((type) => [type, records.filter((record) => record.expression_type === type).length]));
const sourceSentenceCount = sources.reduce(
  (count, source) => count + source.paragraphs.reduce(
    (paragraphCount, paragraph) => paragraphCount + splitSentences(paragraph.text).length,
    0
  ),
  0
);
const linkedCardIds = new Set(records.flatMap((record) => record.source_links.map((link) => link.card_id).filter(Boolean)));
const linkedSourceSentences = new Set(records.flatMap((record) => record.source_links.map((link) =>
  sourceLocationKey(link.source_essay_id, link.paragraph_index, link.sentence_index)
)));
const chunkPromotions = records.filter((record) => record.source_links.some((link) => {
  if (link.card_id === null) return false;
  const card = cards.find((item) => item.id === link.card_id);
  return card.chunks.some((chunk) => chunk.text === link.learning_surface_form);
})).length;
const ambiguousGroups = [...new Map(records.filter((record) => record.deduplication.confidence !== "high").map((record) => [record.deduplication.group_key, true])).keys()];
const stats = {
  scanned_cards: cards.length,
  source_essays: sources.length,
  scanned_source_sentences: sourceSentenceCount,
  candidate_collocations: records.length,
  source_sentences_with_candidates: linkedSourceSentences.size,
  source_sentences_without_candidates: sourceSentenceCount - linkedSourceSentences.size,
  cards_with_candidates: linkedCardIds.size,
  cards_without_candidates: cards.length - linkedCardIds.size,
  expression_types: expressionCounts,
  core_candidates: records.filter((record) => record.priority === "core").length,
  supporting_candidates: records.filter((record) => record.priority === "supporting").length,
  multi_source_candidates: records.filter((record) => record.source_links.length > 1).length,
  candidates_with_card_links: records.filter((record) => record.source_links.some((link) => link.card_id !== null)).length,
  candidates_from_non_card_sentences: records.filter((record) => record.source_links.some((link) => link.card_id === null)).length,
  exact_chunk_promotions: chunkPromotions,
  ambiguous_dedup_groups: ambiguousGroups
};

const reviewLines = [
  "# Collocation 候选审核清单",
  "",
  `- 生成时间：${createdAt}`,
  `- 扫描：${stats.source_essays} 篇来源范文的 ${stats.scanned_source_sentences} 个正文句子；其中 ${stats.scanned_cards} 句有正式句子卡`,
  `- 候选：${stats.candidate_collocations} 条；涉及 ${stats.source_sentences_with_candidates} 个来源句；${stats.source_sentences_without_candidates} 句不强行提取`,
  `- 来源关系：${stats.candidates_with_card_links} 条关联正式句子卡；${stats.candidates_from_non_card_sentences} 条包含普通正文句来源`,
  `- 类型：${Object.entries(expressionCounts).map(([key, value]) => `${key} ${value}`).join("，")}`,
  `- 优先级：core ${stats.core_candidates}，supporting ${stats.supporting_candidates}`,
  `- 多来源：${stats.multi_source_candidates}；由现有 exact chunk 直接升级：${stats.exact_chunk_promotions}`,
  `- 存疑去重组：${ambiguousGroups.length ? ambiguousGroups.join("、") : "无"}`,
  "",
  "> 当前全部为 candidate。请按批次审核；未得到人工批准前不会进入正式数据库或学习队列。",
  ""
];

for (let batch = 1; batch <= Math.ceil(records.length / reviewBatchSize); batch += 1) {
  const batchRecords = records.slice((batch - 1) * reviewBatchSize, batch * reviewBatchSize);
  reviewLines.push(`## 第 ${batch} 批（${batchRecords.length} 条）`, "");
  for (const record of batchRecords) {
    const primary = record.source_links.find((link) => link.role === "primary");
    const source = sourceById.get(primary.source_essay_id);
    reviewLines.push(
      `### [ ] ${record.canonical_text}`,
      "",
      `- 中文提示：${record.translation_prompt}`,
      `- 类型 / 优先级：${record.expression_type} / ${record.priority}`,
      `- Pattern：${record.pattern ?? "—"}`,
      `- Accepted：${record.accepted_answers.join(" / ")}`,
      `- 来源：${source.title}`,
      `- 原句：${primary.sentence_text}`,
      `- Surface：${primary.surface_form}`,
      `- 句子卡关联：${primary.card_id ?? "无（普通正文句）"}`,
      `- 其他来源：${record.source_links.length > 1 ? record.source_links.length - 1 : 0}`,
      `- 推荐理由：${record.recommendation_reasons.join("；")}`,
      `- 待确认：${record.uncertainties.length ? record.uncertainties.join("；") : "无"}`,
      ""
    );
  }
}

fs.writeFileSync(path.join(root, "data", "candidate_collocations.json"), `${JSON.stringify(records, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(root, "data", "candidate_collocations.stats.json"), `${JSON.stringify(stats, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(root, "sources", "metadata", "collocation-candidate-review.md"), `${reviewLines.join("\n")}\n`, "utf8");

process.stdout.write(`${JSON.stringify(stats, null, 2)}\n`);
