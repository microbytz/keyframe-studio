import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware is required for Cloudflare Pages to correctly handle
// Next.js routing and function invocation.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
