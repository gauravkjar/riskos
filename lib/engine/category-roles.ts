/**
 * Plain-language "why this category" one-liners, keyed by the exact category
 * name strings used in lib/config/allocation-table.json. Static lookup only
 * — no per-fund research (that's a separate later Fund Intelligence phase).
 */
export const CATEGORY_ROLE: Record<string, string> = {
  "Liquid Fund":
    "Keeps a portion of your money highly stable and easy to access — the anchor of your portfolio.",
  "Ultra Short Duration":
    "Adds a little more yield than a pure liquid fund while still staying low-risk and stable.",
  "Corporate Bond":
    "Aims for steady income from high-quality borrowers, with modest ups and downs.",
  "Short Duration":
    "Balances stability and income over a short time frame.",
  "Banking & PSU Debt":
    "Invests in debt from banks and government-backed institutions for steady, lower-risk income.",
  "Arbitrage Fund":
    "Captures small, low-risk pricing gaps in the market — a stability-oriented, tax-efficient holding.",
  "Balanced Advantage":
    "Automatically shifts between equity and debt as markets move, smoothing out some of the ride.",
  "Large Cap": "Invests in large, established companies for steadier long-term growth.",
  "Flexi Cap":
    "Invests across companies of all sizes, giving the fund manager flexibility to chase growth wherever it appears.",
  "Mid Cap":
    "Targets mid-sized, growing companies — more growth potential, with more volatility.",
  "Small Cap":
    "Targets smaller, higher-growth companies — the most growth potential, and the most volatility.",
  "Gold ETF":
    "Adds a diversifier that often moves differently from equities and debt, helping smooth overall returns.",
};

export function categoryRole(category: string): string {
  return (
    CATEGORY_ROLE[category] ??
    "Plays a supporting role in your overall diversification."
  );
}
