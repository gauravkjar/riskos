import type { BandCode } from "./types";

/**
 * Plain-English labels for the model's band codes. Shared between the
 * Explanation Agent and investor-facing pages so the mapping only lives in
 * one place — investor copy must never surface raw codes like "MA".
 */
export const BAND_LABEL: Record<BandCode, string> = {
  VC: "Very Conservative",
  C: "Conservative",
  M: "Moderate",
  MA: "Moderately Aggressive",
  A: "Aggressive",
};

export function bandLabel(band: BandCode | string): string {
  return BAND_LABEL[band as BandCode] ?? band;
}
