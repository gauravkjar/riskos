import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createUser, getUserByEmail, hasAnyUserWithRole, appendAuditEvent } from "@/lib/db/store";
import type { Role } from "@/lib/auth/types";

const PRIVILEGED_ROLES: Role[] = ["ADMIN", "MODEL_ADMIN", "RISK_ADMIN"];

/**
 * Bootstrap-only escape hatch: creates a single privileged (non-INVESTOR)
 * user, but ONLY while zero ADMIN-role users exist in the database. Once any
 * ADMIN exists, this route always 403s — it is not a general admin-creation
 * endpoint, just a way to get the first internal account without a manual DB
 * edit. Intended to be called once via curl/script during setup, not exposed
 * in any UI.
 */
export async function POST(request: Request) {
  const adminExists = await hasAnyUserWithRole("ADMIN");
  if (adminExists) {
    return NextResponse.json(
      { error: "Bootstrap already used — an ADMIN user already exists." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password, role } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
    role?: unknown;
  };

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  const resolvedRole = typeof role === "string" ? (role as Role) : "ADMIN";
  if (!PRIVILEGED_ROLES.includes(resolvedRole)) {
    return NextResponse.json(
      { error: `role must be one of ${PRIVILEGED_ROLES.join(", ")}.` },
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
  const user = await createUser({ email, passwordHash, role: resolvedRole });

  await appendAuditEvent({
    userId: user.id,
    type: "user.bootstrap_admin_created",
    payload: { email: user.email, role: user.role },
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
