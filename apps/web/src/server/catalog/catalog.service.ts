import {
  PRODUCT_LIST_IMAGE_TAKE,
  PRODUCT_LIST_VARIANT_TAKE,
  type ProductListInput,
} from '@vorqen/types';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { NotFoundError, ValidationError } from '../common/errors';
import {
  buildProductOrderBy,
  buildProductWhere,
  isPriceSort,
  paginationMeta,
} from './catalog.filters';
import {
  mapBrand,
  mapCategory,
  mapProduct,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProduct,
  type ProductWithRelations,
} from './catalog.mappers';

const hardwareInclude = {
  cpu: true,
  gpu: true,
  motherboard: true,
  ram: true,
  storage: true,
  psu: true,
  pcCase: true,
  cooler: true,
} as const;

/** Shop / homepage cards — primary image + default variant only. */
export const productListInclude = {
  brand: true,
  category: true,
  images: {
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
    take: PRODUCT_LIST_IMAGE_TAKE,
  },
  variants: {
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' as const }, { createdAt: 'asc' as const }],
    take: PRODUCT_LIST_VARIANT_TAKE,
    include: { inventory: true },
  },
  ...hardwareInclude,
} satisfies Prisma.ProductInclude;

/** PDP / compare / SKU lookup — full gallery and variants. */
export const productDetailInclude = {
  brand: true,
  category: true,
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { isPrimary: 'desc' as const }],
  },
  variants: { include: { inventory: true } },
  ...hardwareInclude,
} satisfies Prisma.ProductInclude;

export type ProductConnection = {
  items: CatalogProduct[];
  pageInfo: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

async function loadProductsByIds(
  prisma: PrismaClient,
  ids: string[],
): Promise<CatalogProduct[]> {
  if (ids.length === 0) return [];

  const rows = (await prisma.product.findMany({
    where: { id: { in: ids } },
    include: productListInclude,
  })) as ProductWithRelations[];

  const byId = new Map(rows.map((row) => [row.id, mapProduct(row)]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is CatalogProduct => p !== undefined);
}

/**
 * Load ACTIVE products by id preserving request order (compare / trays).
 */
export async function getProductsByIds(
  prisma: PrismaClient,
  ids: string[],
): Promise<CatalogProduct[]> {
  if (ids.length === 0) return [];

  const rows = (await prisma.product.findMany({
    where: { id: { in: ids }, status: 'ACTIVE' },
    include: productDetailInclude,
  })) as ProductWithRelations[];

  const byId = new Map(rows.map((row) => [row.id, mapProduct(row)]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is CatalogProduct => p !== undefined);
}

/**
 * Paginated public product catalog with search, filters, and sort.
 * Prices and stock come from DB — never from the client.
 */
export async function listProducts(
  prisma: PrismaClient,
  input: ProductListInput,
): Promise<ProductConnection> {
  const where = buildProductWhere(input.filter);
  const totalCount = await prisma.product.count({ where });
  const meta = paginationMeta(totalCount, input.page, input.pageSize);

  if (totalCount === 0) {
    return {
      items: [],
      pageInfo: {
        page: meta.page,
        pageSize: meta.pageSize,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  let items: CatalogProduct[];

  if (isPriceSort(input.sort)) {
    const variants = await prisma.productVariant.findMany({
      where: {
        isDefault: true,
        isActive: true,
        product: where,
      },
      orderBy: { price: input.sort === 'PRICE_ASC' ? 'asc' : 'desc' },
      skip: meta.skip,
      take: meta.pageSize,
      select: { productId: true },
    });
    items = await loadProductsByIds(
      prisma,
      variants.map((v) => v.productId),
    );
  } else {
    const rows = (await prisma.product.findMany({
      where,
      orderBy: buildProductOrderBy(input.sort),
      skip: meta.skip,
      take: meta.pageSize,
      include: productListInclude,
    })) as ProductWithRelations[];
    items = rows.map((row) => mapProduct(row));
  }

  return {
    items,
    pageInfo: {
      page: meta.page,
      pageSize: meta.pageSize,
      totalCount: meta.totalCount,
      totalPages: meta.totalPages,
      hasNextPage: meta.hasNextPage,
      hasPreviousPage: meta.hasPreviousPage,
    },
  };
}

export async function getProductBySlug(
  prisma: PrismaClient,
  slug: string,
): Promise<CatalogProduct> {
  const product = (await prisma.product.findFirst({
    where: { slug, status: 'ACTIVE' },
    include: productDetailInclude,
  })) as ProductWithRelations | null;

  if (!product) {
    throw new NotFoundError('Product not found.', { slug: 'Unknown product.' });
  }

  return mapProduct(product);
}

export async function getProductById(
  prisma: PrismaClient,
  id: string,
): Promise<CatalogProduct> {
  const product = (await prisma.product.findFirst({
    where: { id, status: 'ACTIVE' },
    include: productDetailInclude,
  })) as ProductWithRelations | null;

  if (!product) {
    throw new NotFoundError('Product not found.', { id: 'Unknown product.' });
  }

  return mapProduct(product);
}

/**
 * Resolve a public product by id or slug (exactly one required).
 */
export async function getProduct(
  prisma: PrismaClient,
  args: { id?: string; slug?: string },
): Promise<CatalogProduct> {
  if (args.id && args.slug) {
    throw new ValidationError('Provide either id or slug, not both.', {
      _root: 'Provide either id or slug, not both.',
    });
  }
  if (args.id) return getProductById(prisma, args.id);
  if (args.slug) return getProductBySlug(prisma, args.slug);
  throw new ValidationError('Product id or slug is required.', {
    _root: 'Product id or slug is required.',
  });
}

export async function listBrands(prisma: PrismaClient): Promise<CatalogBrand[]> {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
  });
  return brands.map(mapBrand);
}

export async function getBrandBySlug(
  prisma: PrismaClient,
  slug: string,
): Promise<CatalogBrand> {
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) {
    throw new NotFoundError('Brand not found.', { slug: 'Unknown brand.' });
  }
  return mapBrand(brand);
}

export async function listCategories(
  prisma: PrismaClient,
): Promise<CatalogCategory[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return categories.map(mapCategory);
}

export async function getCategoryBySlug(
  prisma: PrismaClient,
  slug: string,
): Promise<CatalogCategory> {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) {
    throw new NotFoundError('Category not found.', { slug: 'Unknown category.' });
  }
  return mapCategory(category);
}

export async function getVariantBySku(prisma: PrismaClient, sku: string) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      sku,
      isActive: true,
      product: { status: 'ACTIVE' },
    },
    include: {
      inventory: true,
      product: { include: productDetailInclude },
    },
  });

  if (!variant) {
    throw new NotFoundError('Variant not found.', { sku: 'Unknown SKU.' });
  }

  const product = mapProduct(variant.product as ProductWithRelations);
  const mapped = product.variants.find((v) => v.id === variant.id);
  if (!mapped) {
    throw new NotFoundError('Variant not found.', { sku: 'Unknown SKU.' });
  }

  return { ...mapped, product };
}

/** ACTIVE catalog slugs for sitemap.xml (no prices — SEO only). */
export async function listSitemapProducts(prisma: PrismaClient) {
  return prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, type: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5000,
  });
}
