import { getSessionCookie } from "./cookies";
import { verifySessionToken } from "./session";
import { getUserById } from "@/lib/db/store";
import type { CurrentUser } from "./types";

/**
 * Server-only. Resolves the currently authenticated user (if any) from the
 * session cookie. Safe to call from Server Components, Route Handlers, and
 * Server Actions. Returns null if there is no valid, unexpired session, or
 * if the referenced user no longer exists.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getSessionCookie();
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = await getUserById(payload.userId);
  if (!user) return null;

  return { id: user.id, email: user.email, role: user.role };
}
