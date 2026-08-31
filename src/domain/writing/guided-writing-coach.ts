import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import commonSchema from "../../../schemas/common.schema.json";
import chainReviewSchema from "../../../schemas/guided-writing-chain-review.schema.json";
import coachSchema from "../../../schemas/guided-writing-coach.schema.json";
import type { EssayQuestionType } from "./task-analysis";

export const GUIDED_WRITING_COACH_SCHEMA_VERSION = "guided-writing-coach.v1.2" as const;
export const GUIDED_WRITING_COACH_PROMPT_VERSION = "guided-writing-coach-v1.7" as const;
export const GUIDED_WRITING_CHAIN_REVIEW_SCHEMA_VERSION = "guided-writing-chain-review.v1" as const;
export const GUIDED_WRITING_CHAIN_REVIEW_PROMPT_VERSION = "guided-writing-chain-review-v1.1" as const;

export const argumentNodeOrder = ["stance", "claim", "reason", "mechanism", "result"] as const;
export type ArgumentNodeKey = typeof argumentNodeOrder[number];
export const developmentRelations = [
  "causal",
  "principle_application",
  "comparison",
  "problem_response",
  "qualification",
  "unclear",
] as const;
export type DevelopmentRelation = typeof developmentRelations[number];
export type ArgumentNodeOrigin =
  | "user_independent"
  | "user_after_question"
  | "user_after_hint"
  | "user_selected_from_options"
  | "agent_supplied";

export type StoredArgumentNode = {
  content: string;
  origin: ArgumentNodeOrigin;
  turnId: string;
};

export type ArgumentGraph = Record<ArgumentNodeKey, StoredArgumentNode | null>;
export type GuidedWritingParagraphKey = "body_1" | "body_2";

export type GuidedWritingCoachInputV1 = {
  schemaVersion: "guided-writing-coach-input.v1";
  sessionId: string;
  turnId: string;
  prompt: {
    sourceEssayId: string;
    text: string;
    questionType: EssayQuestionType;
    requiredParts: string[];
    scopeMarkers: string[];
  };
  paragraph: {
    key: GuidedWritingParagraphKey;
    role: string;
    goal: string;
  };
  currentNode: ArgumentNodeKey;
  developmentRelation: DevelopmentRelation | null;
  graph: ArgumentGraph;
  questionEn: string;
  learnerAnswer: string;
};

export type GuidedWritingCoachEvaluationV1 = {
  schema_version: typeof GUIDED_WRITING_COACH_SCHEMA_VERSION;
  turn_id: string;
  verdict: "accept" | "retry" | "cannot_judge";
  dimensions: {
    relevance: "direct" | "partial" | "off_task" | "cannot_judge";
    logic: "clear" | "incomplete" | "contradictory" | "cannot_judge";
    specificity: "sufficient" | "vague" | "cannot_judge";
  };
  issue_type: "off_task" | "vague" | "missing_logic" | "contradiction" | "language_unclear" | null;
  development_relation: DevelopmentRelation | null;
  accepted_span: string | null;
  forward_span: {
    target_node: Exclude<ArgumentNodeKey, "stance">;
    text: string;
  } | null;
  feedback_en: string;
  confidence: number;
  needs_review: boolean;
};

export type GuidedWritingChainReviewInputV1 = {
  schemaVersion: "guided-writing-chain-review-input.v1";
  sessionId: string;
  turnId: string;
  prompt: GuidedWritingCoachInputV1["prompt"];
  paragraph: GuidedWritingCoachInputV1["paragraph"];
  developmentRelation: DevelopmentRelation | null;
  graph: ArgumentGraph;
};

export type GuidedWritingChainReviewV1 = {
  schema_version: typeof GUIDED_WRITING_CHAIN_REVIEW_SCHEMA_VERSION;
  turn_id: string;
  verdict: "ready" | "return_to_node" | "cannot_judge";
  return_to_node: ArgumentNodeKey | null;
  reason_code:
    | "claim_role_mismatch"
    | "reason_repeats_claim"
    | "development_gap"
    | "result_not_supported"
    | "content_repetition"
    | "scope_drift"
    | "contradiction"
    | "cannot_judge"
    | null;
  feedback_en: string;
  confidence: number;
  needs_review: boolean;
};

export type GuidedWritingCoachAction = {
  type: "ACCEPT_AND_CONTINUE" | "RETRY_SAME_NODE" | "RETURN_TO_NODE" | "READY_TO_DRAFT";
  nextNode: ArgumentNodeKey | null;
  nextQuestionEn: string | null;
  developmentRelation: DevelopmentRelation | null;
  chainReview: GuidedWritingChainReviewV1 | null;
  reuseSuggestion: {
    sourceTurnId: string;
    targetNode: Exclude<ArgumentNodeKey, "stance">;
    text: string;
  } | null;
};

export type GuidedWritingTurnView = {
  id: string;
  node: ArgumentNodeKey;
  questionEn: string;
  learnerAnswer: string;
  origin: ArgumentNodeOrigin;
  status: "pending" | "success" | "fallback" | "invalid_output" | "timeout" | "error";
  evaluation: GuidedWritingCoachEvaluationV1 | null;
  action: GuidedWritingCoachAction | null;
  model: string | null;
  createdAt: string;
};

export type GuidedWritingSessionView = {
  id: string;
  sourceEssayId: string;
  paragraphKey: GuidedWritingParagraphKey;
  status: "building_argument" | "ready_to_draft";
  currentNode: ArgumentNodeKey | null;
  currentQuestionEn: string | null;
  developmentRelation: DevelopmentRelation | null;
  chainReview: GuidedWritingChainReviewV1 | null;
  reuseSuggestion: GuidedWritingCoachAction["reuseSuggestion"];
  graph: ArgumentGraph;
  turns: GuidedWritingTurnView[];
  updatedAt: string;
};

export type GuidedWritingQuestionContext = {
  questionType: EssayQuestionType;
  paragraphKey?: GuidedWritingParagraphKey;
  developmentRelation?: DevelopmentRelation | null;
};

export type GuidedWritingNodeGuidance = {
  taskEn: string;
  boundaryEn: string;
  examplesEn: [string, string];
  logicLens?: {
    labelEn: string;
    checksEn: [string, string, string];
    sourceNoteEn: string;
  };
};

const AjvClass = ((Ajv2020 as unknown as { default?: typeof Ajv2020 }).default ?? Ajv2020);
const addFormatsToAjv = ((addFormats as unknown as { default?: typeof addFormats }).default ?? addFormats);
const ajv = new AjvClass({ allErrors: true, strict: true });
addFormatsToAjv(ajv);
ajv.addSchema(commonSchema);
const validateSchema = ajv.compile<GuidedWritingCoachEvaluationV1>(coachSchema);
const validateChainReviewSchema = ajv.compile<GuidedWritingChainReviewV1>(chainReviewSchema);

export function emptyArgumentGraph(): ArgumentGraph {
  return { stance: null, claim: null, reason: null, mechanism: null, result: null };
}

function claimQuestion(context?: GuidedWritingQuestionContext): string {
  const questions: Record<EssayQuestionType, string> = {
    opinion: "What is one main claim Body Paragraph 1 can develop to support your overall position?",
    discussion: "Why might a reasonable person hold the first view? State one main claim for this paragraph.",
    advantages_disadvantages: "What is one main advantage Body Paragraph 1 will analyse?",
    causes_solutions: "What is one main problem or cause Body Paragraph 1 will explain?",
    positive_negative_development: "What is one main impact Body Paragraph 1 will analyse?",
    two_part_multi_part: "What is your direct answer to the first question in the prompt? State one main claim.",
  };
  if (context?.paragraphKey === "body_2") {
    const bodyTwoQuestions: Record<EssayQuestionType, string> = {
      opinion: "What single claim will Body Paragraph 2 develop: a second supporting reason, a necessary qualification, or a limited concession?",
      discussion: "What is the strongest fair claim for the second view, before you give your own judgment?",
      advantages_disadvantages: "What is one main disadvantage Body Paragraph 2 will analyse?",
      causes_solutions: "What is one main solution Body Paragraph 2 will explain?",
      positive_negative_development: "What second impact will Body Paragraph 2 analyse to complete your overall evaluation?",
      two_part_multi_part: "What is your direct answer to the second question in the prompt? State one main claim.",
    };
    return bodyTwoQuestions[context.questionType];
  }
  return context
    ? questions[context.questionType]
    : "What single claim will Body Paragraph 1 develop to perform its assigned role?";
}

function reasonQuestion(context?: GuidedWritingQuestionContext): string {
  const questions: Record<EssayQuestionType, string> = {
    opinion: "What fact, principle or condition makes this paragraph claim believable and relevant to your overall position?",
    discussion: "What fact, principle or condition makes the first view reasonable enough to consider?",
    advantages_disadvantages: "What fact, principle or condition makes this a genuine advantage?",
    causes_solutions: "What fact, principle or condition explains why this problem or cause exists?",
    positive_negative_development: "What fact, principle or condition explains why this impact matters?",
    two_part_multi_part: "What fact, principle or condition supports your answer to the first question?",
  };
  if (context?.paragraphKey === "body_2") {
    return context.questionType === "opinion"
      ? "What fact, principle or condition supports this second paragraph claim without repeating Body Paragraph 1?"
      : `What fact, principle or condition supports this ${context.questionType === "causes_solutions" ? "solution" : "second paragraph claim"}?`;
  }
  return context
    ? questions[context.questionType]
    : "What fact, principle or condition makes this paragraph claim believable?";
}

function developmentQuestion(relation?: DevelopmentRelation | null): string {
  const questions: Record<DevelopmentRelation, string> = {
    causal: "What changes between your reason and the claim? Explain the missing step in the cause-and-effect chain.",
    principle_application: "Why does the principle in your reason apply to this claim? Explain the connection without adding a new main idea.",
    comparison: "What standard makes this comparison valid, and how does it connect the reason to the claim?",
    problem_response: "Which part of the problem does this response change, and how?",
    qualification: "When is this claim true, and when might it not be? State the relevant condition or scope.",
    unclear: "What is the missing connection between your reason and the claim? Do not repeat either one.",
  };
  return questions[relation ?? "unclear"];
}

function resultQuestion(context?: GuidedWritingQuestionContext): string {
  const questions: Record<EssayQuestionType, string> = {
    opinion: "What does this reasoning establish, and how does it support your overall position?",
    discussion: "What does this reasoning establish about why the first view is worth considering? Do not give your own final rebuttal yet.",
    advantages_disadvantages: "What concrete benefit does this reasoning establish?",
    causes_solutions: "What does this reasoning establish about the problem or cause required by the prompt? Do not propose the solution yet.",
    positive_negative_development: "What does this reasoning establish about the importance of this impact?",
    two_part_multi_part: "How does this reasoning complete your answer to the first question? Do not answer the second question yet.",
  };
  if (context?.paragraphKey === "body_2") {
    if (context.questionType === "opinion") {
      return "What limited conclusion does this second line of reasoning establish for your overall position?";
    }
    if (context.questionType === "discussion") {
      return "What does this reasoning establish about the second view, and what limited judgment follows when you relate it to your saved overall position?";
    }
    return "What does this reasoning establish, and how does it complete Body Paragraph 2's assigned role?";
  }
  return context
    ? questions[context.questionType]
    : "What does this reasoning finally establish, and how does that complete Body Paragraph 1's assigned role?";
}

export function guidanceForNode(
  node: ArgumentNodeKey,
  context: GuidedWritingQuestionContext,
): GuidedWritingNodeGuidance | null {
  const claimGuidance: Record<EssayQuestionType, GuidedWritingNodeGuidance> = {
    opinion: {
      taskEn: "Choose one main point that supports your overall position.",
      boundaryEn: "State the point only. You will explain why and how in the next steps.",
      examplesEn: [
        "Sunday opening gives shift workers fairer access to public libraries.",
        "Limiting cars near schools would make those streets safer for children.",
      ],
    },
    discussion: {
      taskEn: "Explain the strongest reason for the first view fairly.",
      boundaryEn: "You do not need to agree with it or refute it yet.",
      examplesEn: [
        "Supporters of longer school days may argue that supervised time helps working families.",
        "Those who favour local control may believe councils understand community needs better.",
      ],
    },
    advantages_disadvantages: {
      taskEn: "Identify one main advantage for Body Paragraph 1.",
      boundaryEn: "State the advantage only. Its cause and impact come next.",
      examplesEn: [
        "One major advantage of free museum admission is broader public access to culture.",
        "A shorter working week can give employees more time for family responsibilities.",
      ],
    },
    causes_solutions: {
      taskEn: "Identify the main problem or cause requested by the prompt.",
      boundaryEn: "Name one central point only. Do not propose the solution yet.",
      examplesEn: [
        "One major cause of abandoned shared bicycles is weak operator accountability.",
        "The central problem is poor coordination between regional transport authorities.",
      ],
    },
    positive_negative_development: {
      taskEn: "Identify one main impact of the development.",
      boundaryEn: "State the impact only. You will explain how it happens next.",
      examplesEn: [
        "Community gardens can strengthen social contact between neighbours.",
        "Replacing local shops with automated services can reduce access for older residents.",
      ],
    },
    two_part_multi_part: {
      taskEn: "Give one direct answer to the first question in the prompt.",
      boundaryEn: "Do not answer the second question in this paragraph.",
      examplesEn: [
        "One main reason residents avoid local markets is their limited opening hours.",
        "The strongest motive for joining community projects is regular contact with neighbours.",
      ],
    },
  };
  const stanceExamples: Record<EssayQuestionType, [string, string]> = {
    opinion: [
      "I largely agree that public libraries should remain open on Sundays.",
      "I support this policy only when smaller towns receive additional funding.",
    ],
    discussion: [
      "Although both approaches have strengths, I believe practical skills deserve more classroom time.",
      "Both views are reasonable, but I support giving local councils the final decision.",
    ],
    advantages_disadvantages: [
      "Overall, the advantages of free museum admission outweigh the disadvantages.",
      "Although there are clear benefits, I believe the disadvantages are more significant.",
    ],
    causes_solutions: [
      "This problem mainly results from weak local coordination and requires clearer regional planning.",
      "Several factors contribute to the problem, but stronger operator accountability is the most practical response.",
    ],
    positive_negative_development: [
      "Overall, I consider the growth of community gardens a positive development.",
      "Despite its convenience, I believe this change is largely negative.",
    ],
    two_part_multi_part: [
      "People avoid these services mainly because of limited opening hours, and councils should extend weekend access.",
      "The trend is driven by lower costs, while clearer local standards would address its main drawback.",
    ],
  };
  if (node === "stance") return {
    taskEn: "State your overall answer to every part of the prompt.",
    boundaryEn: "Show your position and any required degree or condition. Detailed support comes later.",
    examplesEn: stanceExamples[context.questionType],
  };
  if (node === "claim") {
    if (context.paragraphKey === "body_2") {
      const bodyTwoGuidance: Record<EssayQuestionType, GuidedWritingNodeGuidance> = {
        opinion: {
          taskEn: "Choose the job of Body Paragraph 2, then state one claim that performs it.",
          boundaryEn: "Use a second supporting reason, a necessary qualification, or a limited concession. Do not repeat Body Paragraph 1.",
          examplesEn: [
            "A second reason to retain local libraries is their role as quiet public study spaces.",
            "Admittedly, Sunday opening may be impractical for very small branches with limited staff.",
          ],
        },
        discussion: {
          taskEn: "Present the strongest fair claim for the second view.",
          boundaryEn: "Explain this view before making the judgment required by the prompt.",
          examplesEn: [
            "Supporters of national rules may argue that equal standards protect residents more consistently.",
            "Those who favour practical training may believe it prepares students for work more directly.",
          ],
        },
        advantages_disadvantages: {
          taskEn: "Identify one main disadvantage for Body Paragraph 2.",
          boundaryEn: "State the disadvantage only. You will explain its cause and impact next.",
          examplesEn: [
            "A major disadvantage of free admission is the additional pressure on museum budgets.",
            "Remote work can reduce informal contact between less experienced employees and colleagues.",
          ],
        },
        causes_solutions: {
          taskEn: "Identify one solution that responds to the problem developed in Body Paragraph 1.",
          boundaryEn: "State the response only. You will explain how it addresses the problem next.",
          examplesEn: [
            "Operators should be required to remove abandoned bicycles within a fixed period.",
            "Regional authorities should introduce a shared ticketing system.",
          ],
        },
        positive_negative_development: {
          taskEn: "Choose a second impact that completes your evaluation of the development.",
          boundaryEn: "Do not repeat the first impact; show what this paragraph adds to the overall judgment.",
          examplesEn: [
            "Community gardens can also improve access to fresh food in densely populated areas.",
            "Automated services may exclude residents who lack confidence with digital systems.",
          ],
        },
        two_part_multi_part: {
          taskEn: "Give one direct answer to the second question in the prompt.",
          boundaryEn: "Keep this paragraph focused on the second required part.",
          examplesEn: [
            "Councils should extend weekend opening hours to make local markets easier to use.",
            "Clearer safety standards would reduce the main risks created by this trend.",
          ],
        },
      };
      return bodyTwoGuidance[context.questionType];
    }
    return claimGuidance[context.questionType];
  }
  if (node === "reason") return {
    taskEn: context.questionType === "discussion"
      ? `Add one reason that supports the internal logic of the ${context.paragraphKey === "body_2" ? "second" : "first"} view.`
      : "Add one reason that gives the paragraph claim new support.",
    boundaryEn: "Do not restate the claim or jump straight to an example.",
    examplesEn: [
      "This is because shift workers cannot use services that close before they finish work.",
      "The underlying reason is that small charities have less capacity to absorb sudden costs.",
    ],
    logicLens: {
      labelEn: "Logic lens · What makes this true?",
      checksEn: [
        "Name a fact, principle or condition that the Claim depends on.",
        "Add new support; do not repeat the Claim or jump to the final result.",
        "Sceptical-reader test: could someone still ask, “Why should I believe that?”",
      ],
      sourceNoteEn: "IELTS focus: extend and support the main idea, with logical progression inside the paragraph.",
    },
  };
  if (node === "mechanism") return {
    taskEn: "Fill only the missing connection between your saved Reason and Main point.",
    boundaryEn: "Describe what happens in between. Do not repeat either end or add a second main idea.",
    examplesEn: context.developmentRelation === "comparison" ? [
      "Both options can be judged by how reliably they serve people without private transport.",
      "The relevant standard is not speed alone, but the number of residents who can actually use the service.",
    ] : context.developmentRelation === "principle_application" ? [
      "The fairness principle applies because the rule affects residents who had no role in creating the cost.",
      "This duty applies to councils because access to essential services depends on their decisions.",
    ] : context.developmentRelation === "problem_response" ? [
      "Weekend opening addresses the access gap by serving people who work during standard hours.",
      "Shared ticketing targets the coordination failure that makes transfers unnecessarily difficult.",
    ] : context.developmentRelation === "qualification" ? [
      "This benefit is most likely when smaller branches receive enough staff to extend their hours safely.",
      "The claim holds mainly in areas where public transport already connects residents to the service.",
    ] : [
      "When opening hours extend into Sunday, shift workers gain a realistic time in which to visit.",
      "Lower entry costs allow families to attend repeatedly rather than treating a visit as a rare expense.",
    ],
  };
  if (node === "result") return {
    taskEn: "State the limited takeaway that this paragraph has now established.",
    boundaryEn: context.questionType === "discussion"
      ? context.paragraphKey === "body_2"
        ? "Complete the second view fairly, then make one limited judgment consistent with your saved overall position. Do not add a new reason."
        : "Complete the first view fairly. You do not need to refute it here."
      : "Link back to this paragraph's assigned role without adding a new main idea.",
    examplesEn: [
      "This would make the library accessible to a wider range of local residents.",
      "The policy would therefore improve access without requiring families to own a car.",
    ],
  };
  return null;
}

export function questionForNode(
  node: ArgumentNodeKey,
  issue?: GuidedWritingCoachEvaluationV1["issue_type"],
  context?: GuidedWritingQuestionContext,
): string {
  const questions: Record<ArgumentNodeKey, string> = {
    stance: "What is your overall position on this prompt? Answer in one clear English sentence.",
    claim: claimQuestion(context),
    reason: reasonQuestion(context),
    mechanism: developmentQuestion(context?.developmentRelation),
    result: resultQuestion(context),
  };
  if (!issue) return questions[node];
  const retries: Record<ArgumentNodeKey, Partial<Record<NonNullable<GuidedWritingCoachEvaluationV1["issue_type"]>, string>>> = {
    stance: {
      off_task: "What is your own overall answer to the exact question in the prompt?",
      vague: "Can you state your overall position more precisely, including the degree or condition if the prompt requires one?",
      contradiction: "Can you give one internally consistent overall position on this prompt?",
      language_unclear: "Can you state your position again in one clear English sentence? Focus on meaning, not advanced vocabulary.",
    },
    claim: {
      off_task: claimQuestion(context),
      vague: "Can you make that claim more specific without adding a second main idea?",
      contradiction: `Can you state one claim that fits ${context?.paragraphKey === "body_2" ? "Body Paragraph 2" : "Body Paragraph 1"}'s assigned role and remains consistent with the essay plan?`,
      language_unclear: "Can you state the claim again in one clear English sentence?",
    },
    reason: {
      off_task: reasonQuestion(context),
      vague: "Can you add one precise piece of support for the paragraph claim, rather than restating it?",
      contradiction: `Can you give a reason that supports the paragraph claim and fits ${context?.paragraphKey === "body_2" ? "Body Paragraph 2" : "Body Paragraph 1"}'s assigned role?`,
      language_unclear: "Can you express the reason again in one clear English sentence?",
    },
    mechanism: {
      off_task: developmentQuestion(context?.developmentRelation),
      vague: "What specific relationship connects your reason to the paragraph claim?",
      missing_logic: "Which relationship is still missing between your reason and the paragraph claim?",
      contradiction: "Can you explain a relationship that fits the paragraph role and remains consistent with the saved claim and reason?",
      language_unclear: "Can you explain the missing relationship again in one clear English sentence?",
    },
    result: {
      off_task: resultQuestion(context),
      vague: "Can you state precisely what the reasoning has established for this paragraph?",
      missing_logic: "What conclusion follows directly from the reasoning already saved for this paragraph?",
      contradiction: "Can you state what follows consistently from the saved argument and the paragraph's assigned role?",
      language_unclear: "Can you state what this paragraph has established in one clear English sentence?",
    },
  };
  return retries[node][issue] ?? questions[node];
}

const allowedIssuesByNode: Record<ArgumentNodeKey, GuidedWritingCoachEvaluationV1["issue_type"][]> = {
  stance: ["off_task", "vague", "contradiction", "language_unclear"],
  claim: ["off_task", "vague", "contradiction", "language_unclear"],
  reason: ["off_task", "vague", "contradiction", "language_unclear"],
  mechanism: ["off_task", "vague", "missing_logic", "contradiction", "language_unclear"],
  result: ["off_task", "vague", "missing_logic", "contradiction", "language_unclear"],
};

export function isGuidedWritingEvaluationActionable(
  node: ArgumentNodeKey,
  evaluation: GuidedWritingCoachEvaluationV1,
): boolean {
  if (evaluation.verdict === "accept") return evaluation.issue_type === null;
  return evaluation.issue_type !== null && allowedIssuesByNode[node].includes(evaluation.issue_type);
}

function containsCjk(value: string) {
  return /[\u3400-\u9fff\uf900-\ufaff]/u.test(value);
}

export function validateGuidedWritingCoachEvaluation(value: unknown, input: GuidedWritingCoachInputV1) {
  const errors: string[] = [];
  if (!validateSchema(value)) {
    errors.push(...(validateSchema.errors ?? []).map((error) => `SCHEMA_${error.instancePath || "ROOT"}_${error.keyword}`));
    return { valid: false as const, errors };
  }
  const evaluation = value as GuidedWritingCoachEvaluationV1;
  if (evaluation.turn_id !== input.turnId) errors.push("TURN_ID_MISMATCH");
  if (containsCjk(evaluation.feedback_en)) errors.push("FEEDBACK_NOT_ENGLISH");
  if (evaluation.verdict === "accept" && (
    evaluation.dimensions.relevance !== "direct"
    || evaluation.dimensions.logic !== "clear"
    || evaluation.dimensions.specificity !== "sufficient"
    || evaluation.issue_type !== null
    || evaluation.needs_review
  )) errors.push("INVALID_ACCEPT");
  const nextNode = argumentNodeOrder[argumentNodeOrder.indexOf(input.currentNode) + 1];
  if (evaluation.verdict === "accept") {
    if (!evaluation.accepted_span || !input.learnerAnswer.includes(evaluation.accepted_span)) {
      errors.push("ACCEPTED_SPAN_NOT_IN_ANSWER");
    }
    if (evaluation.forward_span) {
      if (!nextNode || evaluation.forward_span.target_node !== nextNode) errors.push("FORWARD_SPAN_TARGET_MISMATCH");
      if (!input.learnerAnswer.includes(evaluation.forward_span.text)) errors.push("FORWARD_SPAN_NOT_IN_ANSWER");
      if (evaluation.forward_span.text === evaluation.accepted_span) errors.push("FORWARD_SPAN_DUPLICATES_CURRENT");
      const acceptedIndex = evaluation.accepted_span ? input.learnerAnswer.indexOf(evaluation.accepted_span) : -1;
      const forwardIndex = input.learnerAnswer.indexOf(evaluation.forward_span.text);
      if (
        acceptedIndex >= 0
        && forwardIndex >= 0
        && acceptedIndex < forwardIndex + evaluation.forward_span.text.length
        && forwardIndex < acceptedIndex + (evaluation.accepted_span?.length ?? 0)
      ) errors.push("FORWARD_SPAN_OVERLAPS_CURRENT");
    }
  } else if (evaluation.accepted_span !== null || evaluation.forward_span !== null) {
    errors.push("NON_ACCEPT_CANNOT_SAVE_SPANS");
  }
  if (evaluation.issue_type && !allowedIssuesByNode[input.currentNode].includes(evaluation.issue_type)) {
    errors.push("ISSUE_NOT_ALLOWED_FOR_NODE");
  }
  if (["reason", "mechanism"].includes(input.currentNode) && evaluation.verdict === "accept") {
    if (!evaluation.development_relation) errors.push("DEVELOPMENT_RELATION_REQUIRED");
  } else if (evaluation.development_relation !== null) {
    errors.push("UNEXPECTED_DEVELOPMENT_RELATION");
  }
  if (
    input.currentNode === "mechanism"
    && input.developmentRelation
    && input.developmentRelation !== "unclear"
    && evaluation.development_relation !== input.developmentRelation
  ) errors.push("DEVELOPMENT_RELATION_MISMATCH");
  if (evaluation.verdict !== "accept" && evaluation.issue_type === null) errors.push("RETRY_REQUIRES_ISSUE");
  if (evaluation.verdict === "accept" && evaluation.confidence < 0.65) errors.push("LOW_CONFIDENCE_ACCEPT");
  return errors.length
    ? { valid: false as const, errors: Array.from(new Set(errors)) }
    : { valid: true as const, evaluation, errors: [] };
}

export function selectGuidedWritingCoachAction(
  currentNode: ArgumentNodeKey,
  evaluation: GuidedWritingCoachEvaluationV1,
  context?: GuidedWritingQuestionContext,
): GuidedWritingCoachAction {
  const existingRelation = context?.developmentRelation ?? null;
  if (evaluation.verdict !== "accept") return {
    type: "RETRY_SAME_NODE",
    nextNode: currentNode,
    nextQuestionEn: questionForNode(currentNode, evaluation.issue_type, context),
    developmentRelation: existingRelation,
    chainReview: null,
    reuseSuggestion: null,
  };
  const developmentRelation = currentNode === "reason"
    ? evaluation.development_relation
    : currentNode === "mechanism" && existingRelation === "unclear"
      ? evaluation.development_relation
      : existingRelation;
  const currentIndex = argumentNodeOrder.indexOf(currentNode);
  const nextNode = argumentNodeOrder[currentIndex + 1] ?? null;
  return nextNode ? {
    type: "ACCEPT_AND_CONTINUE",
    nextNode,
    nextQuestionEn: questionForNode(
      nextNode,
      undefined,
      context ? { ...context, developmentRelation } : undefined,
    ),
    developmentRelation,
    chainReview: null,
    reuseSuggestion: evaluation.forward_span ? {
      sourceTurnId: evaluation.turn_id,
      targetNode: evaluation.forward_span.target_node,
      text: evaluation.forward_span.text,
    } : null,
  } : {
    type: "READY_TO_DRAFT",
    nextNode: null,
    nextQuestionEn: null,
    developmentRelation,
    chainReview: null,
    reuseSuggestion: null,
  };
}

const fixedReturnNodeByReason: Partial<Record<NonNullable<GuidedWritingChainReviewV1["reason_code"]>, ArgumentNodeKey>> = {
  claim_role_mismatch: "claim",
  reason_repeats_claim: "reason",
  development_gap: "mechanism",
  result_not_supported: "result",
};

export function validateGuidedWritingChainReview(value: unknown, input: GuidedWritingChainReviewInputV1) {
  const errors: string[] = [];
  if (!validateChainReviewSchema(value)) {
    errors.push(...(validateChainReviewSchema.errors ?? [])
      .map((error) => `SCHEMA_${error.instancePath || "ROOT"}_${error.keyword}`));
    return { valid: false as const, errors };
  }
  const review = value as GuidedWritingChainReviewV1;
  if (review.turn_id !== input.turnId) errors.push("TURN_ID_MISMATCH");
  if (containsCjk(review.feedback_en)) errors.push("FEEDBACK_NOT_ENGLISH");
  if (argumentNodeOrder.some((node) => !input.graph[node])) errors.push("ARGUMENT_GRAPH_INCOMPLETE");
  if (review.verdict === "ready" && (
    review.return_to_node !== null
    || review.reason_code !== null
    || review.needs_review
    || review.confidence < 0.65
  )) errors.push("INVALID_READY_REVIEW");
  if (review.verdict === "return_to_node") {
    if (!review.return_to_node || !review.reason_code || review.reason_code === "cannot_judge") {
      errors.push("INVALID_RETURN_REVIEW");
    }
    const fixedNode = review.reason_code ? fixedReturnNodeByReason[review.reason_code] : undefined;
    if (fixedNode && review.return_to_node !== fixedNode) errors.push("RETURN_NODE_MISMATCH");
    if (review.needs_review || review.confidence < 0.65) errors.push("LOW_CONFIDENCE_RETURN");
  }
  if (review.verdict === "cannot_judge" && (
    review.return_to_node !== null
    || review.reason_code !== "cannot_judge"
    || !review.needs_review
  )) errors.push("INVALID_CANNOT_JUDGE_REVIEW");
  return errors.length
    ? { valid: false as const, errors: Array.from(new Set(errors)) }
    : { valid: true as const, review, errors: [] };
}

function questionForChainReturn(
  node: ArgumentNodeKey,
  reasonCode: NonNullable<GuidedWritingChainReviewV1["reason_code"]>,
  context: GuidedWritingQuestionContext,
): string {
  if (reasonCode === "reason_repeats_claim") {
    return "What new reason can support the paragraph claim without repeating it?";
  }
  if (reasonCode === "development_gap") {
    return questionForNode("mechanism", "missing_logic", context);
  }
  if (reasonCode === "result_not_supported") {
    return "What limited conclusion follows directly from the reasoning already saved?";
  }
  return questionForNode(node, reasonCode === "contradiction" ? "contradiction" : undefined, context);
}

export function selectGuidedWritingChainAction(
  review: GuidedWritingChainReviewV1,
  context: GuidedWritingQuestionContext,
): GuidedWritingCoachAction | null {
  if (review.verdict === "cannot_judge") return null;
  if (review.verdict === "ready") return {
    type: "READY_TO_DRAFT",
    nextNode: null,
    nextQuestionEn: null,
    developmentRelation: context.developmentRelation ?? null,
    chainReview: review,
    reuseSuggestion: null,
  };
  const nextNode = review.return_to_node!;
  return {
    type: "RETURN_TO_NODE",
    nextNode,
    nextQuestionEn: questionForChainReturn(nextNode, review.reason_code!, context),
    developmentRelation: context.developmentRelation ?? null,
    chainReview: review,
    reuseSuggestion: null,
  };
}

export {
  chainReviewSchema as guidedWritingChainReviewSchema,
  coachSchema as guidedWritingCoachSchema,
};
