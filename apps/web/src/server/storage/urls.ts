import { isProceduralAssetUrl } from '@vorqen/types';
import { getStorageConfig, type StorageConfig } from './config';

/**
 * Resolve a stored asset reference to a browser-safe URL.
 * - Absolute http(s) / procedural:// URLs pass through.
 * - Relative / root-relative paths pass through.
 * - Object keys are prefixed with R2_PUBLIC_URL when configured.
 */
export function resolvePublicAssetUrl(
  stored: string,
  config: StorageConfig = getStorageConfig(),
): string {
  const value = stored.trim();
  if (!value) return value;

  if (
    isProceduralAssetUrl(value) ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:')
  ) {
    return value;
  }

  if (value.startsWith('/')) {
    return value;
  }

  if (config.publicUrl) {
    return `${config.publicUrl}/${value.replace(/^\//, '')}`;
  }

  // Dev without CDN: treat as site-relative under /assets/
  return `/assets/${value.replace(/^\//, '')}`;
}
