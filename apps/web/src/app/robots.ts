import type { MetadataRoute } from 'next';
import { ROBOTS_DISALLOW_PATHS } from '@vorqen/types';
import { absoluteUrl } from '@/server/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
