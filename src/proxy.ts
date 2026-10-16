
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const hasSession =
    !!request.cookies.get("accessToken")?.value ||
    !!request.cookies.get("refreshToken")?.value;

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect signed-in users away from login and register
  if (isPublic && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public pages
  if (isPublic) {
    return NextResponse.next();
  }

  // Redirect signed-out users to login
  if (!hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
