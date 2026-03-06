import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  
  const isBlogSubdomain = 
    host.startsWith('blog.localhost') || 
    host.startsWith('blog.') ||
    host === 'blog.gboyinwa.com';
  
  if (isBlogSubdomain) {
    if (url.pathname === '/') {
      url.pathname = '/blog';
      return NextResponse.rewrite(url);
    }
    if (!url.pathname.startsWith('/blog')) {
      url.pathname = `/blog${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)'],
};
