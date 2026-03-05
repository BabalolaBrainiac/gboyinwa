import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle subdomain routing for blog.
 * - blog.localhost:3000 -> /blog
 * - blog.gboyinwa.com -> /blog
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  
  // Check if it's a blog subdomain
  const isBlogSubdomain = 
    host.startsWith('blog.localhost') || 
    host.startsWith('blog.') ||
    host === 'blog.gboyinwa.com';
  
  if (isBlogSubdomain) {
    // Rewrite blog subdomain to /blog path
    if (url.pathname === '/') {
      url.pathname = '/blog';
      return NextResponse.rewrite(url);
    }
    // Handle individual blog posts
    if (!url.pathname.startsWith('/blog')) {
      url.pathname = `/blog${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except api, static files, etc.
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
