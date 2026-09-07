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
 * Computes a one-year illustrative outcome for `lines` under a single named
 * scenario (Normal market / Market correction / Severe downturn / Crisis /
 * Recovery), using the per-category `return` figures in
 * `scenario-assumptions.json`'s `scenarios[scenarioName].categoryAssumptions`.
 * Additive to `simulatePortfolio` — does not change its behavior or
 * signature. Categories with no assumption entry for the scenario are
 * skipped (weighted return simply omits them), mirroring the existing
 * `simulatePortfolio` behavior.
 */
export function simulateScenario(
  lines: AllocationLine[],
  amount: number,
  scenarioName: string
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

  let changePct = 0;
  for (const line of lines) {
    const a = assumptions[line.category];
    if (!a) continue;
    const weight = line.percent / 100;
    changePct += a.return * weight;
  }

  changePct = Math.round(changePct * 10) / 10;

  return {
    scenario: scenarioName,
    valueAfter: Math.round(amount * (1 + changePct / 100)),
    changePct,
  };
}
