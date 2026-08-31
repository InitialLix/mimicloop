import type { LearnedWritingAsset } from "./learned-expression-retrieval";

export type IntroductionLanguagePart = "opening" | "task_framing" | "thesis";

export const introductionLanguageParts: IntroductionLanguagePart[] = ["opening", "task_framing", "thesis"];

export function isIntroductionLanguagePart(value: string): value is IntroductionLanguagePart {
  return introductionLanguageParts.includes(value as IntroductionLanguagePart);
}

export function introductionLanguageNeed(part: IntroductionLanguagePart) {
  if (part === "opening") return {
    label: "Relevant opening",
    purposeZh: "用一句与题目直接相关的背景进入争议；这一句可省略，不负责表明最终立场。",
    preferredArgumentFunctions: ["paraphrase_prompt", "compare_or_weigh", "qualify_claim", "concession"],
  };
  if (part === "task_framing") return {
    label: "Task framing",
    purposeZh: "准确改写题目中的争议、比较或问题，不加入正文尚未论证的新观点。",
    preferredArgumentFunctions: ["paraphrase_prompt", "compare_or_weigh", "concession", "qualify_claim"],
  };
  return {
    label: "Thesis",
    purposeZh: "明确回答题目，并让总体立场与已经完成的两段正文保持一致。",
    preferredArgumentFunctions: ["state_position", "qualify_claim", "concession", "compare_or_weigh", "counterargument"],
  };
}

export type IntroductionLanguageRetrievalView = {
  sourceEssayId: string;
  part: IntroductionLanguagePart;
  partContent: string;
  partNeed: {
    label: string;
    purposeZh: string;
    preferredArgumentFunctions: string[];
    draftConsidered: boolean;
  };
  pool: {
    approvedIntroductionSentences: number;
    approvedCoreExpressions: number;
    studiedIntroductionSentences: number;
    studiedCoreExpressions: number;
  };
  assets: LearnedWritingAsset[];
  primaryAsset: LearnedWritingAsset | null;
  supportingExpressions: LearnedWritingAsset[];
  noSuitableAsset: boolean;
  noSuitableReasonZh: string | null;
  selection: {
    mode: "deepseek" | "deterministic" | "fallback";
    model: string | null;
    errorCode: string | null;
  };
};
