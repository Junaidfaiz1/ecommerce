import { z } from 'zod';
import { addressInputSchema } from './account';
import { cuidSchema } from './catalog';

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'REQUIRES_PAYMENT',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const stripePaymentIntentIdSchema = z
  .string()
  .trim()
  .min(8)
  .max(256)
  .regex(/^pi_[A-Za-z0-9_]+$/, 'Invalid Stripe payment intent id.');

export const createCheckoutInputSchema = z
  .object({
    shippingAddressId: cuidSchema.optional(),
    shippingAddress: addressInputSchema.optional(),
    saveAddress: z.boolean().default(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasId = Boolean(value.shippingAddressId);
    const hasInline = Boolean(value.shippingAddress);
    if (hasId === hasInline) {
      ctx.addIssue({
        code: 'custom',
        path: hasId ? ['shippingAddress'] : ['shippingAddressId'],
        message: 'Provide exactly one of shippingAddressId or shippingAddress.',
      });
    }
  });

export const checkoutStatusInputSchema = z
  .object({
    paymentIntentId: stripePaymentIntentIdSchema.optional(),
    orderId: cuidSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasPi = Boolean(value.paymentIntentId);
    const hasOrder = Boolean(value.orderId);
    if (hasPi === hasOrder) {
      ctx.addIssue({
        code: 'custom',
        path: hasPi ? ['orderId'] : ['paymentIntentId'],
        message: 'Provide exactly one of paymentIntentId or orderId.',
      });
    }
  });

/** PaymentIntent fields we trust after webhook signature verification. */
export const stripePaymentIntentObjectSchema = z
  .object({
    id: z.string().min(1),
    object: z.literal('payment_intent'),
    amount: z.number().int().nonnegative(),
    currency: z.string().min(3).max(3),
    status: z.string().min(1),
    metadata: z
      .object({
        orderId: z.string().min(1),
        userId: z.string().min(1),
      })
      .passthrough(),
  })
  .passthrough();

export type CreateCheckoutInput = z.infer<typeof createCheckoutInputSchema>;
export type CheckoutStatusInput = z.infer<typeof checkoutStatusInputSchema>;
export type StripePaymentIntentObject = z.infer<
  typeof stripePaymentIntentObjectSchema
>;

export type PaidApplyDecision =
  | { action: 'skip'; reason: 'already_paid' | 'wrong_order' }
  | {
      action: 'reject';
      reason: 'amount_mismatch' | 'currency_mismatch' | 'not_paid';
    }
  | { action: 'apply' };

/**
 * Pure paid-transition rules. Webhook uses this after signature + Zod parse.
 * Never mark paid from a client confirmPayment result.
 */
export function decidePaidTransition(input: {
  paymentStatus: PaymentStatus;
  orderId: string;
  metadataOrderId: string;
  orderAmountCents: number;
  stripeAmountCents: number;
  orderCurrency: string;
  stripeCurrency: string;
  stripePaymentStatus: string;
}): PaidApplyDecision {
  if (input.paymentStatus === 'SUCCEEDED') {
    return { action: 'skip', reason: 'already_paid' };
  }
  if (input.metadataOrderId !== input.orderId) {
    return { action: 'skip', reason: 'wrong_order' };
  }
  if (input.stripePaymentStatus !== 'succeeded') {
    return { action: 'reject', reason: 'not_paid' };
  }
  if (input.stripeAmountCents !== input.orderAmountCents) {
    return { action: 'reject', reason: 'amount_mismatch' };
  }
  if (
    input.stripeCurrency.toLowerCase() !== input.orderCurrency.toLowerCase()
  ) {
    return { action: 'reject', reason: 'currency_mismatch' };
  }
  return { action: 'apply' };
}

/** Convert Decimal/major-unit money to Stripe integer cents. */
export function toStripeAmountCents(amount: string | number): number {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n) || n < 0) {
    throw new RangeError('Invalid money amount.');
  }
  return Math.round(n * 100);
}

export function generateOrderNumber(now = new Date(), entropy = ''): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const suffix =
    entropy ||
    Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X');
  return `VQ-${y}${m}${d}-${suffix.slice(0, 6).toUpperCase()}`;
}
