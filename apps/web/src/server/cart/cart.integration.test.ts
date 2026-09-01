import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  IncompatibleBuildError,
  InsufficientStockError,
  InvalidCouponError,
} from '../common/errors';
import {
  addBuildToCart,
  addCartItem,
  applyCoupon,
  getCart,
} from './cart.service';
import { IDS, PRICES, seedShop } from '../test/fixtures';
import { createMemoryPrisma } from '../test/memory-prisma';

const identity = { userId: IDS.customer, sessionId: null };

describe('cart pricing (server authority)', () => {
  it('prices lines from variant rows, not a client-supplied amount', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);

    const cart = await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 2,
    });

    assert.equal(cart.totals.subtotal, '2598.00');
    assert.equal(cart.totals.total, '2598.00');
    assert.equal(cart.items[0]?.unitPrice, PRICES.gpu);
    assert.equal(cart.items[0]?.lineTotal, '2598.00');
    assert.equal(cart.items[0]?.availableQuantity, 10);
  });

  it('rejects adding more than available stock', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await prisma.inventory.update({
      where: { variantId: IDS.gpuVar },
      data: { quantityOnHand: 1, quantityReserved: 0 },
    });

    await assert.rejects(
      () =>
        addCartItem(prisma, identity, {
          variantId: IDS.gpuVar,
          quantity: 2,
        }),
      InsufficientStockError,
    );
  });

  it('applies BUILD10 from coupon rows with the max-discount cap', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });

    const cart = await applyCoupon(prisma, identity, { code: 'build10' });
    assert.equal(cart.totals.couponCode, 'BUILD10');
    assert.equal(cart.totals.couponValid, true);
    assert.equal(cart.totals.subtotal, '1299.00');
    assert.equal(cart.totals.discount, '129.90');
    assert.equal(cart.totals.total, '1169.10');
  });

  it('rejects an unknown coupon code', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });

    await assert.rejects(
      () => applyCoupon(prisma, identity, { code: 'NOPE' }),
      InvalidCouponError,
    );
  });

  it('adds a compatible saved build using live variant prices, not the snapshot', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);

    const cart = await addBuildToCart(prisma, identity, {
      buildId: IDS.compatibleBuild,
    });

    assert.equal(cart.items.length, 8);
    assert.equal(cart.totals.subtotal, '2662.00');
    assert.notEqual(cart.totals.total, '1.00');
  });

  it('blocks addBuildToCart when the engine reports a hard incompatibility', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);

    await assert.rejects(
      () =>
        addBuildToCart(prisma, identity, {
          buildId: IDS.incompatibleBuild,
        }),
      IncompatibleBuildError,
    );

    const cart = await getCart(prisma, identity);
    assert.equal(cart, null);
  });
});
