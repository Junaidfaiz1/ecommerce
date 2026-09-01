import type { Product3DAssetsArgs } from '@vorqen/types';
import {
  proceduralAssetUrl,
  type ProceduralKind,
  type ProductType,
} from '@vorqen/types';
import type { PrismaClient } from '@/generated/prisma/client';
import { NotFoundError, ValidationError } from '../common/errors';
import { mapProduct3DAsset, type Catalog3DAsset } from './mappers';

const TYPE_TO_KIND: Record<ProductType, ProceduralKind> = {
  CPU: 'cpu',
  GPU: 'gpu',
  MOTHERBOARD: 'motherboard',
  RAM: 'ram',
  STORAGE: 'storage',
  PSU: 'psu',
  CASE: 'case',
  COOLER: 'cooler',
  ACCESSORY: 'accessory',
  OTHER: 'other',
};

/**
 * List 3D assets for an ACTIVE product. Prices/stock never involved.
 * URLs are resolved through the storage layer (R2 public CDN when set).
 */
export async function listProduct3DAssets(
  prisma: PrismaClient,
  args: Product3DAssetsArgs,
): Promise<Catalog3DAsset[]> {
  const product = await findActiveProduct(prisma, args);
  const rows = await prisma.product3DAsset.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(mapProduct3DAsset);
}

/**
 * Preferred viewer source for PDP: first DB asset, or procedural fallback
 * keyed to product type (demo chassis until licensed GLBs exist).
 */
export async function getProductViewerAsset(
  prisma: PrismaClient,
  args: Product3DAssetsArgs,
): Promise<Catalog3DAsset> {
  const product = await findActiveProduct(prisma, args);
  const rows = await prisma.product3DAsset.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: 'asc' },
    take: 1,
  });

  if (rows[0]) {
    return mapProduct3DAsset(rows[0]);
  }

  const kind = TYPE_TO_KIND[product.type as ProductType] ?? 'other';
  return {
    id: `procedural-${product.id}`,
    productId: product.id,
    glbUrl: proceduralAssetUrl(kind),
    dracoUrl: null,
    posterUrl: null,
    label: 'Demo procedural model',
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

async function findActiveProduct(
  prisma: PrismaClient,
  args: Product3DAssetsArgs,
) {
  if (args.productId) {
    const product = await prisma.product.findFirst({
      where: { id: args.productId, status: 'ACTIVE' },
    });
    if (!product) throw new NotFoundError('Product not found.');
    return product;
  }
  if (args.productSlug) {
    const product = await prisma.product.findFirst({
      where: { slug: args.productSlug, status: 'ACTIVE' },
    });
    if (!product) throw new NotFoundError('Product not found.');
    return product;
  }
  throw new ValidationError('Provide productId or productSlug.');
}

export { TYPE_TO_KIND };
