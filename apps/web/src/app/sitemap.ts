import type { MetadataRoute } from 'next';
import { SITEMAP_STATIC_PATHS } from '@vorqen/types';
import { prisma } from '@/server/common/prisma';
import { listSitemapProducts } from '@/server/catalog/catalog.service';
import { productTypeToPath } from '@/features/products/product-path';
import { absoluteUrl } from '@/server/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = SITEMAP_STATIC_PATHS.map(
    (path) => ({
      url: absoluteUrl(path),
      changeFrequency: path === '/' ? 'daily' : 'weekly',
      priority: path === '/' ? 1 : 0.8,
    }),
  );

  let products: Awaited<ReturnType<typeof listSitemapProducts>> = [];
  try {
    products = await listSitemapProducts(prisma);
  } catch {
    products = [];
  }

  const productEntries: MetadataRoute.Sitemap = products.map((product) => {
    const segment = productTypeToPath(product.type);
    const path =
      segment === 'products'
        ? `/products/${product.slug}`
        : `/${segment}/${product.slug}`;
    return {
      url: absoluteUrl(path),
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    };
  });

  return [...staticEntries, ...productEntries];
}
