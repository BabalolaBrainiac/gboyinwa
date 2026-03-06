import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  const isBlogSubdomain =
    host.startsWith('blog.localhost') ||
    host.startsWith('blog.');

  if (isBlogSubdomain && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/blog';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
