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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.module = config.module || {};
      config.module.exprContextCritical = false;
    }
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
    ];
    return config;
  },
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production';
    const blogHosts = [
      'blog.gboyinwa.com',
      'blog.gboyinwa.vercel.app',
      'blog.localhost',
    ];

    const rewrites = [];
    for (const host of blogHosts) {
      rewrites.push(
        { source: '/', destination: '/blog', has: [{ type: 'host', value: host }] },
        { source: '/:path*', destination: '/blog/:path*', has: [{ type: 'host', value: host }] }
      );
    }
    return rewrites;
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
