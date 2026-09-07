export type HorizonAnswer =
  | "lessThan1Year"
  | "oneToThreeYears"
  | "threeToSevenYears"
  | "sevenPlusYears";

export type DrawdownAnswer = "sellAll" | "sellPortion" | "hold" | "buyMore";

export type IncomeAnswer =
  | "irregular"
  | "oneSalary"
  | "twoIncomes"
  | "multipleOrBusiness";

export type ExperienceAnswer =
  | "fdOnly"
  | "fewSips"
  | "twoPlusYears"
  | "veryActive";

export type LiquidityAnswer =
  | "needIn12Months"
  | "mayNeedSome"
  | "flexible"
  | "otherInvestments";

export interface Stage1Answers {
  horizon: HorizonAnswer;
  drawdownReaction: DrawdownAnswer;
  incomeStability: IncomeAnswer;
}

export interface Stage2Answers {
  experience: ExperienceAnswer;
  liquidity: LiquidityAnswer;
}

export type RiskConfidence = "Medium" | "High";

export type BandCode = "VC" | "C" | "M" | "MA" | "A";

export interface RiskScoreResult {
  ccap1: number;
  tol1: number;
  stage1Score: number;
  ccap2: number | null;
  tol2: number | null;
  stage2Score: number | null;
  finalScore: number;
  confidence: RiskConfidence;
  band: BandCode;
}

export type AllocationKey = string; // e.g. "MA-3"

export interface AllocationLine {
  category: string;
  percent: number;
}
