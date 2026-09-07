import type { BandCode, RiskScoreResult } from "./types";

export type EquitySuitabilityVerdict = "ELIGIBLE" | "NOT_ELIGIBLE";

export interface EquitySuitabilityResult {
  verdict: EquitySuitabilityVerdict;
  confidencePercent: number;
  drivers: string[];
}

const EQUITY_FORWARD_BANDS: BandCode[] = ["M", "MA", "A"];

/**
 * MODEL QUESTION: MF_Risk_Engine.xlsx has no standalone "equity suitability"
 * question or score — equity-forwardness is already baked into the
 * allocation table per band. This function is a thin, clearly-labeled
 * UI-layer derived view over the existing Stage1/Stage2/Final outputs,
 * not a new scoring input. It does not alter the ported formulas.
 */
export function computeEquitySuitability(
  result: RiskScoreResult
): EquitySuitabilityResult {
  const drivers: string[] = [];
  const eligible = EQUITY_FORWARD_BANDS.includes(result.band);

  if (eligible) {
    drivers.push(`Final score ${result.finalScore} falls in the ${result.band} band, which the allocation table already weights toward equity categories.`);
  } else {
    drivers.push(`Final score ${result.finalScore} falls in the ${result.band} band, which the allocation table keeps debt-forward.`);
  }

  if (result.ccap1 <= result.tol1) {
    drivers.push("Capacity (horizon + income) is the binding constraint, not stated loss tolerance.");
  } else {
    drivers.push("Stated loss tolerance is the binding constraint, not capacity.");
  }

  const distanceFromThreshold = Math.abs(result.finalScore - 60.5);
  const confidencePercent = Math.max(
    55,
    Math.min(95, Math.round(100 - distanceFromThreshold))
  );

  return { verdict: eligible ? "ELIGIBLE" : "NOT_ELIGIBLE", confidencePercent, drivers };
}
