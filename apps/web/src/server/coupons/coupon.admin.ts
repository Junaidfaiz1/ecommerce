import { formatMoney, type UpsertAdminCouponInput } from '@vorqen/types';
import type { PrismaClient } from '@/generated/prisma/client';
import { ConflictError, NotFoundError } from '../common/errors';
import { writeAuditLog } from '../audit';

export type AdminCoupon = {
  id: string;
  code: string;
  type: string;
  value: string;
  minSubtotal: string | null;
  maxDiscount: string | null;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

function mapCoupon(
  row: {
    id: string;
    code: string;
    type: string;
    value: { toString(): string };
    minSubtotal: { toString(): string } | null;
    maxDiscount: { toString(): string } | null;
    maxUses: number | null;
    maxUsesPerUser: number | null;
    startsAt: Date | null;
    endsAt: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { usages: number };
  },
): AdminCoupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: formatMoney(Number(row.value.toString())),
    minSubtotal: row.minSubtotal
      ? formatMoney(Number(row.minSubtotal.toString()))
      : null,
    maxDiscount: row.maxDiscount
      ? formatMoney(Number(row.maxDiscount.toString()))
      : null,
    maxUses: row.maxUses,
    maxUsesPerUser: row.maxUsesPerUser,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    isActive: row.isActive,
    usageCount: row._count?.usages ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAdminCoupons(prisma: PrismaClient) {
  const rows = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { usages: true } } },
  });
  return rows.map(mapCoupon);
}

export async function upsertAdminCoupon(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpsertAdminCouponInput,
  ip: string | null,
): Promise<AdminCoupon> {
  const data = {
    code: input.code,
    type: input.type,
    value: input.value,
    minSubtotal: input.minSubtotal ?? null,
    maxDiscount: input.maxDiscount ?? null,
    maxUses: input.maxUses ?? null,
    maxUsesPerUser: input.maxUsesPerUser ?? null,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    isActive: input.isActive,
  };

  try {
    const row = input.id
      ? await prisma.coupon.update({
          where: { id: input.id },
          data,
          include: { _count: { select: { usages: true } } },
        })
      : await prisma.coupon.create({
          data,
          include: { _count: { select: { usages: true } } },
        });
    await writeAuditLog(prisma, {
      actorUserId,
      action: input.id ? 'coupon.update' : 'coupon.create',
      entityType: 'Coupon',
      entityId: row.id,
      metadata: { code: row.code },
      ip,
    });
    return mapCoupon(row);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new ConflictError('Coupon code already exists.');
    }
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      throw new NotFoundError('Coupon not found.');
    }
    throw error;
  }
}
