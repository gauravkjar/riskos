import { describe, expect, it } from "vitest";
import {
  allocationForBand,
  availableBasketSizes,
} from "@/lib/engine/allocation";

describe("allocation", () => {
  it("returns the MA-3 row verbatim from the ported table", () => {
    const { key, lines } = allocationForBand("MA", 3);
    expect(key).toBe("MA-3");
    expect(lines).toEqual([
      { category: "Flexi Cap", percent: 45 },
      { category: "Large Cap", percent: 30 },
      { category: "Mid Cap", percent: 25 },
    ]);
    expect(lines.reduce((sum, l) => sum + l.percent, 0)).toBe(100);
  });

  it("only exposes basket sizes 3 and 4 for MA/A bands (no size-2 row exists)", () => {
    expect(availableBasketSizes("MA")).toEqual([3, 4]);
    expect(availableBasketSizes("A")).toEqual([3, 4]);
    expect(availableBasketSizes("VC")).toEqual([2, 3, 4]);
  });
});
