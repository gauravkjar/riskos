import { NextResponse } from "next/server";
import { requireRole, HttpError } from "@/lib/auth/require";
import { getAllAssessments, getUserById } from "@/lib/db/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "ADVISOR", "RISK_ADMIN");

    const { id } = await params;
    const assessments = await getAllAssessments();
    const assessment = assessments.find((a) => a.id === id);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    const user = await getUserById(assessment.userId);

    return NextResponse.json({
      ...assessment,
      userEmail: user?.email ?? "unknown",
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // eslint-disable-next-line no-console
    console.error("[api/internal/profiles/[id]] GET failed", err);
    return NextResponse.json({ error: "Unable to load assessment." }, { status: 500 });
  }
}
