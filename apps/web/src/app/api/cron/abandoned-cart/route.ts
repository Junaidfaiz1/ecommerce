import { NextResponse } from 'next/server';
import { cronSecretMatches } from '@vorqen/types';
import { prisma } from '@/server/common/prisma';
import { logger } from '@/server/common/logger';
import { runAbandonedCartJob } from '@/server/abandoned-cart';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  if (
    !cronSecretMatches(
      request.headers.get('authorization'),
      process.env.CRON_SECRET,
    )
  ) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await runAbandonedCartJob(prisma);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('abandoned_cart_cron_failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return NextResponse.json({ error: 'Job failed.' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
