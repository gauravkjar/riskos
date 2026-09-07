import { describe, expect, it } from "vitest";
import { computeRiskScore } from "@/lib/engine/risk-scoring";

describe("computeRiskScore", () => {
  it("reproduces the MF_Risk_Engine.xlsx Sheet 8 worked example (golden path)", () => {
    const result = computeRiskScore(
      {
        horizon: "tenPlusYears", // 100
        drawdownReaction: "hold", // 70
        incomeStability: "twoIncomes", // 70
      },
      {
        experience: "twoPlusYears", // trust factor 0.9
        liquidity: "flexible", // cap 100
      }
    );

    // Ccap1 = 100*0.7 + 70*0.3 = 91
    expect(result.ccap1).toBe(91);
    // Tol1 = 70, Stage1 = MIN(91, 70) = 70
    expect(result.tol1).toBe(70);
    expect(result.stage1Score).toBe(70);
    // Ccap2 = MIN(91, 100) = 91
    expect(result.ccap2).toBe(91);
    // Tol2 = 70*0.9 + 50*0.1 = 68
    expect(result.tol2).toBe(68);
    // Stage2 = MIN(91, 68) = 68
    expect(result.stage2Score).toBe(68);
    // Final = 70*0.65 + 68*0.35 = 69.3
    expect(result.finalScore).toBe(69.3);
    expect(result.band).toBe("MA");
    expect(result.confidence).toBe("High");
  });

  it("produces a Medium-confidence Stage-1-only result when Stage 2 is skipped", () => {
    const result = computeRiskScore({
      horizon: "tenPlusYears", // 100
      drawdownReaction: "hold", // 70
      incomeStability: "twoIncomes", // 70
    });

    expect(result.ccap1).toBe(91);
    expect(result.stage1Score).toBe(70);
    expect(result.finalScore).toBe(70);
    expect(result.band).toBe("MA");
    expect(result.confidence).toBe("Medium");
    expect(result.stage2Score).toBeNull();
  });

  it("lets the liquidity cap bind and pull Stage 2 below Stage 1 (capacity tightens down only)", () => {
    const result = computeRiskScore(
      {
        horizon: "tenPlusYears", // 100
        drawdownReaction: "buyMore", // 100
        incomeStability: "twoIncomes", // 70
      },
      {
        experience: "veryActive", // trust factor 1.0 -> no tolerance shrink
        liquidity: "needIn12Months", // cap 40
      }
    );

    // Ccap1 = 100*0.7 + 70*0.3 = 91, Tol1 = 100, Stage1 = MIN(91,100) = 91
    expect(result.ccap1).toBe(91);
    expect(result.stage1Score).toBe(91);
    // Ccap2 = MIN(91, 40) = 40 (liquidity cap binds)
    expect(result.ccap2).toBe(40);
    // Tol2 = 100*1.0 + 50*0 = 100
    expect(result.tol2).toBe(100);
    // Stage2 = MIN(40, 100) = 40
    expect(result.stage2Score).toBe(40);
    // Final = 91*0.65 + 40*0.35 = 73.15 -> rounded to 73.2 (one decimal)
    expect(result.finalScore).toBe(73.2);
    expect(result.band).toBe("MA");
    expect(result.confidence).toBe("High");
  });
});
