import { NextResponse } from 'next/server';
import { RATE_LIMIT_RULES, cuidSchema } from '@vorqen/types';
import { requireAdmin } from '@/server/auth/rbac';
import { loadAuthUserFromRequest } from '@/server/auth/request-auth';
import { clientIpFromRequest } from '@/server/audit';
import { jsonDomainError } from '@/server/common/http-error';
import { prisma } from '@/server/common/prisma';
import { addAdminProductImage } from '@/server/catalog';
import { consumeRateLimit } from '@/server/security';
import {
  removeStoredProductImage,
  storeProductImageFile,
} from '@/server/storage/product-media';
import { ValidationError } from '@/server/common/errors';
import { logger } from '@/server/common/logger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = requireAdmin(await loadAuthUserFromRequest(request));
    const ip = clientIpFromRequest(request);
    const limited = consumeRateLimit(`upload:${user.id}`, RATE_LIMIT_RULES.mutate);
    if (!limited.allowed) {
      return NextResponse.json(
        { code: 'RATE_LIMITED', message: 'Too many uploads. Please wait and try again.' },
        { status: 429 },
      );
    }

    const form = await request.formData();
    const productIdRaw = String(form.get('productId') ?? '').trim();
    const parsedId = cuidSchema.safeParse(productIdRaw);
    if (!parsedId.success) {
      throw new ValidationError('A valid product is required.');
    }
    const productId = parsedId.data;
    const altRaw = String(form.get('alt') ?? '').trim();
    const isPrimary = String(form.get('isPrimary') ?? '') === 'true';
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      throw new ValidationError('Choose a product image to upload.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeProductImageFile(productId, file.name, buffer);
    try {
      const product = await addAdminProductImage(
        prisma,
        user.id,
        {
          productId,
          url: stored.storedUrl,
          alt: altRaw || null,
          isPrimary,
        },
        ip,
      );
      logger.info('Admin product image uploaded', {
        actorUserId: user.id,
        productId,
        action: 'product.image.upload',
      });
      const image =
        [...product.images].sort((a, b) => b.sortOrder - a.sortOrder)[0] ??
        null;
      return NextResponse.json({ image, productId: product.id });
    } catch (error) {
      await removeStoredProductImage(stored.storedUrl);
      throw error;
    }
  } catch (error) {
    return jsonDomainError(error);
  }
}
