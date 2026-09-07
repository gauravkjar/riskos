import type { BandCode } from "./types";
import { availableBasketSizes, defaultBasketSize } from "./allocation";

/**
 * Portfolio Construction Agent: recommended fund count per band.
 * This is the same basket-size rule table used by the Allocation Agent
 * (Sheet 6/7 of MF_Risk_Engine.xlsx) — re-exported under its own name
 * because the two agents are conceptually distinct even though they
 * share one config table.
 */
export function recommendedFundCount(band: BandCode): number {
  return defaultBasketSize(band);
}

export function availableFundCounts(band: BandCode): number[] {
  return availableBasketSizes(band);
}
