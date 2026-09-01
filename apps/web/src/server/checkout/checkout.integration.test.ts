import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type Stripe from 'stripe';
import { toStripeAmountCents } from '@vorqen/types';
import {
  UnauthenticatedError,
  ValidationError,
} from '../common/errors';
import {
  createCheckoutSession,
  getCheckoutStatus,
  handleStripeWebhookEvent,
} from './checkout.service';
import { addCartItem, applyCoupon, getCart } from '../cart';
import { getMyOrder } from '../orders';
import {
  resetStripeTestHooks,
  stripeTestHooks,
} from '../payments/stripe.client';
import { checkoutResolvers } from '../graphql/resolvers/checkout';
import { IDS, authUser, seedShop } from '../test/fixtures';
import { createMemoryPrisma } from '../test/memory-prisma';
import { testContext } from '../test/graphql';

const customer = authUser(IDS.customer);
const identity = { userId: IDS.customer, sessionId: null };

function succeededEvent(input: {
  paymentIntentId: string;
  orderId: string;
  amountCents: number;
  currency?: string;
}): Stripe.Event {
  return {
    id: `evt_${input.paymentIntentId}`,
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: input.paymentIntentId,
        object: 'payment_intent',
        amount: input.amountCents,
        currency: input.currency ?? 'usd',
        status: 'succeeded',
        metadata: { orderId: input.orderId, userId: IDS.customer },
      },
    },
  } as unknown as Stripe.Event;
}

async function stubIntent() {
  stripeTestHooks.createPaymentIntent = async (input) => ({
    id: 'pi_test_checkout_1',
    clientSecret: `cs_test_${input.orderId}`,
  });
}

describe('checkout + Stripe webhook', () => {
  afterEach(() => {
    resetStripeTestHooks();
  });

  it('snapshots server cart totals and ignores a client-side paid signal', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });
    await applyCoupon(prisma, identity, { code: 'BUILD10' });
    await stubIntent();

    const session = await createCheckoutSession(
      prisma,
      customer,
      identity,
      { shippingAddressId: IDS.address },
    );

    assert.equal(session.paymentIntentId, 'pi_test_checkout_1');
    const order = await prisma.order.findUnique({
      where: { id: session.orderId },
      include: { payments: true, items: true },
    });
    assert.equal(order?.status, 'PENDING_PAYMENT');
    assert.equal(order?.grandTotal.toString(), '1169.10');
    assert.equal(order?.items[0]?.unitPrice.toString(), '1299.00');
    assert.equal(order?.payments[0]?.status, 'REQUIRES_PAYMENT');

    const stock = await prisma.inventory.findUnique({
      where: { variantId: IDS.gpuVar },
    });
    assert.equal(stock?.quantityOnHand, 10);
    assert.equal(stock?.quantityReserved, 1);
  });

  it('marks paid only after a matching payment_intent.succeeded webhook', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });
    await stubIntent();

    const session = await createCheckoutSession(
      prisma,
      customer,
      identity,
      { shippingAddressId: IDS.address },
    );

    const statusBefore = await getCheckoutStatus(prisma, IDS.customer, {
      paymentIntentId: session.paymentIntentId,
    });
    assert.equal(statusBefore.orderStatus, 'PENDING_PAYMENT');
    assert.equal(statusBefore.paidAt, null);

    await handleStripeWebhookEvent(
      prisma,
      succeededEvent({
        paymentIntentId: session.paymentIntentId,
        orderId: session.orderId,
        amountCents: toStripeAmountCents('1299.00'),
      }),
    );

    const paid = await getMyOrder(prisma, IDS.customer, session.orderId);
    assert.equal(paid.status, 'PAID');
    assert.ok(paid.paidAt);
    assert.equal(paid.paymentStatus, 'SUCCEEDED');

    const stock = await prisma.inventory.findUnique({
      where: { variantId: IDS.gpuVar },
    });
    assert.equal(stock?.quantityOnHand, 9);
    assert.equal(stock?.quantityReserved, 0);

    const cart = await getCart(prisma, identity);
    assert.equal(cart?.items.length, 0);

    await handleStripeWebhookEvent(
      prisma,
      succeededEvent({
        paymentIntentId: session.paymentIntentId,
        orderId: session.orderId,
        amountCents: toStripeAmountCents('1299.00'),
      }),
    );
    const stockAgain = await prisma.inventory.findUnique({
      where: { variantId: IDS.gpuVar },
    });
    assert.equal(stockAgain?.quantityOnHand, 9);
  });

  it('rejects an amount mismatch and does not mark the order paid', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });
    await stubIntent();

    const session = await createCheckoutSession(
      prisma,
      customer,
      identity,
      { shippingAddressId: IDS.address },
    );

    await handleStripeWebhookEvent(
      prisma,
      succeededEvent({
        paymentIntentId: session.paymentIntentId,
        orderId: session.orderId,
        amountCents: 1,
      }),
    );

    const order = await prisma.order.findUnique({
      where: { id: session.orderId },
      include: { payments: true },
    });
    assert.equal(order?.status, 'PENDING_PAYMENT');
    assert.equal(order?.payments[0]?.status, 'FAILED');
  });

  it('releases reserved stock when the payment intent is canceled', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });
    await stubIntent();

    const session = await createCheckoutSession(
      prisma,
      customer,
      identity,
      { shippingAddressId: IDS.address },
    );

    await handleStripeWebhookEvent(prisma, {
      id: 'evt_cancel',
      type: 'payment_intent.canceled',
      data: { object: { id: session.paymentIntentId } },
    } as unknown as Stripe.Event);

    const order = await prisma.order.findUnique({
      where: { id: session.orderId },
    });
    assert.equal(order?.status, 'CANCELLED');
    const stock = await prisma.inventory.findUnique({
      where: { variantId: IDS.gpuVar },
    });
    assert.equal(stock?.quantityOnHand, 10);
    assert.equal(stock?.quantityReserved, 0);
  });

  it('requires an authenticated user to start checkout', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    const ctx = testContext(prisma, null);

    await assert.rejects(
      () =>
        checkoutResolvers.Mutation.createCheckoutSession(
          null,
          { input: { shippingAddressId: IDS.address } },
          ctx,
        ),
      UnauthenticatedError,
    );
  });

  it('rejects an empty cart', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await stubIntent();

    await assert.rejects(
      () =>
        createCheckoutSession(prisma, customer, identity, {
          shippingAddressId: IDS.address,
        }),
      ValidationError,
    );
  });
});
