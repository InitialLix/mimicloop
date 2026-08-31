import type { SourceEssayData } from "../../lib/content-types";

export const ESSAY_TASK_ANALYSIS_VERSION = "essay-task-analysis.v1" as const;

export type EssayQuestionType =
  | "opinion"
  | "discussion"
  | "advantages_disadvantages"
  | "causes_solutions"
  | "positive_negative_development"
  | "two_part_multi_part";

export type EssayParagraphPlan = {
  key: "introduction" | "body_1" | "body_2" | "conclusion";
  label: string;
  role: string;
  goal: string;
  coachQuestion: string;
};

export type EssayTaskAnalysisV1 = {
  schemaVersion: typeof ESSAY_TASK_ANALYSIS_VERSION;
  sourceEssayId: string;
  title: string;
  prompt: string;
  questionType: EssayQuestionType;
  questionTypeLabel: string;
  topics: string[];
  requiredParts: string[];
  instructionText: string[];
  scopeMarkers: string[];
  argumentMap: EssayArgumentMap;
  outline: EssayParagraphPlan[];
};

export type EssayArgumentMap = {
  kind: "support" | "compare" | "cause_response" | "evaluate" | "dual_question";
  title: string;
  relation: string;
  nodes: [string, string, string];
  structureNote: string;
};

const typeLabels: Record<EssayQuestionType, string> = {
  opinion: "观点论证",
  discussion: "双方观点讨论",
  advantages_disadvantages: "利弊与权衡",
  causes_solutions: "问题、原因与解决方案",
  positive_negative_development: "正面或负面发展",
  two_part_multi_part: "双问题回应",
};

function instructionText(prompt: string) {
  const sentences = prompt.match(/[^.!?]+[.!?]/g)?.map((item) => item.trim()) ?? [prompt.trim()];
  const directive = sentences.filter((sentence) => (
    sentence.endsWith("?")
    || /^(discuss|give|suggest|explain|outline|examine|consider)\b/i.test(sentence)
  ));
  return directive.length ? directive : [sentences.at(-1) ?? prompt.trim()];
}

function scopeMarkers(prompt: string) {
  const patterns = [
    /\bto what extent\b/gi,
    /\bmost important\b/gi,
    /\bbest\b/gi,
    /\bonly\b/gi,
    /\ball\b/gi,
    /\bmain\b/gi,
    /\boutweigh\b/gi,
    /\bpositive or negative\b/gi,
    /\bboth views\b/gi,
  ];
  return Array.from(new Set(patterns.flatMap((pattern) => prompt.match(pattern) ?? [])))
    .map((item) => item.toLowerCase());
}

function baseParagraphs(bodyOne: EssayParagraphPlan, bodyTwo: EssayParagraphPlan): EssayParagraphPlan[] {
  return [
    {
      key: "introduction",
      label: "引言",
      role: "回应题目",
      goal: "简洁改写争议，并直接交代全文立场或回答方向。",
      coachQuestion: "读者在引言结束时，能否准确知道你会怎样回答题目？",
    },
    bodyOne,
    bodyTwo,
    {
      key: "conclusion",
      label: "结论",
      role: "收束判断",
      goal: "重申已经论证过的总体判断，不加入新的主要理由。",
      coachQuestion: "这句话是否与引言立场一致，并覆盖题目的全部要求？",
    },
  ];
}

function requiredParts(questionType: EssayQuestionType, prompt: string) {
  const outweigh = /\boutweigh\b/i.test(prompt);
  const profiles: Record<EssayQuestionType, string[]> = {
    opinion: ["明确同意、不同意或部分同意", "用两个清楚展开的理由支持立场"],
    discussion: ["解释第一种观点为什么成立", "解释第二种观点为什么成立", "明确并保持自己的判断"],
    advantages_disadvantages: outweigh
      ? ["分析主要好处", "分析主要坏处", "明确哪一方影响更大并说明原因"]
      : ["分析主要好处", "分析主要坏处", "给出与题目要求一致的综合判断"],
    causes_solutions: ["准确回应题目要求的问题或原因", "提出与前述问题直接对应的解决方案"],
    positive_negative_development: ["分析这一变化带来的主要影响", "明确总体上是正面还是负面发展"],
    two_part_multi_part: instructionText(prompt).map((_, index) => `完整回答问题 ${index + 1}`),
  };
  return profiles[questionType];
}

function argumentMap(questionType: EssayQuestionType, prompt: string): EssayArgumentMap {
  const outweigh = /\boutweigh\b/i.test(prompt);
  const maps: Record<EssayQuestionType, EssayArgumentMap> = {
    opinion: {
      kind: "support",
      title: "立场驱动地图",
      relation: "同一立场，由两条独立理由共同支撑",
      nodes: ["中心立场", "理由一 ＋ 理由二", "回扣立场"],
      structureNote: "常用起点是四段；两段主体不是正反两面，而是共同支持同一个判断。",
    },
    discussion: {
      kind: "compare",
      title: "双观点判断地图",
      relation: "先公平解释两种观点，再按明确标准作出判断",
      nodes: ["观点 A", "观点 B", "比较与判断"],
      structureNote: "通常可用四段；如果个人判断需要独立展开，也可以调整为五段。",
    },
    advantages_disadvantages: {
      kind: "compare",
      title: outweigh ? "利弊权衡地图" : "利弊分析地图",
      relation: outweigh ? "比较影响范围、强度与持续时间后判定轻重" : "分别分析主要好处与坏处",
      nodes: ["主要好处", "主要坏处", outweigh ? "轻重判断" : "综合回应"],
      structureNote: "四段是常用起点；重点不是机械对半，而是让篇幅服从题目是否要求权衡。",
    },
    causes_solutions: {
      kind: "cause_response",
      title: "因果应对地图",
      relation: "方案必须直接作用于前文诊断出的原因或问题",
      nodes: ["问题 / 原因", "形成机制", "对应方案"],
      structureNote: "常用起点是四段；它是问题到方案的因果链，不是二元辩论。",
    },
    positive_negative_development: {
      kind: "evaluate",
      title: "影响评价地图",
      relation: "分析关键影响，再用统一标准完成总体评价",
      nodes: ["主要影响", "限制或相反影响", "正负判断"],
      structureNote: "通常可从四段开始；主体段按影响组织，不必写成支持与反对。",
    },
    two_part_multi_part: {
      kind: "dual_question",
      title: "双问题回应地图",
      relation: "两个问句分别完整回答，不能让第二问成为附带一句",
      nodes: ["问题一", "问题二", "完整回应"],
      structureNote: "两个主体段分别回答两个问句最清楚；若某一问需要两个独立理由，再调整段落数。",
    },
  };
  return maps[questionType];
}

function outline(questionType: EssayQuestionType, prompt: string): EssayParagraphPlan[] {
  const instructions = instructionText(prompt);
  if (questionType === "discussion") return baseParagraphs(
    {
      key: "body_1", label: "主体段一", role: "解释观点 A",
      goal: "说明第一种观点的核心理由，并补全原因到结果的链条。",
      coachQuestion: "为什么有人会持有第一种观点？它通过什么机制产生影响？",
    },
    {
      key: "body_2", label: "主体段二", role: "解释观点 B 并判断",
      goal: "公平解释另一种观点，再说明你的判断及其依据。",
      coachQuestion: "另一种观点解决了什么问题？为什么你最终更认同其中一方？",
    },
  );
  if (questionType === "advantages_disadvantages") return baseParagraphs(
    {
      key: "body_1", label: "主体段一", role: "分析一方影响",
      goal: "集中分析主要好处，解释它如何发生以及谁会受益。",
      coachQuestion: "最重要的好处是什么？它为什么足以影响你的总体判断？",
    },
    {
      key: "body_2", label: "主体段二", role: "分析另一方并权衡",
      goal: "分析主要坏处，并在需要时与前一段完成轻重比较。",
      coachQuestion: "这个坏处有多严重、影响多久？它是否超过前一段的好处？",
    },
  );
  if (questionType === "causes_solutions") return baseParagraphs(
    {
      key: "body_1", label: "主体段一", role: "诊断问题",
      goal: "回应题目要求的问题或原因，说明其形成机制和具体影响。",
      coachQuestion: "真正需要解决的根因或问题是什么？它是怎样形成的？",
    },
    {
      key: "body_2", label: "主体段二", role: "提出对应方案",
      goal: "提出能够作用于前一段问题的措施，并解释为什么可行。",
      coachQuestion: "这项措施具体解决前一段的哪一步？谁来执行、为什么有效？",
    },
  );
  if (questionType === "positive_negative_development") return baseParagraphs(
    {
      key: "body_1", label: "主体段一", role: "分析主要影响",
      goal: "解释这一变化最直接、最重要的影响。",
      coachQuestion: "这一变化首先影响谁？通过什么机制产生结果？",
    },
    {
      key: "body_2", label: "主体段二", role: "完成总体评价",
      goal: "分析另一项影响或限制，并据此完成正负判断。",
      coachQuestion: "是否存在相反影响？为什么总体判断仍然成立？",
    },
  );
  if (questionType === "two_part_multi_part") return baseParagraphs(
    {
      key: "body_1", label: "主体段一", role: "回答问题一",
      goal: instructions[0] ? `集中回应：${instructions[0]}` : "完整回答题目的第一个问题。",
      coachQuestion: "这一段是否直接回答了第一个问句，而不是只谈背景？",
    },
    {
      key: "body_2", label: "主体段二", role: "回答问题二",
      goal: instructions[1] ? `集中回应：${instructions[1]}` : "完整回答题目的第二个问题。",
      coachQuestion: "这一段是否独立、完整地回答了第二个问句？",
    },
  );
  return baseParagraphs(
    {
      key: "body_1", label: "主体段一", role: "支持立场",
      goal: "提出最有解释力的第一个理由，展开原因、机制与结果。",
      coachQuestion: "为什么你的立场成立？中间最容易被省略的机制是什么？",
    },
    {
      key: "body_2", label: "主体段二", role: "深化或限定立场",
      goal: "用第二个理由、必要限定或让步，使立场更完整。",
      coachQuestion: "还有什么独立理由？在哪些条件下你的判断需要限定？",
    },
  );
}

export function analyzeEssayTask(
  source: Pick<SourceEssayData, "id" | "title" | "ielts_prompt" | "question_type" | "topics">,
): EssayTaskAnalysisV1 {
  if (!source.ielts_prompt?.trim()) throw new Error(`Source ${source.id} does not contain an IELTS prompt`);
  if (!(source.question_type in typeLabels)) throw new Error(`Unsupported IELTS question type: ${source.question_type}`);
  const questionType = source.question_type as EssayQuestionType;
  return {
    schemaVersion: ESSAY_TASK_ANALYSIS_VERSION,
    sourceEssayId: source.id,
    title: source.title,
    prompt: source.ielts_prompt.trim(),
    questionType,
    questionTypeLabel: typeLabels[questionType],
    topics: source.topics,
    requiredParts: requiredParts(questionType, source.ielts_prompt),
    instructionText: instructionText(source.ielts_prompt),
    scopeMarkers: scopeMarkers(source.ielts_prompt),
    argumentMap: argumentMap(questionType, source.ielts_prompt),
    outline: outline(questionType, source.ielts_prompt),
  };
}
