import { describe, expect, it } from "vitest";
import { simulateScenario, SCENARIO_NAMES } from "@/lib/engine/simulator";
import type { AllocationLine } from "@/lib/engine/types";

describe("simulateScenario", () => {
  const equityHeavy: AllocationLine[] = [
    { category: "Flexi Cap", percent: 40 },
    { category: "Mid Cap", percent: 35 },
    { category: "Small Cap", percent: 25 },
  ];
  const amount = 100000;

  it("returns all 5 named scenarios", () => {
    const results = SCENARIO_NAMES.map((name) =>
      simulateScenario(equityHeavy, 100000, name)
    );
    expect(results.map((r) => r.scenario)).toEqual([...SCENARIO_NAMES]);
  });

  it("produces a more negative changePct in Crisis than in Normal market for an equity-heavy allocation", () => {
    const normal = simulateScenario(equityHeavy, 100000, "Normal market");
    const crisis = simulateScenario(equityHeavy, 100000, "Crisis");
    expect(normal.changePct).toBeGreaterThan(0);
    expect(crisis.changePct).toBeLessThan(0);
    expect(crisis.changePct).toBeLessThan(normal.changePct);
  });

  it("Recovery is more positive than Normal market for an equity-heavy allocation", () => {
    const normal = simulateScenario(equityHeavy, 100000, "Normal market");
    const recovery = simulateScenario(equityHeavy, 100000, "Recovery");
    expect(recovery.changePct).toBeGreaterThan(normal.changePct);
  });

  it("throws for an unknown scenario name", () => {
    expect(() => simulateScenario(equityHeavy, 100000, "Not a scenario")).toThrow();
  });

  it("compounds Normal market's own return over the given horizon, since it has no separate shock to revert from", () => {
    const oneYear = simulateScenario(equityHeavy, 100000, "Normal market", 1);
    const fiveYear = simulateScenario(equityHeavy, 100000, "Normal market", 5);
    expect(fiveYear.valueAfter).toBeGreaterThan(oneYear.valueAfter);

    const annualFactor = 1 + oneYear.changePct / 100;
    const expectedFiveYearValue = Math.round(100000 * Math.pow(annualFactor, 5));
    expect(fiveYear.valueAfter).toBe(expectedFiveYearValue);
  });

  it("defaults to a 1-year horizon when years is omitted", () => {
    const withDefault = simulateScenario(equityHeavy, 100000, "Normal market");
    const explicitOne = simulateScenario(equityHeavy, 100000, "Normal market", 1);
    expect(withDefault).toEqual(explicitOne);
  });

  it("tapers a shock scenario's downside/upside over a longer horizon instead of compounding the shock every year", () => {
    const oneYearCrisis = simulateScenario(equityHeavy, 100000, "Crisis", 1);
    const tenYearCrisis = simulateScenario(equityHeavy, 100000, "Crisis", 10);
    // A 10-year holder absorbs the crisis once, then reverts to normal
    // growth — so the loss should shrink drastically, not compound to
    // near-zero.
    expect(tenYearCrisis.changePct).toBeGreaterThan(oneYearCrisis.changePct);
    expect(tenYearCrisis.valueAfter).toBeGreaterThan(amount * 0.5);

    const oneYearRecovery = simulateScenario(equityHeavy, 100000, "Recovery", 1);
    const tenYearRecovery = simulateScenario(equityHeavy, 100000, "Recovery", 10);
    // Likewise the recovery-year pop shouldn't compound every year either.
    const recoveryFactor1yr = oneYearRecovery.valueAfter / amount;
    const recoveryFactor10yr = tenYearRecovery.valueAfter / amount;
    expect(recoveryFactor10yr).toBeLessThan(Math.pow(recoveryFactor1yr, 10));
  });

  it("reports cagrPct consistent with changePct and years, and equal to changePct for a 1-year horizon", () => {
    const oneYear = simulateScenario(equityHeavy, amount, "Normal market", 1);
    expect(oneYear.cagrPct).toBeCloseTo(oneYear.changePct, 1);

    const tenYear = simulateScenario(equityHeavy, amount, "Crisis", 10);
    const impliedGrowthFactor = Math.pow(1 + tenYear.cagrPct / 100, 10);
    const expectedValue = Math.round(amount * impliedGrowthFactor);
    expect(Math.abs(expectedValue - tenYear.valueAfter)).toBeLessThan(amount * 0.01);
  });
});
