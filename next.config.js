/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      // Supabase storage
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/**' },
      // Unsplash
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      // Cloudflare R2 — public bucket URLs (pub-*.r2.dev)
      { protocol: 'https', hostname: '**.r2.dev', pathname: '/**' },
      // Cloudflare R2 — direct storage / signed URLs
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com', pathname: '/**' },
    ],
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
      {
        // Allow framing for share pages (needed for Office Online viewer)
        source: '/share/:token*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
