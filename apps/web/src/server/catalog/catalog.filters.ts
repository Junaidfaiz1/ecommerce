import type { ProductListFilter, ProductSort } from '@vorqen/types';
import type { Prisma } from '@/generated/prisma/client';

/**
 * Build Prisma `where` for public catalog listing.
 * Public surface is ACTIVE-only — drafts/archived stay admin-only.
 */
export function buildProductWhere(
  filter: ProductListFilter | undefined,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
  };

  if (!filter) return where;

  if (filter.type) where.type = filter.type;
  if (filter.featured !== undefined) where.isFeatured = filter.featured;
  if (filter.brandSlug) where.brand = { slug: filter.brandSlug };
  if (filter.categorySlug) where.category = { slug: filter.categorySlug };

  if (filter.query) {
    where.OR = [
      { name: { contains: filter.query, mode: 'insensitive' } },
      { slug: { contains: filter.query, mode: 'insensitive' } },
      { description: { contains: filter.query, mode: 'insensitive' } },
    ];
  }

  const variantSome: Prisma.ProductVariantWhereInput = {
    isActive: true,
  };

  let needsVariantFilter = false;

  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    needsVariantFilter = true;
    variantSome.price = {
      ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
      ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
    };
  }

  if (filter.inStock === true) {
    needsVariantFilter = true;
    // Approximate: on-hand stock present. Reserved qty enforced at checkout (Phase 12).
    variantSome.inventory = { is: { quantityOnHand: { gt: 0 } } };
  } else if (filter.inStock === false) {
    needsVariantFilter = true;
    variantSome.OR = [
      { inventory: { is: null } },
      { inventory: { is: { quantityOnHand: { lte: 0 } } } },
    ];
  }

  if (needsVariantFilter) {
    where.variants = { some: variantSome };
  }

  return where;
}

export function buildProductOrderBy(
  sort: ProductSort,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'NAME_ASC':
      return [{ name: 'asc' }];
    case 'NAME_DESC':
      return [{ name: 'desc' }];
    case 'NEWEST':
      return [{ createdAt: 'desc' }];
    case 'FEATURED':
      return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    case 'PRICE_ASC':
    case 'PRICE_DESC':
      // Price sorts use default-variant join path in the service.
      return [{ createdAt: 'desc' }];
    default:
      return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
  }
}

export function isPriceSort(sort: ProductSort): boolean {
  return sort === 'PRICE_ASC' || sort === 'PRICE_DESC';
}

export function paginationMeta(totalCount: number, page: number, pageSize: number) {
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  return {
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
    skip: (safePage - 1) * pageSize,
  };
}
