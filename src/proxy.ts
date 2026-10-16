// proxy.ts (project root, or src/proxy.ts)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/home', '/dashboard', '/profile']
const authRoutes = ['/login', '/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Replace "session" with your actual auth cookie name
  const token = request.cookies.get('accessToken')?.value
  const isAuthenticated = Boolean(token)

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  const isAuthRoute = authRoutes.includes(pathname)

  // Not signed in -> send to signin, remember where they were going
  if (isProtected && !isAuthenticated) {
    const url = new URL('/signin', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Already signed in -> keep them out of signin/signup
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/home/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/login',
     '/register'
   
  ],
}