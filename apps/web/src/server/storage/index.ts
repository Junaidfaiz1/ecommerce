import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getStorageConfig, isR2Configured, type StorageConfig } from './config';
import { resolvePublicAssetUrl } from './urls';

let cachedClient: S3Client | null = null;

function getR2Client(config: StorageConfig = getStorageConfig()): S3Client {
  if (!isR2Configured(config)) {
    throw new Error('R2 is not configured');
  }
  if (cachedClient) return cachedClient;

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
  });
  return cachedClient;
}

export type PutObjectInput = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
};

/**
 * Upload an object to R2. Returns the public URL (CDN or /assets fallback).
 * Admin catalog uses `storeProductImageFile` which falls back to local /uploads.
 */
export async function putObject(
  input: PutObjectInput,
  config: StorageConfig = getStorageConfig(),
): Promise<{ key: string; publicUrl: string }> {
  if (!isR2Configured(config) || !config.bucketName) {
    throw new Error('R2 is not configured');
  }

  const client = getR2Client(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );

  return {
    key: input.key,
    publicUrl: resolvePublicAssetUrl(input.key, config),
  };
}

export async function deleteObject(
  key: string,
  config: StorageConfig = getStorageConfig(),
): Promise<void> {
  if (!isR2Configured(config) || !config.bucketName) {
    throw new Error('R2 is not configured');
  }
  const client = getR2Client(config);
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}

export { resolvePublicAssetUrl } from './urls';
export {
  product3dKey,
  productImageKey,
  productThumbnailKey,
} from './paths';
export {
  getStorageConfig,
  hasPublicCdn,
  isR2Configured,
} from './config';
