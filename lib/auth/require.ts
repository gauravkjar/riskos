import { getCurrentUser } from "./current-user";
import type { CurrentUser, Role } from "./types";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

/**
 * Server-only. Returns the current user or throws an HttpError(401) if no
 * one is logged in. Intended for use inside route handlers / server actions
 * — callers should catch HttpError and translate it into a Response.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new HttpError(401, "Authentication required.");
  }
  return user;
}

/**
 * Server-only. Returns the current user if their role is one of `roles`, or
 * throws HttpError(401) if not logged in, or HttpError(403) if logged in but
 * not authorized. This is the enforcement point — UI-level hiding of
 * controls is not sufficient on its own.
 */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "You do not have permission to perform this action.");
  }
  return user;
}
