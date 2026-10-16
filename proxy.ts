
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Allow public authentication pages
  const isPublic = PUBLIC_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // Check for session cookies
  const hasSession =
    Boolean(request.cookies.get("accessToken")?.value) ||
    Boolean(request.cookies.get("refreshToken")?.value);

  // Redirect unauthenticated users to login
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
