import type { RiskRun } from "@/lib/orchestrator/types";
import { bandLabel } from "@/lib/engine/band-labels";

/**
 * Why a more aggressive band isn't being recommended, derived only from
 * fields already present on `run.score`. Extracted so both the narrative
 * template (`explainRun`) and investor-facing UI (the interactive
 * "Why not more aggressive / conservative" section on /my-portfolio) can
 * reuse the exact same reasoning without duplicating it.
 */
export function whyNotMoreAggressive(run: RiskRun): string {
  const { score } = run;
  if (score.band === "A") {
    return "You're already in the most aggressive band the model offers.";
  }
  return `To move to a more aggressive band, the binding constraint (${
    score.ccap1 <= score.tol1 ? "capacity" : "tolerance"
  }) would need to rise — for example a longer horizon or steadier income, not just a higher stated risk appetite.`;
}

/**
 * Why a more conservative band isn't being recommended. Same sourcing rule
 * as `whyNotMoreAggressive`.
 */
export function whyNotMoreConservative(run: RiskRun): string {
  const { score } = run;
  if (score.band === "VC") {
    return "You're already in the most conservative band the model offers.";
  }
  return "A more conservative allocation isn't being recommended because neither your capacity nor your stated tolerance is currently pushing your score that low.";
}

/**
 * Explanation Agent: takes only already-computed engine output as context
 * and narrates it. It never computes a score, band, or allocation — those
 * are read verbatim from `run`. This template stands in for an LLM call;
 * swap the body for a real API call while keeping the same signature and
 * the same "read-only over computed JSON" contract.
 */
export function explainRun(run: RiskRun): string {
  const { score, equitySuitability, allocationKey, allocationLines, fundCount } = run;
  const bandLabelText = bandLabel(score.band);

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

  return [
    `Your final risk score is ${score.finalScore}, placing you in the ${bandLabelText} (${score.band}) band. ${bindingConstraint.charAt(0).toUpperCase()}${bindingConstraint.slice(1)}.`,
    stage2Line,
    `Equity suitability: ${equitySuitability.verdict === "ELIGIBLE" ? "eligible for equity-forward allocation" : "kept debt-forward"} — ${equitySuitability.drivers.join(" ")}`,
    `This maps to allocation key ${allocationKey}: ${allocationLines
      .map((l) => `${l.category} ${l.percent}%`)
      .join(", ")}, spread across ${fundCount} funds.`,
    `Why not more aggressive: ${whyNotMoreAggressive(run)}`,
    `Why not more conservative: ${whyNotMoreConservative(run)}`,
  ].join("\n\n");
}
