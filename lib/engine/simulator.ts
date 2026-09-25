import scenarioAssumptions from "@/lib/config/scenario-assumptions.json";
import type { AllocationLine } from "./types";

export interface SimulationResult {
  amount: number;
  expectedReturnPct: number;
  expectedValueOneYear: number;
  worstCasePct: number;
  worstCaseValueOneYear: number;
  volatilityPct: number;
}

export function simulatePortfolio(
  lines: AllocationLine[],
  amount: number
): SimulationResult {
  const assumptions = scenarioAssumptions.categoryAssumptions as Record<
    string,
    { expectedReturn: number; volatility: number; worstCase: number }
  >;

  let expectedReturnPct = 0;
  let worstCasePct = 0;
  let volatilityPct = 0;

  for (const line of lines) {
    const a = assumptions[line.category];
    if (!a) continue;
    const weight = line.percent / 100;
    expectedReturnPct += a.expectedReturn * weight;
    worstCasePct += a.worstCase * weight;
    volatilityPct += a.volatility * weight;
  }

  return {
    amount,
    expectedReturnPct: Math.round(expectedReturnPct * 10) / 10,
    expectedValueOneYear: Math.round(amount * (1 + expectedReturnPct / 100)),
    worstCasePct: Math.round(worstCasePct * 10) / 10,
    worstCaseValueOneYear: Math.round(amount * (1 + worstCasePct / 100)),
    volatilityPct: Math.round(volatilityPct * 10) / 10,
  };
}

export interface NamedScenarioResult {
  scenario: string;
  valueAfter: number;
  /** Absolute (total) return over the full holding period. */
  changePct: number;
  /** Compound annual growth rate implied by `changePct` over `years`. */
  cagrPct: number;
}

export const SCENARIO_NAMES = [
  "Normal market",
  "Market correction",
  "Severe downturn",
  "Crisis",
  "Recovery",
] as const;

export type ScenarioName = (typeof SCENARIO_NAMES)[number];

const NORMAL_SCENARIO = "Normal market";

function weightedReturnPct(
  lines: AllocationLine[],
  categoryAssumptions: Record<string, { return: number }>
): number {
  let pct = 0;
  for (const line of lines) {
    const a = categoryAssumptions[line.category];
    if (!a) continue;
    pct += a.return * (line.percent / 100);
  }
  return Math.round(pct * 10) / 10;
}

/**
 * Computes an illustrative outcome for `lines` under a single named scenario
 * (Normal market / Market correction / Severe downturn / Crisis / Recovery)
 * over a holding period of `years` (default 1).
 *
 * The figures in `scenario-assumptions.json` describe a one-off shock year,
 * not a sustained annual rate — a "Crisis" doesn't recur every year for a
 * decade. So the shock is applied once, in year 1, and the portfolio is
 * assumed to revert to the "Normal market" return for any remaining years.
 * This tapers both the downside and the upside as the horizon lengthens,
 * instead of compounding an extreme single-year move repeatedly. For the
 * "Normal market" scenario itself this is equivalent to compounding the
 * normal return every year, since there is no separate shock to apply once.
 */
export function simulateScenario(
  lines: AllocationLine[],
  amount: number,
  scenarioName: string,
  years: number = 1
): NamedScenarioResult {
  const scenarios = scenarioAssumptions.scenarios as Record<
    string,
    { categoryAssumptions: Record<string, { return: number }> }
  >;
  const scenario = scenarios[scenarioName];
  if (!scenario) {
    throw new Error(`Unknown simulation scenario: ${scenarioName}`);
  }
  const normalScenario = scenarios[NORMAL_SCENARIO];

  const shockPct = weightedReturnPct(lines, scenario.categoryAssumptions);
  const normalPct =
    scenarioName === NORMAL_SCENARIO || !normalScenario
      ? shockPct
      : weightedReturnPct(lines, normalScenario.categoryAssumptions);

  const remainingYears = Math.max(years - 1, 0);
  const growthFactor =
    (1 + shockPct / 100) * Math.pow(1 + normalPct / 100, remainingYears);

  const cagr = Math.pow(growthFactor, 1 / years) - 1;

  return {
    scenario: scenarioName,
    valueAfter: Math.round(amount * growthFactor),
    changePct: Math.round((growthFactor - 1) * 1000) / 10,
    cagrPct: Math.round(cagr * 1000) / 10,
  };
}
