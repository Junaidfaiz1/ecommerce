export const PRODUCT_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const PRODUCT_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export type ProductImageMime = (typeof PRODUCT_IMAGE_MIME)[number];

const MIME_TO_EXT: Record<ProductImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Sniff jpeg / png / webp from magic bytes — never trust the client MIME. */
export function sniffProductImageMime(
  bytes: Uint8Array,
): ProductImageMime | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  const riff = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!);
  const webp = String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!);
  if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
  return null;
}

export function extensionForImageMime(mime: ProductImageMime): string {
  return MIME_TO_EXT[mime];
}
