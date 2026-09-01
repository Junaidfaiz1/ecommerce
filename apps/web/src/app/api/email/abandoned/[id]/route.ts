import { NextResponse } from 'next/server';
import { prisma } from '@/server/common/prisma';
import { logger } from '@/server/common/logger';
import { recordAbandonedCartClick } from '@/server/abandoned-cart';
import { getAppUrl } from '@/server/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    await recordAbandonedCartClick(prisma, id);
  } catch (error) {
    logger.warn('abandoned_cart_click_failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
  }

  return NextResponse.redirect(new URL('/cart', `${getAppUrl()}/`), 302);
}
