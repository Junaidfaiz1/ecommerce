import { prisma } from '@/server/common/prisma';
import {
  listBrands,
  listCategories,
  listProducts,
} from '@/server/catalog/catalog.service';
import type { ProductListFilter, ProductSort } from '@vorqen/types';

export async function fetchCatalogList(options: {
  filter?: ProductListFilter;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}) {
  return listProducts(prisma, {
    filter: options.filter,
    sort: options.sort ?? 'FEATURED',
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 24,
  });
}

export async function fetchFeaturedProducts(pageSize = 8) {
  return listProducts(prisma, {
    filter: { featured: true },
    sort: 'FEATURED',
    page: 1,
    pageSize,
  });
}

export async function fetchProductsByType(
  type: ProductListFilter['type'],
  pageSize = 8,
) {
  return listProducts(prisma, {
    filter: { type },
    sort: 'FEATURED',
    page: 1,
    pageSize,
  });
}

export async function fetchShopMeta() {
  const [brands, categories] = await Promise.all([
    listBrands(prisma),
    listCategories(prisma),
  ]);
  return { brands, categories };
}

export { prisma };
