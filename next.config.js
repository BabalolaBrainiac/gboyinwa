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
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production';
    const blogHost = isProd ? 'blog.gboyinwa.com' : 'blog.localhost';
    return [
      { source: '/', destination: '/blog', has: [{ type: 'host', value: blogHost }] },
      { source: '/:slug', destination: '/blog/:slug', has: [{ type: 'host', value: blogHost }] },
      { source: '/:slug/edit', destination: '/blog/:slug/edit', has: [{ type: 'host', value: blogHost }] },
    ];
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
