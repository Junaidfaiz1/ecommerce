import type { PrismaClient } from '@/generated/prisma/client';

export type AdminOverview = {
  pendingPaymentOrders: number;
  openFulfillmentOrders: number;
  pendingReviews: number;
  lowStockVariants: number;
  activeCustomers: number;
};

export async function getAdminOverview(
  prisma: PrismaClient,
): Promise<AdminOverview> {
  const [
    pendingPaymentOrders,
    openFulfillmentOrders,
    pendingReviews,
    inventory,
    activeCustomers,
  ] = await Promise.all([
    prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
    prisma.order.count({
      where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED'] } },
    }),
    prisma.review.count({ where: { status: 'PENDING' } }),
    prisma.inventory.findMany({
      select: { quantityOnHand: true, lowStockThreshold: true },
    }),
    prisma.user.count({ where: { isActive: true, role: 'CUSTOMER' } }),
  ]);

  return {
    pendingPaymentOrders,
    openFulfillmentOrders,
    pendingReviews,
    lowStockVariants: inventory.filter(
      (row) => row.quantityOnHand <= row.lowStockThreshold,
    ).length,
    activeCustomers,
  };
}
