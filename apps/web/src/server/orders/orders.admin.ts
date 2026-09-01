import {
  canAdminTransitionOrder,
  formatMoney,
  remainingRefundable,
  toStripeAmountCents,
  type AdminOrderListInput,
  type OrderStatus,
  type RefundAdminOrderInput,
  type UpdateAdminOrderStatusInput,
} from '@vorqen/types';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { paginationMeta } from '../catalog/catalog.filters';
import {
  NotFoundError,
  PaymentFailedError,
  ValidationError,
} from '../common/errors';
import { writeAuditLog } from '../audit';
import { abortPendingOrder } from './orders.service';
import {
  loadOrderStockLines,
  restockSoldLines,
} from '../inventory';
import { createStripeRefund } from '../payments/stripe.client';
import { logger } from '../common/logger';

const adminOrderInclude = {
  items: { orderBy: { id: 'asc' as const } },
  payments: {
    orderBy: { createdAt: 'desc' as const },
    include: { refunds: true },
  },
  user: { select: { id: true, email: true } },
} satisfies Prisma.OrderInclude;

type AdminOrderRow = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;

export type AdminOrderLine = {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  couponCode: string | null;
  shipName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipState: string | null;
  shipPostalCode: string;
  shipCountry: string;
  shipPhone: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentStatus: string;
  userId: string;
  customerEmail: string;
  refundedTotal: string;
  items: AdminOrderLine[];
};

function refundedSucceeded(row: AdminOrderRow): number {
  const payment = row.payments[0];
  if (!payment) return 0;
  return payment.refunds
    .filter((r) => r.status === 'SUCCEEDED')
    .reduce((sum, r) => sum + Number(r.amount.toString()), 0);
}

function mapAdminOrder(row: AdminOrderRow): AdminOrder {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    currency: row.currency,
    subtotal: formatMoney(Number(row.subtotal.toString())),
    discountTotal: formatMoney(Number(row.discountTotal.toString())),
    shippingTotal: formatMoney(Number(row.shippingTotal.toString())),
    taxTotal: formatMoney(Number(row.taxTotal.toString())),
    grandTotal: formatMoney(Number(row.grandTotal.toString())),
    couponCode: row.couponCode,
    shipName: row.shipName,
    shipLine1: row.shipLine1,
    shipLine2: row.shipLine2,
    shipCity: row.shipCity,
    shipState: row.shipState,
    shipPostalCode: row.shipPostalCode,
    shipCountry: row.shipCountry,
    shipPhone: row.shipPhone,
    paidAt: row.paidAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    paymentStatus: row.payments[0]?.status ?? 'REQUIRES_PAYMENT',
    userId: row.userId,
    customerEmail: row.user.email,
    refundedTotal: formatMoney(refundedSucceeded(row)),
    items: row.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productName: item.productName,
      sku: item.sku,
      unitPrice: formatMoney(Number(item.unitPrice.toString())),
      quantity: item.quantity,
      lineTotal: formatMoney(Number(item.lineTotal.toString())),
    })),
  };
}

export async function listAdminOrders(
  prisma: PrismaClient,
  input: AdminOrderListInput,
) {
  const where: Prisma.OrderWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.query
      ? {
          OR: [
            { orderNumber: { contains: input.query, mode: 'insensitive' } },
            { user: { email: { contains: input.query, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
  const totalCount = await prisma.order.count({ where });
  const meta = paginationMeta(totalCount, input.page, input.pageSize);
  const rows = await prisma.order.findMany({
    where,
    include: adminOrderInclude,
    orderBy: { createdAt: 'desc' },
    skip: meta.skip,
    take: meta.pageSize,
  });
  return {
    items: rows.map(mapAdminOrder),
    pageInfo: {
      page: meta.page,
      pageSize: meta.pageSize,
      totalCount: meta.totalCount,
      totalPages: meta.totalPages,
      hasNextPage: meta.hasNextPage,
      hasPreviousPage: meta.hasPreviousPage,
    },
  };
}

export async function getAdminOrder(prisma: PrismaClient, id: string) {
  const row = await prisma.order.findUnique({
    where: { id },
    include: adminOrderInclude,
  });
  if (!row) throw new NotFoundError('Order not found.');
  return mapAdminOrder(row);
}

export async function updateAdminOrderStatus(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpdateAdminOrderStatusInput,
  ip: string | null,
) {
  const order = await prisma.order.findUnique({ where: { id: input.id } });
  if (!order) throw new NotFoundError('Order not found.');

  const from = order.status as OrderStatus;
  const to = input.status;

  if (from === 'PENDING_PAYMENT' && to === 'CANCELLED') {
    await abortPendingOrder(prisma, order.id);
    await writeAuditLog(prisma, {
      actorUserId,
      action: 'order.cancel_pending',
      entityType: 'Order',
      entityId: order.id,
      ip,
    });
    return getAdminOrder(prisma, order.id);
  }

  if (!canAdminTransitionOrder(from, to)) {
    throw new ValidationError(
      `Cannot change order from ${from} to ${to}.`,
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: to },
  });
  await writeAuditLog(prisma, {
    actorUserId,
    action: 'order.status',
    entityType: 'Order',
    entityId: order.id,
    metadata: { from, to },
    ip,
  });
  return getAdminOrder(prisma, order.id);
}

export async function refundAdminOrder(
  prisma: PrismaClient,
  actorUserId: string,
  input: RefundAdminOrderInput,
  ip: string | null,
) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: adminOrderInclude,
  });
  if (!order) throw new NotFoundError('Order not found.');

  const payment = order.payments[0];
  if (!payment || payment.status === 'REQUIRES_PAYMENT') {
    throw new ValidationError('This order has no captured payment to refund.');
  }
  if (!payment.stripePaymentIntentId) {
    throw new ValidationError('Missing Stripe payment intent for this order.');
  }

  const already = refundedSucceeded(order);
  const remaining = remainingRefundable(
    Number(payment.amount.toString()),
    already,
  );
  const amount = Number(input.amount);
  if (amount <= 0 || amount > remaining) {
    throw new ValidationError(
      `Refund must be between 0.01 and ${formatMoney(remaining)}.`,
    );
  }

  const refundRow = await prisma.refund.create({
    data: {
      paymentId: payment.id,
      amount: input.amount,
      status: 'PENDING',
      reason: input.reason ?? null,
    },
  });

  try {
    const stripeRefund = await createStripeRefund({
      paymentIntentId: payment.stripePaymentIntentId,
      amountCents: toStripeAmountCents(input.amount),
      reason: input.reason,
    });

    const newRefunded = already + amount;
    const paymentAmount = Number(payment.amount.toString());
    const fullyRefunded = newRefunded + 0.001 >= paymentAmount;

    await prisma.$transaction(async (tx) => {
      await tx.refund.update({
        where: { id: refundRow.id },
        data: {
          status: 'SUCCEEDED',
          stripeRefundId: stripeRefund.id,
        },
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
      });
      if (input.restock && fullyRefunded) {
        const lines = await loadOrderStockLines(tx, order.id);
        await restockSoldLines(tx, order.id, lines, actorUserId);
      }
      await writeAuditLog(tx, {
        actorUserId,
        action: 'order.refund',
        entityType: 'Order',
        entityId: order.id,
        metadata: { amount: input.amount, fullyRefunded, restock: input.restock },
        ip,
      });
    });
  } catch (error) {
    await prisma.refund.update({
      where: { id: refundRow.id },
      data: { status: 'FAILED' },
    });
    logger.error('Admin refund failed', {
      orderId: order.id,
      refundId: refundRow.id,
    });
    if (error instanceof ValidationError || error instanceof PaymentFailedError) {
      throw error;
    }
    throw new PaymentFailedError('Stripe refund failed. No local refund recorded as succeeded.');
  }

  return getAdminOrder(prisma, order.id);
}
