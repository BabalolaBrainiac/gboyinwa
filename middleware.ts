import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const hostname = req.headers.get('host') || '';
    const pathname = req.nextUrl.pathname;

    // Check if we're on the blog subdomain
    const isBlogSubdomain =
        hostname.includes('blog.localhost') ||
        hostname.includes('blog.gboyinwa.com') ||
        hostname.includes('blog.gboyinwa.vercel.app') ||
        hostname.includes('blog.gboyinwa-git-main');

    if (isBlogSubdomain) {
        // Prevent infinite loops if already on /blog internal paths
        if (pathname.startsWith('/blog')) {
            return NextResponse.next();
        }

        // Skip static files, api, _next, and common static assets
        if (
            pathname.startsWith('/_next') ||
            pathname.startsWith('/api') ||
            pathname.startsWith('/images') ||
            pathname === '/favicon.ico' ||
            pathname === '/favicon.png' ||
            pathname === '/manifest.json'
        ) {
            return NextResponse.next();
        }

        // Rewrite path to internal /blog route
        // Example: blog.gboyinwa.com/ -> /blog
        // Example: blog.gboyinwa.com/some-post -> /blog/some-post
        const url = req.nextUrl.clone();
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
         * - favicon.png
         */
        '/((?!api|_next/static|_next/image|favicon.ico|favicon.png).*)',
    ],
};
