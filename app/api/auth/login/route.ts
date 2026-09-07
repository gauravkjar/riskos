import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/session";
import { setSessionCookie, SESSION_MAX_AGE } from "@/lib/auth/cookies";
import { getUserByEmail, appendAuditEvent } from "@/lib/db/store";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const token = createSessionToken({ userId: user.id, role: user.role, exp });
  await setSessionCookie(token);

  await appendAuditEvent({
    userId: user.id,
    type: "user.login",
    payload: { email: user.email },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}
