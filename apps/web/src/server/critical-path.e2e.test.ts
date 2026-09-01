import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { toStripeAmountCents } from '@vorqen/types';
import type Stripe from 'stripe';
import { addBuildToCart, applyCoupon, getCart } from './cart';
import { createCheckoutSession, handleStripeWebhookEvent } from './checkout';
import { getMyOrder } from './orders';
import {
  resetStripeTestHooks,
  stripeTestHooks,
} from './payments/stripe.client';
import { IDS, authUser, seedShop } from './test/fixtures';
import { createMemoryPrisma } from './test/memory-prisma';

/**
 * Builder save → add to cart → coupon → checkout → webhook paid.
 * UI Playwright smoke is separate (`pnpm test:e2e`); this is the always-on path.
 */
describe('critical path: build to paid order', () => {
  afterEach(() => {
    resetStripeTestHooks();
  });

  it('walks save-equivalent build add-to-cart through webhook-paid inventory commit', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    const identity = { userId: IDS.customer, sessionId: null };

    const cart = await addBuildToCart(prisma, identity, {
      buildId: IDS.compatibleBuild,
    });
    assert.equal(cart.items.length, 8);
    assert.equal(cart.totals.subtotal, '2662.00');

    const discounted = await applyCoupon(prisma, identity, { code: 'BUILD10' });
    assert.equal(discounted.totals.discount, '150.00');
    assert.equal(discounted.totals.total, '2512.00');

    stripeTestHooks.createPaymentIntent = async (input) => {
      assert.equal(input.amountCents, toStripeAmountCents('2512.00'));
      assert.equal(input.userId, IDS.customer);
      return { id: 'pi_critical_1', clientSecret: 'secret_critical' };
    };

    const session = await createCheckoutSession(
      prisma,
      authUser(IDS.customer),
      identity,
      { shippingAddressId: IDS.address },
    );

    const pending = await getMyOrder(prisma, IDS.customer, session.orderId);
    assert.equal(pending.status, 'PENDING_PAYMENT');
    assert.equal(pending.grandTotal, '2512.00');

    await handleStripeWebhookEvent(prisma, {
      id: 'evt_critical_1',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_critical_1',
          object: 'payment_intent',
          amount: toStripeAmountCents('2512.00'),
          currency: 'usd',
          status: 'succeeded',
          metadata: { orderId: session.orderId, userId: IDS.customer },
        },
      },
    } as Stripe.Event);

    const paid = await getMyOrder(prisma, IDS.customer, session.orderId);
    assert.equal(paid.status, 'PAID');
    assert.equal(paid.paymentStatus, 'SUCCEEDED');

    const gpu = await prisma.inventory.findUnique({
      where: { variantId: IDS.gpuVar },
    });
    assert.equal(gpu?.quantityOnHand, 9);
    assert.equal(gpu?.quantityReserved, 0);

    const emptied = await getCart(prisma, identity);
    assert.equal(emptied?.items.length, 0);
    assert.equal(emptied?.totals.couponCode, null);
  });
});
