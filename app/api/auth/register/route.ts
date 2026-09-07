import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createUser, getUserByEmail, appendAuditEvent } from "@/lib/db/store";

/**
 * Public registration endpoint. Always creates an INVESTOR — this endpoint
 * intentionally ignores/rejects any attempt to self-assign a privileged role
 * (ADVISOR/ADMIN/RISK_ADMIN/MODEL_ADMIN). Privileged roles must be granted
 * out-of-band (e.g. an admin-only endpoint or manual DB edit) in later phases.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = hashPassword(password);
  const user = await createUser({ email, passwordHash, role: "INVESTOR" });

  await appendAuditEvent({
    userId: user.id,
    type: "user.registered",
    payload: { email: user.email },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}
