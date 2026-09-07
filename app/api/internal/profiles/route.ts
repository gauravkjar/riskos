import { NextResponse } from "next/server";
import { requireRole, HttpError } from "@/lib/auth/require";
import { getAllAssessments, getUserById } from "@/lib/db/store";

export interface ProfileListRow {
  profileId: string;
  assessmentId: string;
  userId: string;
  userEmail: string;
  createdAt: string;
  version: number;
  status: "active" | "superseded";
  finalScore: number;
  band: string;
  equityVerdict: string;
  allocationKey: string;
  fundCount: number;
  modelVersion: string;
}

export async function GET() {
  try {
    await requireRole("ADMIN", "ADVISOR", "RISK_ADMIN");

    const assessments = await getAllAssessments();
    const emailCache = new Map<string, string>();

    const rows: ProfileListRow[] = [];
    for (const a of assessments) {
      let email = emailCache.get(a.userId);
      if (!email) {
        const user = await getUserById(a.userId);
        email = user?.email ?? "unknown";
        emailCache.set(a.userId, email);
      }
      rows.push({
        profileId: a.profileId,
        assessmentId: a.id,
        userId: a.userId,
        userEmail: email,
        createdAt: a.createdAt,
        version: a.version,
        status: a.status,
        finalScore: a.run.score.finalScore,
        band: a.run.score.band,
        equityVerdict: a.run.equitySuitability.verdict,
        allocationKey: a.run.allocationKey,
        fundCount: a.run.fundCount,
        modelVersion: a.run.modelVersion,
      });
    }

    return NextResponse.json(rows);
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // eslint-disable-next-line no-console
    console.error("[api/internal/profiles] GET failed", err);
    return NextResponse.json({ error: "Unable to load profiles." }, { status: 500 });
  }
}
