/**
 * Cloudflare R2 / public asset URL helpers.
 * Secrets stay on the server — browsers only receive resolved public URLs.
 */

export type StorageConfig = {
  accountId: string | null;
  accessKeyId: string | null;
  secretAccessKey: string | null;
  bucketName: string | null;
  publicUrl: string | null;
};

export function getStorageConfig(
  env: NodeJS.ProcessEnv = process.env,
): StorageConfig {
  return {
    accountId: env.R2_ACCOUNT_ID?.trim() || null,
    accessKeyId: env.R2_ACCESS_KEY_ID?.trim() || null,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY?.trim() || null,
    bucketName: env.R2_BUCKET_NAME?.trim() || null,
    publicUrl: env.R2_PUBLIC_URL?.trim().replace(/\/$/, '') || null,
  };
}

export function isR2Configured(config: StorageConfig = getStorageConfig()): boolean {
  return Boolean(
    config.accountId &&
      config.accessKeyId &&
      config.secretAccessKey &&
      config.bucketName,
  );
}

export function hasPublicCdn(config: StorageConfig = getStorageConfig()): boolean {
  return Boolean(config.publicUrl);
}
