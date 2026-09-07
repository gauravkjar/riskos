import type {
  DrawdownAnswer,
  ExperienceAnswer,
  HorizonAnswer,
  IncomeAnswer,
  LiquidityAnswer,
} from "./types";

export interface QuestionOption<T extends string> {
  value: T;
  label: string;
}

export const horizonQuestion = {
  id: "horizon" as const,
  stage: 1 as const,
  prompt: "When do you expect to need this money?",
  context: "Drives your capacity ceiling — the single largest weight in the model.",
  options: [
    { value: "lessThanTwoYears", label: "Within the next 2 years" },
    { value: "twoToFiveYears", label: "In 2–5 years" },
    { value: "sixToNineYears", label: "In 6–9 years" },
    { value: "tenPlusYears", label: "10+ years away" },
  ] satisfies QuestionOption<HorizonAnswer>[],
};

export const drawdownQuestion = {
  id: "drawdownReaction" as const,
  stage: 1 as const,
  prompt: "Your portfolio drops 20% in a month. What do you do?",
  context: "Measures stated loss tolerance — capped by, never overriding, your capacity.",
  options: [
    { value: "sellAll", label: "Sell everything to stop further loss" },
    { value: "sellPortion", label: "Sell a portion to reduce exposure" },
    { value: "hold", label: "Hold and wait it out" },
    { value: "buyMore", label: "Buy more at the lower price" },
  ] satisfies QuestionOption<DrawdownAnswer>[],
};

export const incomeQuestion = {
  id: "incomeStability" as const,
  stage: 1 as const,
  prompt: "How stable is your household income?",
  context: "Contributes 30% of your capacity score alongside horizon.",
  options: [
    { value: "irregular", label: "Irregular / no fixed income" },
    { value: "oneSalary", label: "One steady salary" },
    { value: "twoIncomes", label: "Two incomes in the household" },
    { value: "multipleOrBusiness", label: "Multiple incomes or business ownership" },
  ] satisfies QuestionOption<IncomeAnswer>[],
};

export const experienceQuestion = {
  id: "experience" as const,
  stage: 2 as const,
  prompt: "How much investing experience do you have?",
  context: "Sets a trust factor — inexperience shrinks your stated tolerance toward a neutral midpoint.",
  options: [
    { value: "fdOnly", label: "Fixed deposits only, no market exposure" },
    { value: "fewSips", label: "A few SIPs or mutual funds" },
    { value: "twoPlusYears", label: "2+ years actively investing" },
    { value: "veryActive", label: "Very active, multi-asset investor" },
  ] satisfies QuestionOption<ExperienceAnswer>[],
};

export const liquidityQuestion = {
  id: "liquidity" as const,
  stage: 2 as const,
  prompt: "How likely are you to need this money early?",
  context: "Can only tighten your capacity ceiling further — never loosens it.",
  options: [
    { value: "needIn12Months", label: "Likely need some within 12 months" },
    { value: "mayNeedSome", label: "May need a portion in an emergency" },
    { value: "flexible", label: "Flexible — other funds cover emergencies" },
    { value: "otherInvestments", label: "Fully separate from other investments" },
  ] satisfies QuestionOption<LiquidityAnswer>[],
};

export const stage1Questions = [horizonQuestion, drawdownQuestion, incomeQuestion];
export const stage2Questions = [experienceQuestion, liquidityQuestion];
