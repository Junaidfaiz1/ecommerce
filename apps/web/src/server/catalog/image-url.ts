import {
  CATALOG_PLACEHOLDER_IMAGE,
  resolveCatalogImageUrl,
} from '@vorqen/types';
import { resolvePublicAssetUrl } from '../storage';

/** Browser-safe catalog image: local path, R2 object key, or absolute URL. */
export function toPublicCatalogImageUrl(
  stored: string | null | undefined,
): string {
  const resolved = resolveCatalogImageUrl(stored);
  if (resolved === CATALOG_PLACEHOLDER_IMAGE) return resolved;
  return resolvePublicAssetUrl(resolved);
}

/**
 * Resolve the stored ProductImage URL. Does not rewrite to static slug files —
 * shop and admin show whatever is saved in the database.
 */
export function catalogPhotoPath(
  _type: string,
  _slug: string,
  stored?: string | null,
): string {
  return toPublicCatalogImageUrl(stored);
}
