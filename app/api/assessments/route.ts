import { NextResponse } from "next/server";
import { requireUser, HttpError } from "@/lib/auth/require";
import {
  getProfilesByUser,
  createProfile,
  createAssessment,
  getAssessmentsByUser,
  appendAuditEvent,
} from "@/lib/db/store";
import { runRiskEngine } from "@/lib/orchestrator/run";
import { getLatestModelConfig } from "@/lib/db/store";
import type { Stage1Answers, Stage2Answers } from "@/lib/engine/types";

const VALID_HORIZON = ["lessThanTwoYears", "twoToFiveYears", "sixToNineYears", "tenPlusYears"];
const VALID_DRAWDOWN = ["sellAll", "sellPortion", "hold", "buyMore"];
const VALID_INCOME = ["irregular", "oneSalary", "twoIncomes", "multipleOrBusiness"];
const VALID_EXPERIENCE = ["fdOnly", "fewSips", "twoPlusYears", "veryActive"];
const VALID_LIQUIDITY = ["needIn12Months", "mayNeedSome", "flexible", "otherInvestments"];

function isValidStage1(value: unknown): value is Stage1Answers {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    VALID_HORIZON.includes(v.horizon as string) &&
    VALID_DRAWDOWN.includes(v.drawdownReaction as string) &&
    VALID_INCOME.includes(v.incomeStability as string)
  );
}

function isValidStage2(value: unknown): value is Stage2Answers {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    VALID_EXPERIENCE.includes(v.experience as string) &&
    VALID_LIQUIDITY.includes(v.liquidity as string)
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { stage1, stage2 } = (body ?? {}) as { stage1?: unknown; stage2?: unknown };

    if (!isValidStage1(stage1)) {
      return NextResponse.json(
        { error: "stage1 answers are required and must be valid." },
        { status: 400 }
      );
    }

    let stage2Answers: Stage2Answers | null = null;
    if (stage2 !== undefined && stage2 !== null) {
      if (!isValidStage2(stage2)) {
        return NextResponse.json(
          { error: "stage2 answers, if provided, must be valid." },
          { status: 400 }
        );
      }
      stage2Answers = stage2;
    }

    // The score/band/allocation is always computed server-side from the raw
    // answers — a client-supplied run/score is never trusted. Config is the
    // latest saved Model Configuration version (falls back to shipped
    // defaults if a MODEL_ADMIN has never saved one), so changes made in
    // /model-config take effect for new investor assessments immediately.
    const engineConfig = await getLatestModelConfig();
    const run = runRiskEngine(stage1, stage2Answers, undefined, engineConfig);

    const profiles = await getProfilesByUser(user.id);
    let profile = profiles[0];
    if (!profile) {
      profile = await createProfile({ userId: user.id, displayName: user.email });
    }

    const assessment = await createAssessment({
      userId: user.id,
      profileId: profile.id,
      answers: { stage1, stage2: stage2Answers },
      run,
    });

    await appendAuditEvent({
      userId: user.id,
      type: "assessment.created",
      payload: {
        assessmentId: assessment.id,
        profileId: profile.id,
        version: assessment.version,
        band: run.score.band,
        finalScore: run.score.finalScore,
        modelVersion: run.modelVersion,
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // eslint-disable-next-line no-console
    console.error("[api/assessments] POST failed", err);
    return NextResponse.json({ error: "Unable to create assessment." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const assessments = await getAssessmentsByUser(user.id);
    return NextResponse.json(assessments);
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // eslint-disable-next-line no-console
    console.error("[api/assessments] GET failed", err);
    return NextResponse.json({ error: "Unable to load assessments." }, { status: 500 });
  }
}
