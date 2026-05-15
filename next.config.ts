import type { NextConfig } from 'next';

/**
 * Next.js configuration.
 *
 * Path aliases are resolved automatically from tsconfig.json by both
 * Turbopack (default in Next.js 16) and the TypeScript compiler — no
 * manual webpack/turbopack alias config needed.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.ctfassets.net' },
      { protocol: 'https', hostname: 'downloads.ctfassets.net' },
    ],
  },

  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
};

export default nextConfig;
