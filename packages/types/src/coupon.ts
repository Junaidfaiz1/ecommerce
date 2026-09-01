export const COUPON_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

/** Plain coupon shape for pure discount math (no Prisma). */
export type CouponSnapshot = {
  code: string;
  type: CouponType;
  /** Percentage 0–100 or fixed currency amount. */
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

export type CouponEvalOk = {
  ok: true;
  code: string;
  discount: number;
};

export type CouponEvalFail = {
  ok: false;
  reason: string;
};

export type CouponEvalResult = CouponEvalOk | CouponEvalFail;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Server-authoritative coupon discount. Callers supply usage counts from DB.
 * Never trust a client-computed discount amount.
 */
export function evaluateCouponDiscount(
  coupon: CouponSnapshot,
  subtotal: number,
  opts: {
    now?: Date;
    totalUses: number;
    userUses: number;
  },
): CouponEvalResult {
  const now = opts.now ?? new Date();
  const code = coupon.code.toUpperCase();

  if (!coupon.isActive) {
    return { ok: false, reason: 'This coupon is inactive.' };
  }
  if (coupon.startsAt && now < coupon.startsAt) {
    return { ok: false, reason: 'This coupon is not active yet.' };
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    return { ok: false, reason: 'This coupon has expired.' };
  }
  if (coupon.maxUses != null && opts.totalUses >= coupon.maxUses) {
    return { ok: false, reason: 'This coupon has reached its usage limit.' };
  }
  if (
    coupon.maxUsesPerUser != null &&
    opts.userUses >= coupon.maxUsesPerUser
  ) {
    return {
      ok: false,
      reason: 'You have already used this coupon the maximum times.',
    };
  }
  if (subtotal < 0 || !Number.isFinite(subtotal)) {
    return { ok: false, reason: 'Invalid cart subtotal.' };
  }
  if (coupon.minSubtotal != null && subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      reason: `Minimum subtotal of ${coupon.minSubtotal.toFixed(2)} required.`,
    };
  }

  let discount = 0;
  if (coupon.type === 'PERCENTAGE') {
    if (coupon.value < 0 || coupon.value > 100) {
      return { ok: false, reason: 'This coupon is misconfigured.' };
    }
    discount = (subtotal * coupon.value) / 100;
  } else {
    if (coupon.value < 0) {
      return { ok: false, reason: 'This coupon is misconfigured.' };
    }
    discount = coupon.value;
  }

  if (coupon.maxDiscount != null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, subtotal);
  discount = roundMoney(discount);

  if (discount <= 0) {
    return { ok: false, reason: 'This coupon does not apply to the cart.' };
  }

  return { ok: true, code, discount };
}

export function formatMoney(n: number): string {
  return roundMoney(n).toFixed(2);
}
