import {
  createCheckoutInputSchema,
  checkoutStatusInputSchema,
  decidePaidTransition,
  generateOrderNumber,
  stripePaymentIntentObjectSchema,
  toStripeAmountCents,
  type CreateCheckoutInput,
  type PaymentStatus,
} from '@vorqen/types';
import type { PrismaClient } from '@/generated/prisma/client';
import type { AuthUser } from '../auth/types';
import { getCart, type CartIdentity } from '../cart';
import { requireValidCoupon, getCouponByCode } from '../coupons';
import {
  ConflictError,
  InsufficientStockError,
  NotFoundError,
  PaymentFailedError,
  ValidationError,
} from '../common/errors';
import { logger } from '../common/logger';
import { parseOrThrow } from '../common/validation';
import { createAddress } from '../users/address.service';
import { createStripePaymentIntent } from '../payments/stripe.client';
import {
  commitOrderStock,
  loadOrderStockLines,
  releaseOrderStock,
  reserveOrderStock,
} from '../inventory';
import { abortPendingOrder } from '../orders';
import { markAbandonedCartsRecovered } from '../abandoned-cart';
import { sendOrderPaidEmail } from '../email';
import type Stripe from 'stripe';

export type CheckoutPaymentPayload = {
  clientSecret: string;
  orderId: string;
  orderNumber: string;
  paymentIntentId: string;
};

export type CheckoutStatusPayload = {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  grandTotal: string;
  currency: string;
  paidAt: string | null;
};

type ShippingSnapshot = {
  shipName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipState: string | null;
  shipPostalCode: string;
  shipCountry: string;
  shipPhone: string | null;
};

function displayName(user: AuthUser): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || 'Customer';
}

async function uniqueOrderNumber(prisma: PrismaClient): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const entropy = crypto.randomUUID().replace(/-/g, '').slice(0, 6);
    const orderNumber = generateOrderNumber(new Date(), entropy);
    const exists = await prisma.order.findUnique({ where: { orderNumber } });
    if (!exists) return orderNumber;
  }
  throw new ConflictError('Could not allocate an order number.');
}

async function resolveShipping(
  prisma: PrismaClient,
  user: AuthUser,
  input: CreateCheckoutInput,
): Promise<ShippingSnapshot> {
  const shipName = displayName(user);

  if (input.shippingAddressId) {
    const address = await prisma.address.findFirst({
      where: { id: input.shippingAddressId, userId: user.id },
    });
    if (!address) {
      throw new NotFoundError('Shipping address not found.', {
        shippingAddressId: input.shippingAddressId,
      });
    }
    return {
      shipName,
      shipLine1: address.line1,
      shipLine2: address.line2,
      shipCity: address.city,
      shipState: address.state,
      shipPostalCode: address.postalCode,
      shipCountry: address.country,
      shipPhone: address.phone,
    };
  }

  const inline = input.shippingAddress;
  if (!inline) {
    throw new ValidationError('Shipping address is required.');
  }

  if (input.saveAddress) {
    await createAddress(prisma, user.id, { ...inline, type: inline.type });
  }

  return {
    shipName,
    shipLine1: inline.line1,
    shipLine2: inline.line2 ?? null,
    shipCity: inline.city,
    shipState: inline.state ?? null,
    shipPostalCode: inline.postalCode,
    shipCountry: inline.country,
    shipPhone: inline.phone ?? null,
  };
}

async function cancelOpenCheckouts(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const open = await prisma.order.findMany({
    where: { userId, status: 'PENDING_PAYMENT' },
    select: { id: true },
  });

  for (const order of open) {
    await abortPendingOrder(prisma, order.id);
  }
}

/**
 * Recalculate cart on the server, snapshot an order, and create a PaymentIntent.
 * Client never sends prices, stock, or paid status.
 */
export async function createCheckoutSession(
  prisma: PrismaClient,
  user: AuthUser,
  identity: CartIdentity,
  rawInput: unknown,
): Promise<CheckoutPaymentPayload> {
  const input = parseOrThrow(createCheckoutInputSchema, rawInput);
  const cart = await getCart(prisma, identity);

  if (!cart || cart.items.length === 0) {
    throw new ValidationError('Your cart is empty.');
  }

  for (const line of cart.items) {
    if (line.quantity > line.availableQuantity) {
      throw new InsufficientStockError(
        line.availableQuantity === 0
          ? `${line.product.name} is out of stock.`
          : `Only ${line.availableQuantity} of ${line.product.name} available.`,
        { variantId: line.variantId },
      );
    }
  }

  if (cart.totals.couponCode) {
    await requireValidCoupon(
      prisma,
      cart.totals.couponCode,
      Number(cart.totals.subtotal),
      user.id,
    );
  }

  const shipping = await resolveShipping(prisma, user, input);
  const amountCents = toStripeAmountCents(cart.totals.total);
  if (amountCents < 50) {
    throw new ValidationError('Order total is too small to charge.');
  }

  await cancelOpenCheckouts(prisma, user.id);

  const orderNumber = await uniqueOrderNumber(prisma);
  const description = cart.items
    .map((line) => `${line.quantity}× ${line.product.name}`)
    .join(', ');

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      orderNumber,
      status: 'PENDING_PAYMENT',
      currency: cart.totals.currency,
      subtotal: cart.totals.subtotal,
      discountTotal: cart.totals.discount,
      shippingTotal: '0.00',
      taxTotal: '0.00',
      grandTotal: cart.totals.total,
      couponCode: cart.totals.couponValid ? cart.totals.couponCode : null,
      ...shipping,
      items: {
        create: cart.items.map((line) => ({
          variantId: line.variantId,
          productName: line.product.name,
          sku: line.variant.sku,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
        })),
      },
      payments: {
        create: {
          provider: 'STRIPE',
          status: 'REQUIRES_PAYMENT',
          amount: cart.totals.total,
          currency: cart.totals.currency,
        },
      },
    },
    include: { payments: true },
  });

  const payment = order.payments[0];
  if (!payment) {
    throw new PaymentFailedError('Could not create a payment record.');
  }

  try {
    await prisma.$transaction(async (tx) => {
      await reserveOrderStock(
        tx,
        order.id,
        cart.items.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
        })),
      );
    });
  } catch (error) {
    await abortPendingOrder(prisma, order.id);
    throw error;
  }

  let intent: { id: string; clientSecret: string };
  try {
    intent = await createStripePaymentIntent({
      orderId: order.id,
      userId: user.id,
      email: user.email,
      orderNumber,
      currency: cart.totals.currency,
      amountCents,
      description,
    });
  } catch (error) {
    await abortPendingOrder(prisma, order.id);
    logger.error('Stripe PaymentIntent create failed', {
      orderId: order.id,
      userId: user.id,
    });
    if (error instanceof ValidationError || error instanceof PaymentFailedError) {
      throw error;
    }
    throw new PaymentFailedError('Could not start checkout. Please try again.');
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripePaymentIntentId: intent.id },
  });

  logger.info('PaymentIntent created', {
    orderId: order.id,
    orderNumber,
    userId: user.id,
  });

  return {
    clientSecret: intent.clientSecret,
    orderId: order.id,
    orderNumber,
    paymentIntentId: intent.id,
  };
}

function mapCheckoutStatus(order: {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: { toString(): string };
  currency: string;
  paidAt: Date | null;
  payments: Array<{ status: string }>;
}): CheckoutStatusPayload {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: order.payments[0]?.status ?? 'REQUIRES_PAYMENT',
    grandTotal: order.grandTotal.toString(),
    currency: order.currency,
    paidAt: order.paidAt?.toISOString() ?? null,
  };
}

export async function getCheckoutStatus(
  prisma: PrismaClient,
  userId: string,
  rawInput: unknown,
): Promise<CheckoutStatusPayload> {
  const input = parseOrThrow(checkoutStatusInputSchema, rawInput);

  if (input.orderId) {
    const byId = await prisma.order.findFirst({
      where: { id: input.orderId, userId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!byId) {
      throw new NotFoundError('Checkout not found.');
    }
    return mapCheckoutStatus(byId);
  }

  if (!input.paymentIntentId) {
    throw new ValidationError('paymentIntentId is required.');
  }

  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: input.paymentIntentId },
    include: {
      order: {
        include: {
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
  });

  if (!payment || payment.order.userId !== userId) {
    throw new NotFoundError('Checkout not found.');
  }

  return mapCheckoutStatus(payment.order);
}

async function applyPaidOrder(
  prisma: PrismaClient,
  orderId: string,
  paymentId: string,
  eventId: string,
  paymentIntentId: string,
): Promise<void> {
  const paid = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      return false;
    }

    const stockLines = order.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    if (order.status === 'PAID') {
      await tx.payment.updateMany({
        where: { id: paymentId, status: { not: 'SUCCEEDED' } },
        data: {
          status: 'SUCCEEDED',
          rawEventId: eventId,
          stripePaymentIntentId: paymentIntentId,
        },
      });
      await commitOrderStock(tx, order.id, stockLines);
      return false;
    }

    if (order.status !== 'PENDING_PAYMENT') {
      logger.error('Stripe paid event for a non-pending order', {
        orderId,
        status: order.status,
        eventId,
      });
      await tx.payment.updateMany({
        where: { id: paymentId, status: { not: 'SUCCEEDED' } },
        data: {
          status: 'SUCCEEDED',
          rawEventId: eventId,
          stripePaymentIntentId: paymentIntentId,
        },
      });
      return false;
    }

    await tx.payment.updateMany({
      where: {
        id: paymentId,
        status: { not: 'SUCCEEDED' },
      },
      data: {
        status: 'SUCCEEDED',
        rawEventId: eventId,
        stripePaymentIntentId: paymentIntentId,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await commitOrderStock(tx, order.id, stockLines);
    return true;
  });

  if (!paid) {
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { email: true } },
    },
  });
  if (!order) return;

  if (order.couponCode) {
    try {
      const coupon = await getCouponByCode(prisma, order.couponCode);
      await prisma.couponUsage.upsert({
        where: { orderId: order.id },
        create: {
          couponId: coupon.id,
          userId: order.userId,
          orderId: order.id,
        },
        update: {},
      });
    } catch (error) {
      logger.warn('Coupon usage not recorded after payment', {
        orderId: order.id,
        message: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: order.userId },
  });
  if (cart) {
    const variantIds = order.items.map((item) => item.variantId);
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, variantId: { in: variantIds } },
    });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: null, lastActivityAt: new Date() },
    });
    try {
      await markAbandonedCartsRecovered(prisma, cart.id);
    } catch (error) {
      logger.warn('Abandoned cart recover failed after payment', {
        orderId: order.id,
        cartId: cart.id,
        message: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  try {
    if (order.user.email) {
      await sendOrderPaidEmail(order.user.email, {
        orderNumber: order.orderNumber,
        currency: order.currency,
        grandTotal: order.grandTotal.toString(),
        items: order.items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          lineTotal: item.lineTotal.toString(),
        })),
      });
    }
  } catch (error) {
    logger.warn('Order paid email failed', {
      orderId: order.id,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }

  logger.info('Order marked paid from Stripe webhook', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    eventId,
  });
}

async function handlePaymentIntentSucceeded(
  prisma: PrismaClient,
  event: Stripe.Event,
): Promise<void> {
  const parsed = stripePaymentIntentObjectSchema.safeParse(event.data.object);
  if (!parsed.success) {
    logger.error('Stripe payment_intent payload failed validation', {
      eventId: event.id,
    });
    throw new ValidationError('Invalid Stripe payment intent payload.');
  }

  const intent = parsed.data;
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: intent.id },
    include: { order: true },
  });

  if (!payment) {
    logger.warn('Stripe PaymentIntent has no local payment row', {
      eventId: event.id,
      paymentIntentId: intent.id,
    });
    return;
  }

  const decision = decidePaidTransition({
    paymentStatus: payment.status as PaymentStatus,
    orderId: payment.orderId,
    metadataOrderId: intent.metadata.orderId,
    orderAmountCents: toStripeAmountCents(payment.order.grandTotal.toString()),
    stripeAmountCents: intent.amount,
    orderCurrency: payment.order.currency,
    stripeCurrency: intent.currency,
    stripePaymentStatus: intent.status,
  });

  if (decision.action === 'skip') {
    logger.info('Skipping Stripe paid event', {
      reason: decision.reason,
      orderId: payment.orderId,
      eventId: event.id,
    });
    return;
  }

  if (decision.action === 'reject') {
    logger.error('Stripe paid event rejected', {
      reason: decision.reason,
      orderId: payment.orderId,
      eventId: event.id,
    });
    await prisma.payment.updateMany({
      where: { id: payment.id, status: { not: 'SUCCEEDED' } },
      data: { status: 'FAILED', rawEventId: event.id },
    });
    return;
  }

  await applyPaidOrder(
    prisma,
    payment.orderId,
    payment.id,
    event.id,
    intent.id,
  );
}

async function handlePaymentIntentTerminal(
  prisma: PrismaClient,
  event: Stripe.Event,
  nextStatus: 'FAILED' | 'CANCELLED',
): Promise<void> {
  const intentId =
    typeof event.data.object === 'object' &&
    event.data.object &&
    'id' in event.data.object &&
    typeof event.data.object.id === 'string'
      ? event.data.object.id
      : null;
  if (!intentId) return;

  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: intentId },
  });
  if (!payment || payment.status === 'SUCCEEDED') return;

  const lines = await loadOrderStockLines(prisma, payment.orderId);
  await prisma.$transaction(async (tx) => {
    await releaseOrderStock(tx, payment.orderId, lines);
    await tx.payment.updateMany({
      where: { id: payment.id, status: { not: 'SUCCEEDED' } },
      data: { status: nextStatus, rawEventId: event.id },
    });
    await tx.order.updateMany({
      where: { id: payment.orderId, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED' },
    });
  });

  logger.info('PaymentIntent terminal state', {
    orderId: payment.orderId,
    eventId: event.id,
    nextStatus,
  });
}

/**
 * Process a verified Stripe event. Signature check happens in the route handler.
 */
export async function handleStripeWebhookEvent(
  prisma: PrismaClient,
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(prisma, event);
      return;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentTerminal(prisma, event, 'FAILED');
      return;
    case 'payment_intent.canceled':
      await handlePaymentIntentTerminal(prisma, event, 'CANCELLED');
      return;
    default:
      logger.debug('Ignoring Stripe event', {
        type: event.type,
        eventId: event.id,
      });
  }
}
