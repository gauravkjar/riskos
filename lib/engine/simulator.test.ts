import { describe, expect, it } from "vitest";
import { simulateScenario, SCENARIO_NAMES } from "@/lib/engine/simulator";
import type { AllocationLine } from "@/lib/engine/types";

describe("simulateScenario", () => {
  const equityHeavy: AllocationLine[] = [
    { category: "Flexi Cap", percent: 40 },
    { category: "Mid Cap", percent: 35 },
    { category: "Small Cap", percent: 25 },
  ];

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

  it("compounds the annual return over the given horizon instead of returning a flat one-year figure", () => {
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
});
