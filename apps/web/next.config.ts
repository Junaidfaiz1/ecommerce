import type { NextConfig } from 'next';
import { SECURITY_HEADERS } from './src/server/security/headers';

const nextConfig: NextConfig = {
  transpilePackages: ['@vorqen/ui', '@vorqen/types', 'three'],
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', 'pg'],
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
