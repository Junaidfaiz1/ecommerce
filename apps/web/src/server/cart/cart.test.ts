import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addCartItemInputSchema,
  applyCouponInputSchema,
  CART_MAX_LINE_QUANTITY,
  evaluateCouponDiscount,
  formatMoney,
  type CouponSnapshot,
} from '@vorqen/types';

const baseCoupon: CouponSnapshot = {
  code: 'BUILD10',
  type: 'PERCENTAGE',
  value: 10,
  minSubtotal: 100,
  maxDiscount: 150,
  maxUses: 1000,
  maxUsesPerUser: 3,
  startsAt: null,
  endsAt: null,
  isActive: true,
};

describe('cart schemas', () => {
  it('accepts a valid add-to-cart payload', () => {
    const parsed = addCartItemInputSchema.parse({
      variantId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      quantity: 2,
    });
    assert.equal(parsed.quantity, 2);
  });

  it('rejects quantity above the soft cap', () => {
    const result = addCartItemInputSchema.safeParse({
      variantId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      quantity: CART_MAX_LINE_QUANTITY + 1,
    });
    assert.equal(result.success, false);
  });

  it('normalizes coupon codes to uppercase', () => {
    const parsed = applyCouponInputSchema.parse({ code: 'build10' });
    assert.equal(parsed.code, 'BUILD10');
  });
});

describe('coupon discount math', () => {
  it('applies percentage with max discount cap', () => {
    const result = evaluateCouponDiscount(baseCoupon, 2000, {
      totalUses: 0,
      userUses: 0,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.discount, 150);
      assert.equal(result.code, 'BUILD10');
    }
  });

  it('rejects below min subtotal', () => {
    const result = evaluateCouponDiscount(baseCoupon, 50, {
      totalUses: 0,
      userUses: 0,
    });
    assert.equal(result.ok, false);
  });

  it('applies fixed amount without exceeding subtotal', () => {
    const coupon: CouponSnapshot = {
      ...baseCoupon,
      code: 'FLAT25',
      type: 'FIXED_AMOUNT',
      value: 25,
      minSubtotal: null,
      maxDiscount: null,
    };
    const result = evaluateCouponDiscount(coupon, 20, {
      totalUses: 0,
      userUses: 0,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.discount, 20);
    }
  });

  it('rejects expired coupons', () => {
    const coupon: CouponSnapshot = {
      ...baseCoupon,
      endsAt: new Date('2020-01-01T00:00:00.000Z'),
    };
    const result = evaluateCouponDiscount(coupon, 500, {
      now: new Date('2026-08-25T00:00:00.000Z'),
      totalUses: 0,
      userUses: 0,
    });
    assert.equal(result.ok, false);
  });

  it('rejects when per-user uses exhausted', () => {
    const result = evaluateCouponDiscount(baseCoupon, 500, {
      totalUses: 10,
      userUses: 3,
    });
    assert.equal(result.ok, false);
  });

  it('formats money to two decimals', () => {
    assert.equal(formatMoney(10.5), '10.50');
    assert.equal(formatMoney(10.556), '10.56');
  });
});
