import { formatMoney, type OrderListInput } from '@vorqen/types';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { paginationMeta } from '../catalog/catalog.filters';
import { NotFoundError, ValidationError } from '../common/errors';
import {
  cancelStripePaymentIntent,
} from '../payments/stripe.client';
import {
  loadOrderStockLines,
  releaseOrderStock,
} from '../inventory';

const orderInclude = {
  items: { orderBy: { id: 'asc' as const } },
  payments: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export type MappedOrderLine = {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
};

export type MappedOrder = {
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
  items: MappedOrderLine[];
};

export type OrderConnection = {
  items: MappedOrder[];
  pageInfo: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

function mapOrder(row: OrderRow): MappedOrder {
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

export async function listMyOrders(
  prisma: PrismaClient,
  userId: string,
  input: OrderListInput,
): Promise<OrderConnection> {
  const where: Prisma.OrderWhereInput = {
    userId,
    ...(input.status ? { status: input.status } : {}),
  };

  const totalCount = await prisma.order.count({ where });
  const meta = paginationMeta(totalCount, input.page, input.pageSize);

  const rows = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
    skip: meta.skip,
    take: meta.pageSize,
  });

  return {
    items: rows.map(mapOrder),
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

export async function getMyOrder(
  prisma: PrismaClient,
  userId: string,
  orderId: string,
): Promise<MappedOrder> {
  const row = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: orderInclude,
  });
  if (!row) {
    throw new NotFoundError('Order not found.');
  }
  return mapOrder(row);
}

export async function cancelPendingOrder(
  prisma: PrismaClient,
  userId: string,
  orderId: string,
): Promise<MappedOrder> {
  const row = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { payments: true, items: true },
  });
  if (!row) {
    throw new NotFoundError('Order not found.');
  }
  if (row.status !== 'PENDING_PAYMENT') {
    throw new ValidationError('Only unpaid orders can be cancelled.');
  }

  await abortPendingOrder(prisma, row.id);
  return getMyOrder(prisma, userId, orderId);
}

/**
 * Release reserved stock, cancel Stripe PI, mark order CANCELLED.
 * Safe to call more than once.
 */
export async function abortPendingOrder(
  prisma: PrismaClient,
  orderId: string,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true, items: true },
  });
  if (!order || order.status !== 'PENDING_PAYMENT') {
    return;
  }

  const lines = order.items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
  }));

  await prisma.$transaction(async (tx) => {
    await releaseOrderStock(tx, order.id, lines);
    await tx.payment.updateMany({
      where: {
        orderId: order.id,
        status: { in: ['REQUIRES_PAYMENT', 'PROCESSING', 'FAILED'] },
      },
      data: { status: 'CANCELLED' },
    });
    await tx.order.updateMany({
      where: { id: order.id, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED' },
    });
  });

  for (const payment of order.payments) {
    if (payment.stripePaymentIntentId && payment.status !== 'SUCCEEDED') {
      await cancelStripePaymentIntent(payment.stripePaymentIntentId);
    }
  }
}

export async function abortPendingOrderFromWebhook(
  prisma: PrismaClient,
  orderId: string,
): Promise<void> {
  const lines = await loadOrderStockLines(prisma, orderId);
  await prisma.$transaction(async (tx) => {
    await releaseOrderStock(tx, orderId, lines);
    await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED' },
    });
  });
}
