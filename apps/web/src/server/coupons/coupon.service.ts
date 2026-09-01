import {
  evaluateCouponDiscount,
  formatMoney,
  type CouponEvalResult,
  type CouponSnapshot,
} from '@vorqen/types';
import type { Coupon, PrismaClient } from '@/generated/prisma/client';
import { InvalidCouponError, NotFoundError } from '../common/errors';

function toSnapshot(coupon: Coupon): CouponSnapshot {
  return {
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value.toString()),
    minSubtotal: coupon.minSubtotal
      ? Number(coupon.minSubtotal.toString())
      : null,
    maxDiscount: coupon.maxDiscount
      ? Number(coupon.maxDiscount.toString())
      : null,
    maxUses: coupon.maxUses,
    maxUsesPerUser: coupon.maxUsesPerUser,
    startsAt: coupon.startsAt,
    endsAt: coupon.endsAt,
    isActive: coupon.isActive,
  };
}

async function usageCounts(
  prisma: PrismaClient,
  couponId: string,
  userId: string | null,
): Promise<{ totalUses: number; userUses: number }> {
  const [totalUses, userUses] = await Promise.all([
    prisma.couponUsage.count({ where: { couponId } }),
    userId
      ? prisma.couponUsage.count({ where: { couponId, userId } })
      : Promise.resolve(0),
  ]);
  return { totalUses, userUses };
}

/**
 * Soft evaluate — returns ok/fail without throwing (for cart display).
 */
export async function softEvaluateCoupon(
  prisma: PrismaClient,
  code: string,
  subtotal: number,
  userId: string | null,
): Promise<CouponEvalResult> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon) {
    return { ok: false, reason: 'Coupon not found.' };
  }
  const counts = await usageCounts(prisma, coupon.id, userId);
  return evaluateCouponDiscount(toSnapshot(coupon), subtotal, counts);
}

/**
 * Hard validate for applyCoupon mutation — throws INVALID_COUPON.
 */
export async function requireValidCoupon(
  prisma: PrismaClient,
  code: string,
  subtotal: number,
  userId: string | null,
): Promise<{ code: string; discount: number }> {
  const normalized = code.toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
  });
  if (!coupon) {
    throw new InvalidCouponError('Coupon not found.', { code: normalized });
  }
  const counts = await usageCounts(prisma, coupon.id, userId);
  const result = evaluateCouponDiscount(toSnapshot(coupon), subtotal, counts);
  if (!result.ok) {
    throw new InvalidCouponError(result.reason, { code: normalized });
  }
  return { code: result.code, discount: result.discount };
}

export async function getCouponByCode(
  prisma: PrismaClient,
  code: string,
): Promise<Coupon> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon) {
    throw new NotFoundError('Coupon not found.', { code });
  }
  return coupon;
}

export { formatMoney, evaluateCouponDiscount, toSnapshot };
export type { CouponSnapshot };
