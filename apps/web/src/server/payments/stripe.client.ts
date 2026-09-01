import Stripe from 'stripe';
import { PaymentFailedError, ValidationError } from '../common/errors';

let stripeSingleton: Stripe | undefined;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ValidationError('Checkout is not available right now.', {
      [name]: 'Not configured.',
    });
  }
  return value;
}

export function getStripe(): Stripe {
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
  }
  return stripeSingleton;
}

export function getStripeWebhookSecret(): string {
  return requireEnv('STRIPE_WEBHOOK_SECRET');
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    'http://localhost:3000'
  );
}

export type CreatedPaymentIntent = {
  id: string;
  clientSecret: string;
};

export type CreateStripePaymentIntentInput = {
  orderId: string;
  userId: string;
  email: string;
  orderNumber: string;
  currency: string;
  amountCents: number;
  description: string;
};

/**
 * Test-only override. Production code never sets this.
 * Reset with `resetStripeTestHooks()` in afterEach.
 */
export const stripeTestHooks: {
  createPaymentIntent:
    | ((input: CreateStripePaymentIntentInput) => Promise<CreatedPaymentIntent>)
    | null;
} = {
  createPaymentIntent: null,
};

export function resetStripeTestHooks(): void {
  stripeTestHooks.createPaymentIntent = null;
}

export async function createStripePaymentIntent(
  input: CreateStripePaymentIntentInput,
): Promise<CreatedPaymentIntent> {
  if (stripeTestHooks.createPaymentIntent) {
    return stripeTestHooks.createPaymentIntent(input);
  }

  if (input.amountCents < 50) {
    throw new ValidationError('Order total is too small to charge.');
  }

  const intent = await getStripe().paymentIntents.create({
    amount: input.amountCents,
    currency: input.currency.toLowerCase(),
    receipt_email: input.email,
    description: `VORQEN ${input.orderNumber}: ${input.description}`.slice(
      0,
      1000,
    ),
    metadata: {
      orderId: input.orderId,
      userId: input.userId,
    },
    automatic_payment_methods: { enabled: true },
  });

  if (!intent.client_secret) {
    throw new PaymentFailedError('Could not start payment.');
  }

  return { id: intent.id, clientSecret: intent.client_secret };
}

export async function cancelStripePaymentIntent(
  paymentIntentId: string,
): Promise<void> {
  try {
    await getStripe().paymentIntents.cancel(paymentIntentId);
  } catch {
    // Already canceled, succeeded, or unknown — caller continues.
  }
}

export async function createStripeRefund(input: {
  paymentIntentId: string;
  amountCents: number;
  reason?: string | null;
}): Promise<{ id: string }> {
  if (input.amountCents < 1) {
    throw new ValidationError('Refund amount is too small.');
  }
  const refund = await getStripe().refunds.create({
    payment_intent: input.paymentIntentId,
    amount: input.amountCents,
    reason: 'requested_by_customer',
    metadata: input.reason ? { note: input.reason.slice(0, 500) } : undefined,
  });
  return { id: refund.id };
}

export function constructStripeEvent(
  rawBody: string,
  signature: string | null,
): Stripe.Event {
  if (!signature) {
    throw new ValidationError('Missing Stripe signature.');
  }
  return getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    getStripeWebhookSecret(),
  );
}
