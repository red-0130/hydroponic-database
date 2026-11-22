import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionTokenEdge, ADMIN_COOKIE_NAME } from '@/lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Direct requests to /admin or /dashboard (and subpaths) must return 404
  if (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/')
  ) {
    return new NextResponse(null, { status: 404 });
  }

  // 2. Protect /api/admin/* endpoints (EXCEPT /api/admin/auth/login)
  if (pathname.startsWith('/api/admin/')) {
    if (pathname === '/api/admin/auth/login') {
      return NextResponse.next();
    }

    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValid = await verifySessionTokenEdge(token);

    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/api/admin/:path*',
  ],
};
