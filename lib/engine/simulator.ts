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
  changePct: number;
}

export const SCENARIO_NAMES = [
  "Normal market",
  "Market correction",
  "Severe downturn",
  "Crisis",
  "Recovery",
] as const;

export type ScenarioName = (typeof SCENARIO_NAMES)[number];

/**
 * Computes an illustrative outcome for `lines` under a single named scenario
 * (Normal market / Market correction / Severe downturn / Crisis / Recovery),
 * using the per-category `return` figures in `scenario-assumptions.json`'s
 * `scenarios[scenarioName].categoryAssumptions` as an annual return, then
 * compounding it over `years` (default 1). Categories with no assumption
 * entry for the scenario are skipped (weighted return simply omits them),
 * mirroring the existing `simulatePortfolio` behavior.
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
  const assumptions = scenario.categoryAssumptions;

  let annualChangePct = 0;
  for (const line of lines) {
    const a = assumptions[line.category];
    if (!a) continue;
    const weight = line.percent / 100;
    annualChangePct += a.return * weight;
  }

  annualChangePct = Math.round(annualChangePct * 10) / 10;

  const growthFactor = Math.pow(1 + annualChangePct / 100, years);

  return {
    scenario: scenarioName,
    valueAfter: Math.round(amount * growthFactor),
    changePct: Math.round((growthFactor - 1) * 1000) / 10,
  };
}
