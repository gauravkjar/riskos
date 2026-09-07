import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

/**
 * Test/utility endpoint confirming the session round-trips correctly.
 * Returns the current user (from the signed session cookie) or null.
 */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}
