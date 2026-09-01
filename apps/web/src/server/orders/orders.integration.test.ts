import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { NotFoundError, ValidationError } from '../common/errors';
import { addCartItem } from '../cart';
import { createCheckoutSession } from '../checkout';
import {
  cancelPendingOrder,
  getMyOrder,
  listMyOrders,
} from './orders.service';
import {
  resetStripeTestHooks,
  stripeTestHooks,
} from '../payments/stripe.client';
import { IDS, authUser, seedShop } from '../test/fixtures';
import { createMemoryPrisma } from '../test/memory-prisma';

const customer = authUser(IDS.customer);
const identity = { userId: IDS.customer, sessionId: null };

describe('order ownership and cancellation', () => {
  afterEach(() => {
    resetStripeTestHooks();
  });

  it('creates an order from server cart prices and hides it from other users', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });
    stripeTestHooks.createPaymentIntent = async () => ({
      id: 'pi_order_own_1',
      clientSecret: 'secret',
    });

    const session = await createCheckoutSession(
      prisma,
      customer,
      identity,
      { shippingAddressId: IDS.address },
    );

    const mine = await getMyOrder(prisma, IDS.customer, session.orderId);
    assert.equal(mine.grandTotal, '1299.00');
    assert.equal(mine.items[0]?.productName, 'GeForce RTX 4080 SUPER 16GB');

    await assert.rejects(
      () => getMyOrder(prisma, IDS.other, session.orderId),
      NotFoundError,
    );

    const otherList = await listMyOrders(prisma, IDS.other, {
      page: 1,
      pageSize: 10,
    });
    assert.equal(otherList.items.length, 0);
  });

  it('cancels a pending order and releases the reservation', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });
    stripeTestHooks.createPaymentIntent = async () => ({
      id: 'pi_order_cancel_1',
      clientSecret: 'secret',
    });

    const session = await createCheckoutSession(
      prisma,
      customer,
      identity,
      { shippingAddressId: IDS.address },
    );

    const cancelled = await cancelPendingOrder(
      prisma,
      IDS.customer,
      session.orderId,
    );
    assert.equal(cancelled.status, 'CANCELLED');

    const stock = await prisma.inventory.findUnique({
      where: { variantId: IDS.gpuVar },
    });
    assert.equal(stock?.quantityReserved, 0);
    assert.equal(stock?.quantityOnHand, 10);
  });

  it('refuses to cancel an order that is no longer pending payment', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });
    stripeTestHooks.createPaymentIntent = async () => ({
      id: 'pi_order_cancel_2',
      clientSecret: 'secret',
    });

    const session = await createCheckoutSession(
      prisma,
      customer,
      identity,
      { shippingAddressId: IDS.address },
    );
    await prisma.order.update({
      where: { id: session.orderId },
      data: { status: 'PAID' },
    });

    await assert.rejects(
      () => cancelPendingOrder(prisma, IDS.customer, session.orderId),
      ValidationError,
    );
  });
});
