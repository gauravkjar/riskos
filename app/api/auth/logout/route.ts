import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { getCurrentUser } from "@/lib/auth/current-user";
import { appendAuditEvent } from "@/lib/db/store";

export async function POST() {
  const user = await getCurrentUser();
  await clearSessionCookie();

  if (user) {
    await appendAuditEvent({
      userId: user.id,
      type: "user.logout",
      payload: { email: user.email },
    });
  }

  return NextResponse.json({ ok: true });
}
