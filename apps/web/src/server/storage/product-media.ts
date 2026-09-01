import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { ValidationError } from '../common/errors';
import { logger } from '../common/logger';
import {
  deleteObject,
  isR2Configured,
  productImageKey,
  putObject,
} from './index';
import {
  PRODUCT_IMAGE_MAX_BYTES,
  extensionForImageMime,
  sniffProductImageMime,
  type ProductImageMime,
} from './image-file';

export type StoredProductImage = {
  storedUrl: string;
  contentType: ProductImageMime;
};

function localUploadPath(key: string): string {
  return path.join(process.cwd(), 'public', 'uploads', key);
}

function localPublicUrl(key: string): string {
  return `/uploads/${key.replace(/\\/g, '/')}`;
}

export async function storeProductImageFile(
  productId: string,
  _originalName: string,
  body: Buffer,
): Promise<StoredProductImage> {
  if (body.byteLength === 0) {
    throw new ValidationError('Image file is empty.');
  }
  if (body.byteLength > PRODUCT_IMAGE_MAX_BYTES) {
    throw new ValidationError('Image must be 8 MB or smaller.');
  }
  const mime = sniffProductImageMime(body);
  if (!mime) {
    throw new ValidationError('Upload a JPEG, PNG, or WebP image.');
  }

  const unique = `${Date.now()}-${randomBytes(4).toString('hex')}`;
  const ext = extensionForImageMime(mime);
  const safeName = `${unique}.${ext}`;
  const key = productImageKey(productId, safeName);

  if (isR2Configured()) {
    const put = await putObject({ key, body, contentType: mime });
    return { storedUrl: put.key, contentType: mime };
  }

  const abs = localUploadPath(key);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, body);
  return { storedUrl: localPublicUrl(key), contentType: mime };
}

function isSeedAssetUrl(storedUrl: string): boolean {
  return storedUrl.startsWith('/assets/');
}

function isLocalUploadUrl(storedUrl: string): boolean {
  return storedUrl.startsWith('/uploads/');
}

function isObjectKey(storedUrl: string): boolean {
  return storedUrl.startsWith('products/') && !storedUrl.includes('://');
}

/** Delete a managed upload. Seed `/assets/catalog` files stay on disk. */
export async function removeStoredProductImage(
  storedUrl: string,
): Promise<void> {
  const value = storedUrl.trim();
  if (!value || isSeedAssetUrl(value)) return;

  if (isLocalUploadUrl(value)) {
    const rel = value.replace(/^\/uploads\//, '');
    const abs = localUploadPath(rel);
    const root = path.join(process.cwd(), 'public', 'uploads');
    const resolved = path.resolve(abs);
    if (!resolved.startsWith(path.resolve(root))) return;
    try {
      await unlink(resolved);
    } catch (error) {
      logger.warn('Could not delete local product image', {
        path: rel,
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
    return;
  }

  if (isObjectKey(value) && isR2Configured()) {
    try {
      await deleteObject(value);
    } catch (error) {
      logger.warn('Could not delete R2 product image', {
        key: value,
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
