// ============================================================
// ShopSphere — Next.js 16 Proxy (replaces middleware.ts)
//
// Route protection:
//  /cart            → any authenticated user
//  /checkout        → any authenticated user
//  /orders          → any authenticated user
//  /orders/*        → any authenticated user
//  /admin           → ADMIN role only → non-admins redirect to /
//  /admin/*         → ADMIN role only → non-admins redirect to /
//  /login           → redirect to / if already logged in
//  /register        → redirect to / if already logged in
//
// Unauthenticated users hitting protected routes →
//   /login?next=<pathname>
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'ss_session'

function getEncodedSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? ''
  return new TextEncoder().encode(secret)
}

interface SessionClaims {
  userId: string
  role: 'CUSTOMER' | 'ADMIN'
  expiresAt: number
}

async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedSecret(), {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionClaims
  } catch {
    return null
  }
}

// Route prefix lists
const CUSTOMER_ROUTES = ['/cart', '/checkout', '/orders']
const ADMIN_ROUTES = ['/admin']
const PUBLIC_AUTH_ROUTES = ['/login', '/register']

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  const cookieToken = request.cookies.get(COOKIE_NAME)?.value
  const session = cookieToken ? await verifySession(cookieToken) : null
  const isAuthed = session !== null

  // Authenticated users visiting /login or /register → redirect to home
  if (isAuthed && matchesPrefix(pathname, PUBLIC_AUTH_ROUTES)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /admin, /admin/* → must be ADMIN
  if (matchesPrefix(pathname, ADMIN_ROUTES)) {
    if (!isAuthed) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (session.role !== 'ADMIN') {
      // Authenticated CUSTOMER trying to access admin → redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // /cart, /checkout, /orders, /orders/* → any authenticated user
  if (matchesPrefix(pathname, CUSTOMER_ROUTES)) {
    if (!isAuthed) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public assets (*.png, *.svg, *.jpg, *.ico, *.webp)
     * - /api routes   (handled by route handlers)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$|api/).*)',
  ],
}
