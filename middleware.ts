import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Check if we're on the blog subdomain
  const isBlogSubdomain =
    host.startsWith('blog.gboyinwa.com') ||
    host.startsWith('blog.localhost');

  if (isBlogSubdomain) {
    // Prevent infinite loops if already on /blog
    if (pathname.startsWith('/blog')) {
      return NextResponse.next();
    }

    // Rewrite path to /blog internal route
    const url = request.nextUrl.clone();
    url.pathname = `/blog${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
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
};
