import type { NextConfig, RemotePattern } from 'next';
import { SECURITY_HEADERS } from './src/server/security/headers';

function r2ImagePattern(): RemotePattern[] {
  const raw = process.env.R2_PUBLIC_URL?.trim();
  if (!raw) return [];
  try {
    const parsed = new URL(raw);
    const protocol = parsed.protocol.replace(':', '');
    if (protocol !== 'http' && protocol !== 'https') return [];
    return [
      {
        protocol,
        hostname: parsed.hostname,
        pathname: '/**',
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ['@vorqen/ui', '@vorqen/types', 'three'],
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', 'pg'],
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [80, 112, 144, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placeholder.vorqen.local',
        pathname: '/**',
      },
      { protocol: 'https', hostname: '*.r2.dev', pathname: '/**' },
      {
        protocol: 'https',
        hostname: '*.cloudflarestorage.com',
        pathname: '/**',
      },
      ...r2ImagePattern(),
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS(),
      },
    ];
  },
};

export default nextConfig;
