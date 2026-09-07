import { defaultWeights, defaultBands } from "@/lib/config/defaults";
import type { BandsConfig, WeightsConfig } from "@/lib/config/types";
import type {
  BandCode,
  RiskScoreResult,
  Stage1Answers,
  Stage2Answers,
} from "./types";

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function bandForScore(score: number, bandsConfig: BandsConfig = defaultBands): BandCode {
  const band = bandsConfig.bands.find((b) => score >= b.min && score <= b.max);
  if (!band) {
    throw new Error(`No band configured for score ${score}`);
  }
  return band.code as BandCode;
}

/**
 * Ported verbatim from MF_Risk_Engine.xlsx Sheet 4 (Risk Score Calculator).
 * Stage 2 can only ever tighten the capacity ceiling (via MIN with the
 * liquidity cap) and shrink tolerance toward the neutral anchor — never
 * loosen or override Stage 1.
 */
export function computeRiskScore(
  stage1: Stage1Answers,
  stage2?: Stage2Answers,
  weights: WeightsConfig = defaultWeights,
  bandsConfig: BandsConfig = defaultBands
): RiskScoreResult {
  const q1 = weights.questionScores.horizon[stage1.horizon];
  const q2 = weights.questionScores.drawdownReaction[stage1.drawdownReaction];
  const q3 = weights.questionScores.incomeStability[stage1.incomeStability];

  const ccap1 =
    q1 * weights.capacityWeights.horizon + q3 * weights.capacityWeights.income;
  const tol1 = q2;
  const stage1Score = Math.min(ccap1, tol1);

  if (!stage2) {
    const finalScore = round1(stage1Score);
    return {
      ccap1: round1(ccap1),
      tol1,
      stage1Score: round1(stage1Score),
      ccap2: null,
      tol2: null,
      stage2Score: null,
      finalScore,
      confidence: "Medium",
      band: bandForScore(finalScore, bandsConfig),
    };
  }

  const liquidityCap = weights.liquidityCap[stage2.liquidity];
  const trustFactor = weights.trustFactor[stage2.experience];
  const neutralAnchor = weights.neutralToleranceAnchor;

  const ccap2 = Math.min(ccap1, liquidityCap);
  const tol2 = tol1 * trustFactor + neutralAnchor * (1 - trustFactor);
  const stage2Score = Math.min(ccap2, tol2);

  const finalScore = round1(
    stage1Score * weights.stageBlend.stage1 +
      stage2Score * weights.stageBlend.stage2
  );

  return {
    ccap1: round1(ccap1),
    tol1,
    stage1Score: round1(stage1Score),
    ccap2: round1(ccap2),
    tol2: round1(tol2),
    stage2Score: round1(stage2Score),
    finalScore,
    confidence: "High",
    band: bandForScore(finalScore, bandsConfig),
  };
}
