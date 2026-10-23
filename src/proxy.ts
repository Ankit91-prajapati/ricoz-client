import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic route guard. It only checks that a session cookie EXISTS: it never trusts it.
 * The real check is the API (requireAuth) plus the client refresh in AuthContext.
 *
 * Reads the cookies your API already sets (both have path "/"):
 *   accessToken  (15 min)   refreshToken  (7 days)
 * Having the refreshToken is what keeps a user "signed in" after the access token expires.
 */

// Pages that don't need a session.
const PUBLIC_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password", "/auth"];

// ON in production, OFF in development (so you can build pages without logging in).
// Force it on locally with AUTH_GUARD=true, or off in production with AUTH_GUARD=false.
const GUARD_ENABLED = process.env.AUTH_GUARD
  ? process.env.AUTH_GUARD === "true"
  : process.env.NODE_ENV === "production";

const isPublic = (pathname: string) => PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const hasSession = request.cookies.has("refreshToken") || request.cookies.has("accessToken");

  // "/" is never a page: send people where they belong.
  if (pathname === "/") {
    return NextResponse.redirect(new URL(hasSession || !GUARD_ENABLED ? "/dashboard" : "/login", request.url));
  }

  if (!GUARD_ENABLED || isPublic(pathname) || hasSession) return NextResponse.next();

  // No session: go to login and come back afterwards.
  // (We deliberately do NOT bounce logged-in users away from /login here. A stale cookie would
  //  loop /login <-> /dashboard. The client does that once the refresh call has really succeeded.)
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // skip the API, Next internals and any file with an extension (images, fonts, robots.txt...)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};