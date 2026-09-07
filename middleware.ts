import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import type { SessionPayload } from "@/lib/auth/types";

// Investor-facing routes gated by this middleware.
const PROTECTED_PREFIXES = [
  "/home",
  "/risk-profile",
  "/my-portfolio",
  "/simulation",
  "/profile",
  "/questionnaire",
];

const AUTH_PAGES = ["/login", "/register"];

// Internal staff PAGE routes. `/api/internal/*` and `/api/*` in general are
// NOT gated here — those routes self-enforce via requireUser()/requireRole()
// inside each handler. `/staff-login` itself must stay ungated to avoid a
// redirect loop.
const INTERNAL_PREFIXES = [
  "/profiler",
  "/risk-intelligence",
  "/portfolio",
  "/simulator",
  "/funds",
  "/control-room",
  "/model-config",
  "/audit-log",
  "/profiles",
];

const INTERNAL_LOGIN_PAGE = "/staff-login";

function getSessionPayload(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const payload = getSessionPayload(request);

  const isProtected = matchesPrefix(pathname, PROTECTED_PREFIXES);
  const isAuthPage = matchesPrefix(pathname, AUTH_PAGES);

  if (isProtected && !payload) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAuthPage && payload) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Internal dashboard: the "/" overview plus every prefix above. Every
  // non-INVESTOR role is treated as "staff" for this page-level gate; the
  // finer-grained (e.g. MODEL_ADMIN-only, ADMIN/RISK_ADMIN-only) checks live
  // at the API layer and are unaffected by this middleware.
  const isInternalRoot = pathname === "/";
  const isInternalPage = isInternalRoot || matchesPrefix(pathname, INTERNAL_PREFIXES);

  if (isInternalPage) {
    if (!payload) {
      const url = request.nextUrl.clone();
      url.pathname = INTERNAL_LOGIN_PAGE;
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (payload.role === "INVESTOR") {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// This middleware relies on Node's `crypto` (createHmac) via
// lib/auth/session.ts's verifySessionToken, which is not available on the
// default Edge runtime. Next.js 16 supports running middleware on the
// Node.js runtime — opt in explicitly so the HMAC verification works
// without reimplementing it with Web Crypto.
export const config = {
  runtime: "nodejs",
  matcher: [
    "/",
    "/home/:path*",
    "/risk-profile/:path*",
    "/my-portfolio/:path*",
    "/simulation/:path*",
    "/profile/:path*",
    "/questionnaire/:path*",
    "/login",
    "/register",
    "/profiler/:path*",
    "/risk-intelligence/:path*",
    "/portfolio/:path*",
    "/simulator/:path*",
    "/funds/:path*",
    "/control-room/:path*",
    "/model-config/:path*",
    "/audit-log/:path*",
    "/profiles/:path*",
  ],
};
