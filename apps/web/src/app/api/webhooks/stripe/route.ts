import { NextResponse } from 'next/server';
import { prisma } from '@/server/common/prisma';
import { logger } from '@/server/common/logger';
import { isDomainError } from '@/server/common/errors';
import { constructStripeEvent } from '@/server/payments/stripe.client';
import { handleStripeWebhookEvent } from '@/server/checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  let event;
  try {
    event = constructStripeEvent(rawBody, signature);
  } catch (error) {
    logger.warn('Stripe webhook signature failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(prisma, event);
  } catch (error) {
    logger.error('Stripe webhook processing failed', {
      eventId: event.id,
      type: event.type,
      code: isDomainError(error) ? error.code : undefined,
    });
    return NextResponse.json({ error: 'Processing failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
