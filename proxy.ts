import { NextResponse, type NextRequest } from "next/server";

// Pages that don't need a session. Everything else is protected.
const PUBLIC_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password", "/auth"];

export function proxy(request: NextRequest) {
  // Turn this off when the API lives on another domain: this proxy can only see
  // cookies that are set for the frontend's own domain.
  if (process.env.AUTH_COOKIE_GUARD === "false") return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) return NextResponse.next();

  // Fast, optimistic check only: real validation happens on the API.
  // (If the cookies are stale, <ProtectedShell> sends the user to /login.)
  const hasSession =
    Boolean(request.cookies.get("refreshToken")?.value) ||
    Boolean(request.cookies.get("accessToken")?.value);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // skip Next internals and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
