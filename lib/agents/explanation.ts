import type { RiskRun } from "@/lib/orchestrator/types";

const BAND_LABEL: Record<string, string> = {
  VC: "Very Conservative",
  C: "Conservative",
  M: "Moderate",
  MA: "Moderately Aggressive",
  A: "Aggressive",
};

/**
 * Explanation Agent: takes only already-computed engine output as context
 * and narrates it. It never computes a score, band, or allocation — those
 * are read verbatim from `run`. This template stands in for an LLM call;
 * swap the body for a real API call while keeping the same signature and
 * the same "read-only over computed JSON" contract.
 */
export function explainRun(run: RiskRun): string {
  const { score, equitySuitability, allocationKey, allocationLines, fundCount } = run;
  const bandLabel = BAND_LABEL[score.band] ?? score.band;

  const bindingConstraint =
    score.ccap1 <= score.tol1
      ? "your capacity (time horizon and income stability) is the tighter limit, not your stated comfort with losses"
      : "your stated comfort with losses is the tighter limit, not your capacity";

  const stage2Line = run.stage2
    ? `Adding your experience and liquidity answers ${
        score.ccap2! < score.ccap1
          ? `pulled your ceiling down further to ${score.ccap2}, because you indicated you may need this money sooner than your horizon alone suggests`
          : "confirmed your capacity ceiling without tightening it further"
      }, giving a High-confidence final score of ${score.finalScore}.`
    : `You skipped the optional Stage 2 questions, so this is a Medium-confidence result based on Stage 1 alone.`;

  const whyNotMoreAggressive =
    score.band !== "A"
      ? `To move to a more aggressive band, the binding constraint (${
          score.ccap1 <= score.tol1 ? "capacity" : "tolerance"
        }) would need to rise — for example a longer horizon or steadier income, not just a higher stated risk appetite.`
      : `You're already in the most aggressive band the model offers.`;

  const whyNotMoreConservative =
    score.band !== "VC"
      ? `A more conservative allocation isn't being recommended because neither your capacity nor your stated tolerance is currently pushing your score that low.`
      : `You're already in the most conservative band the model offers.`;

  return [
    `Your final risk score is ${score.finalScore}, placing you in the ${bandLabel} (${score.band}) band. ${bindingConstraint.charAt(0).toUpperCase()}${bindingConstraint.slice(1)}.`,
    stage2Line,
    `Equity suitability: ${equitySuitability.verdict === "ELIGIBLE" ? "eligible for equity-forward allocation" : "kept debt-forward"} — ${equitySuitability.drivers.join(" ")}`,
    `This maps to allocation key ${allocationKey}: ${allocationLines
      .map((l) => `${l.category} ${l.percent}%`)
      .join(", ")}, spread across ${fundCount} funds.`,
    `Why not more aggressive: ${whyNotMoreAggressive}`,
    `Why not more conservative: ${whyNotMoreConservative}`,
  ].join("\n\n");
}
