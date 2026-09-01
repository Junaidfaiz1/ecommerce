import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canAdminTransitionOrder,
  remainingRefundable,
  upsertAdminCouponInputSchema,
  upsertAdminProductInputSchema,
  updateAdminOrderStatusInputSchema,
} from '@vorqen/types';

describe('admin order transitions', () => {
  it('allows fulfillment forward from paid', () => {
    assert.equal(canAdminTransitionOrder('PAID', 'PROCESSING'), true);
    assert.equal(canAdminTransitionOrder('PROCESSING', 'SHIPPED'), true);
    assert.equal(canAdminTransitionOrder('SHIPPED', 'DELIVERED'), true);
  });

  it('never lets staff mark an order paid', () => {
    assert.equal(canAdminTransitionOrder('PROCESSING', 'PAID'), false);
    assert.equal(canAdminTransitionOrder('PENDING_PAYMENT', 'PAID'), false);
    const parsed = updateAdminOrderStatusInputSchema.safeParse({
      id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      status: 'PAID',
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(canAdminTransitionOrder('PENDING_PAYMENT', parsed.data.status), false);
    }
  });
});

describe('remainingRefundable', () => {
  it('caps at zero', () => {
    assert.equal(remainingRefundable(100, 100), 0);
    assert.equal(remainingRefundable(99.99, 40), 59.99);
  });
});

describe('admin coupon schema', () => {
  it('uppercases codes and rejects percentage over 100', () => {
    const parsed = upsertAdminCouponInputSchema.parse({
      code: 'build-10',
      type: 'PERCENTAGE',
      value: 10,
    });
    assert.equal(parsed.code, 'BUILD-10');
    assert.equal(
      upsertAdminCouponInputSchema.safeParse({
        code: 'BAD',
        type: 'PERCENTAGE',
        value: 150,
      }).success,
      false,
    );
  });
});

describe('admin product schema', () => {
  it('defaults new products to draft', () => {
    const parsed = upsertAdminProductInputSchema.parse({
      brandId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      categoryId: 'clyyyyyyyyyyyyyyyyyyyyyyyyy',
      type: 'GPU',
      name: 'Test GPU',
      slug: 'test-gpu',
    });
    assert.equal(parsed.status, 'DRAFT');
    assert.equal(parsed.isFeatured, false);
  });
});
