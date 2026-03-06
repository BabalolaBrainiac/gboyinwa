/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },

  /**
   * Hostname-based rewrites for blog subdomain.
   * Runs in Node.js serverless — no Edge Runtime, no __dirname issues.
   *
   * blog.localhost:3000/*  → /blog/*   (local dev)
   * blog.gboyinwa.com/*   → /blog/*   (production)
   */
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'blog.gboyinwa.com' }],
          destination: '/blog/:path*',
        },
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'blog.localhost:3000' }],
          destination: '/blog/:path*',
        },
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'blog.localhost' }],
          destination: '/blog/:path*',
        },
      ],
    };
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
