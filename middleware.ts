import { NextRequest, NextResponse } from 'next/server';

/**
 * Subdomain routing middleware.
 * blog.localhost:3000  → rewrites to /blog/...
 * blog.gboyinwa.com    → rewrites to /blog/...
 *
 * No Node.js globals (__dirname, Buffer, etc.) — edge-safe.
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';

  const isBlogSubdomain =
    hostname.startsWith('blog.localhost') ||
    hostname === 'blog.gboyinwa.com';

  if (isBlogSubdomain) {
    const url = request.nextUrl.clone();

    // Avoid double-prefixing
    if (!url.pathname.startsWith('/blog')) {
      url.pathname = `/blog${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
};
