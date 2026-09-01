import {
  CATALOG_PLACEHOLDER_IMAGE,
  resolveCatalogImageUrl,
} from '@vorqen/types';
import { resolvePublicAssetUrl } from '../storage';

/** Browser-safe catalog image: local fallback, R2 key, or absolute URL. */
export function toPublicCatalogImageUrl(
  stored: string | null | undefined,
): string {
  const resolved = resolveCatalogImageUrl(stored);
  if (resolved === CATALOG_PLACEHOLDER_IMAGE) return resolved;
  return resolvePublicAssetUrl(resolved);
}

/** Prefer per-SKU photo; generic seed URLs map to `/assets/catalog/{slug}.jpg`. */
export function catalogPhotoPath(
  type: string,
  slug: string,
  stored?: string | null,
): string {
  const slugPath = `/assets/catalog/${slug}.jpg`;
  const value = stored?.trim() ?? '';
  if (
    !value ||
    value.includes('placeholder.vorqen.local') ||
    value.endsWith('/product.jpg') ||
    value.endsWith('/product.png')
  ) {
    return slugPath;
  }
  return toPublicCatalogImageUrl(value);
}
