import { NextResponse } from "next/server";
import { requireUser, HttpError } from "@/lib/auth/require";
import { getAssessmentsByUser } from "@/lib/db/store";
import { simulateScenario, SCENARIO_NAMES } from "@/lib/engine/simulator";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { amount } = (body ?? {}) as { amount?: unknown };
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "amount is required and must be a positive number." },
        { status: 400 }
      );
    }

    const assessments = await getAssessmentsByUser(user.id);
    const latest = assessments[0];
    if (!latest) {
      return NextResponse.json(
        { error: "Complete the risk questionnaire before simulating." },
        { status: 400 }
      );
    }

    // The allocation always comes from the user's own latest engine-computed
    // run — never from client input.
    const lines = latest.run.allocationLines;

    const scenarios = SCENARIO_NAMES.map((name) =>
      simulateScenario(lines, amount, name)
    );

    return NextResponse.json({ amount, allocationLines: lines, scenarios });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // eslint-disable-next-line no-console
    console.error("[api/simulate] POST failed", err);
    return NextResponse.json({ error: "Unable to run simulation." }, { status: 500 });
  }
}
