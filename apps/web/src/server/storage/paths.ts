/**
 * Canonical object keys for product media on R2.
 * products/{productId}/images|thumbnails|3d/...
 */

export function productImageKey(
  productId: string,
  filename: string,
): string {
  return `products/${productId}/images/${sanitizeFilename(filename)}`;
}

export function productThumbnailKey(
  productId: string,
  filename: string,
): string {
  return `products/${productId}/thumbnails/${sanitizeFilename(filename)}`;
}

export function product3dKey(productId: string, filename: string): string {
  return `products/${productId}/3d/${sanitizeFilename(filename)}`;
}

function sanitizeFilename(filename: string): string {
  const base = filename.trim().replace(/\\/g, '/').split('/').pop() ?? 'asset';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || 'asset';
}
