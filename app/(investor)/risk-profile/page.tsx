import Link from "next/link";
import { requireUser } from "@/lib/auth/require";
import { getAssessmentsByUser } from "@/lib/db/store";
import { bandLabel } from "@/lib/engine/band-labels";
import { explainRun } from "@/lib/agents/explanation";
import type { RiskRun } from "@/lib/orchestrator/types";

function confidenceSentence(run: RiskRun): string {
  if (run.score.confidence === "High") {
    return "You answered the full questionnaire, including the optional follow-up questions, so we're highly confident this reflects your actual situation.";
  }
  return "This is based on the core questionnaire only. Answering the optional follow-up questions would let us confirm this with higher confidence.";
}

interface Factor {
  label: string;
  detail: string;
}

function supportingFactors(run: RiskRun): Factor[] {
  const { score } = run;
  const factors: Factor[] = [];

  if (score.ccap1 <= score.tol1) {
    factors.push({
      label: "Your time horizon and income were the main driver",
      detail:
        "How long you plan to stay invested and how stable your income is set the ceiling for your profile — your comfort with short-term losses didn't need to be limited further.",
    });
  } else {
    factors.push({
      label: "Your stated comfort with losses was the main driver",
      detail:
        "Your time horizon and income could have supported a bit more risk, but your own comfort with short-term losses set the ceiling for your profile.",
    });
  }

  if (run.stage2) {
    if (score.ccap2 !== null && score.ccap2 < score.ccap1) {
      factors.push({
        label: "Your experience and liquidity needs tightened things further",
        detail:
          "Based on your investing experience and how soon you might need this money, we brought your ceiling down a bit from where your core answers alone would have placed it.",
      });
    } else {
      factors.push({
        label: "Your experience and liquidity needs confirmed the result",
        detail:
          "Your investing experience and liquidity answers lined up with your core answers, so nothing changed — but we could confirm the result with more confidence.",
      });
    }
  } else {
    factors.push({
      label: "Optional follow-up questions were skipped",
      detail:
        "You didn't answer the optional experience and liquidity questions, so this result is based on the core questionnaire alone.",
    });
  }

  const equityEligible = run.equitySuitability.verdict === "ELIGIBLE";
  factors.push({
    label: equityEligible
      ? "Your profile supports growth-oriented investments"
      : "Your profile favors stability-oriented investments",
    detail: equityEligible
      ? "Your overall profile supports an allocation weighted toward growth-oriented (equity) categories."
      : "Your overall profile keeps the allocation weighted toward stability-oriented (debt) categories for now.",
  });

  return factors;
}

export default async function InvestorRiskProfilePage() {
  const user = await requireUser();
  const assessments = await getAssessmentsByUser(user.id);
  const latest = assessments[0];

  if (!latest) {
    return (
      <div className="glass-panel rounded-lg p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          See how your risk profile shapes your plan.
        </h1>
        <p className="mt-2 text-sm text-muted">
          You haven&apos;t completed the risk questionnaire yet.
        </p>
        <Link
          href="/questionnaire"
          className="mt-6 inline-block rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-strong hover:bg-accent/15"
        >
          Start the questionnaire
        </Link>
      </div>
    );
  }

  const run = latest.run;
  const { score } = run;
  const label = bandLabel(score.band);
  const factors = supportingFactors(run);
  const narrative = explainRun(run);

  return (
    <div className="flex flex-col gap-8">
      <div className="glass-panel glow-accent rounded-lg p-8 text-center">
        <p className="text-sm text-muted">Your risk profile</p>
        <p className="mt-4 font-mono text-6xl font-semibold tabular text-accent-strong">
          {score.finalScore}
        </p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          {label}
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted">
          {confidenceSentence(run)}
        </p>
      </div>

      <div className="glass-panel rounded-lg p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          What shaped this result
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {factors.map((factor) => (
            <div
              key={factor.label}
              className="rounded-md border border-border bg-surface-raised p-4"
            >
              <p className="text-sm font-medium text-foreground">{factor.label}</p>
              <p className="mt-1.5 text-sm text-muted">{factor.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 whitespace-pre-line text-sm text-muted-2">{narrative}</p>
      </div>

      <div className="glass-panel rounded-lg p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Your assessment history
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {assessments.map((a) => (
            <li
              key={a.id}
              className={`flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm ${
                a.status === "superseded" ? "opacity-60" : ""
              }`}
            >
              <span className="text-foreground">
                Version {a.version} — {bandLabel(a.run.score.band)}
              </span>
              <span className="flex items-center gap-3 text-muted-2">
                {new Date(a.createdAt).toLocaleDateString()}
                {a.status === "active" ? (
                  <span className="rounded-full bg-accent-dim px-2 py-0.5 text-xs text-accent-strong">
                    Current
                  </span>
                ) : (
                  <span className="text-xs">Superseded</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end">
        <Link
          href="/my-portfolio"
          className="rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-strong hover:bg-accent/15"
        >
          See your recommended portfolio
        </Link>
      </div>
    </div>
  );
}
