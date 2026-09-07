import { NextResponse } from "next/server";
import { requireRole, HttpError } from "@/lib/auth/require";
import { getAuditEvents, getUserById } from "@/lib/db/store";

export async function GET() {
  try {
    await requireRole("ADMIN", "RISK_ADMIN", "MODEL_ADMIN");

    const events = await getAuditEvents();
    const emailCache = new Map<string, string | null>();

    const enriched = [];
    for (const event of events) {
      let email: string | null = null;
      if (event.userId) {
        if (emailCache.has(event.userId)) {
          email = emailCache.get(event.userId) ?? null;
        } else {
          const user = await getUserById(event.userId);
          email = user?.email ?? null;
          emailCache.set(event.userId, email);
        }
      }
      enriched.push({ ...event, userEmail: email });
    }

    return NextResponse.json(enriched);
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // eslint-disable-next-line no-console
    console.error("[api/internal/audit-log] GET failed", err);
    return NextResponse.json({ error: "Unable to load audit log." }, { status: 500 });
  }
}
