import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

const isPublic = (pathname: string) =>
  PUBLIC_PREFIXES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken =
    request.cookies.get("accessToken")?.value;

  const refreshToken =
    request.cookies.get("refreshToken")?.value;

  const hasSession =
    !!accessToken || !!refreshToken;

  // Root route
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(
        hasSession ? "/dashboard" : "/login",
        request.url
      )
    );
  }

  // Public routes
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Protected routes
  if (!hasSession) {
    const loginUrl = new URL(
      "/login",
      request.url
    );

    loginUrl.searchParams.set(
      "next",
      pathname + search
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};