import Link from "next/link";
import { requireUser } from "@/lib/auth/require";
import { getAssessmentsByUser } from "@/lib/db/store";
import { SimulationPanel } from "@/components/investor/simulation-panel";

export default async function InvestorSimulationPage() {
  const user = await requireUser();
  const assessments = await getAssessmentsByUser(user.id);
  const latest = assessments[0];

  if (!latest) {
    return (
      <div className="glass-panel rounded-lg p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Explore how your portfolio might perform.
        </h1>
        <p className="mt-2 text-sm text-muted">
          Complete the risk questionnaire first to get a recommended portfolio
          to simulate.
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

  return <SimulationPanel allocationLines={latest.run.allocationLines} />;
}
