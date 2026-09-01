import type { Product3DAsset } from '@/generated/prisma/client';
import { resolvePublicAssetUrl } from '../storage';

export function mapProduct3DAsset(asset: Product3DAsset) {
  return {
    id: asset.id,
    productId: asset.productId,
    glbUrl: resolvePublicAssetUrl(asset.glbUrl),
    dracoUrl: asset.dracoUrl ? resolvePublicAssetUrl(asset.dracoUrl) : null,
    posterUrl: asset.posterUrl ? resolvePublicAssetUrl(asset.posterUrl) : null,
    label: asset.label,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

export type Catalog3DAsset = ReturnType<typeof mapProduct3DAsset>;
