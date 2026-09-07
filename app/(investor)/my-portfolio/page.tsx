import Link from "next/link";
import { requireUser } from "@/lib/auth/require";
import { getAssessmentsByUser } from "@/lib/db/store";
import { categoryRole } from "@/lib/engine/category-roles";
import { whyNotMoreAggressive, whyNotMoreConservative } from "@/lib/agents/explanation";
import { WhyNotPanel } from "@/components/investor/why-not-panel";

export default async function InvestorPortfolioPage() {
  const user = await requireUser();
  const assessments = await getAssessmentsByUser(user.id);
  const latest = assessments[0];

  if (!latest) {
    return (
      <div className="glass-panel rounded-lg p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Review your portfolio at a glance.
        </h1>
        <p className="mt-2 text-sm text-muted">
          Complete the risk questionnaire first to get a recommended portfolio.
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
  const { allocationLines, fundCount } = run;

  return (
    <div className="flex flex-col gap-8">
      <div className="glass-panel rounded-lg p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Your recommended portfolio
        </h1>
        <p className="mt-2 text-sm text-muted">
          Spread across {fundCount} funds for diversification, so no single fund
          drives your outcome.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {allocationLines.map((line) => (
            <div key={line.category}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{line.category}</span>
                <span className="tabular text-accent-strong">{line.percent}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${line.percent}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">{categoryRole(line.category)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-lg p-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Not sure this is right for you?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Here&apos;s the reasoning behind why this allocation isn&apos;t more or
          less aggressive.
        </p>
        <div className="mt-4">
          <WhyNotPanel
            moreAggressive={whyNotMoreAggressive(run)}
            moreConservative={whyNotMoreConservative(run)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/simulation"
          className="rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-strong hover:bg-accent/15"
        >
          Simulate how this might perform
        </Link>
      </div>
    </div>
  );
}
