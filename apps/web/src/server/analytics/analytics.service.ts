import {
  abandonedFunnelFromCounts,
  adminAnalyticsInputSchema,
  analyticsWindow,
  averageOrderValue,
  bucketByUtcDay,
  fillDailySeries,
  moneyString,
  rate,
  roundMoney,
  type AnalyticsRange,
} from '@vorqen/types';
import type { PrismaClient } from '@/generated/prisma/client';
import { parseOrThrow } from '../common/validation';

const PAID_ORDER_STATUSES = [
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
] as const;

export type AnalyticsKpis = {
  paidOrders: number;
  grossRevenue: string;
  refundedTotal: string;
  netRevenue: string;
  averageOrderValue: string;
  buildsCreated: number;
  abandonedStarted: number;
  recovered: number;
  recoveryRate: number;
  emailsSent: number;
  emailsClicked: number;
  clickRate: number;
};

export type AnalyticsDayPoint = {
  day: string;
  value: string;
};

export type AnalyticsCountPoint = {
  key: string;
  count: number;
};

export type TopBuildProduct = {
  productId: string;
  productName: string;
  slot: string;
  count: number;
};

export type AbandonedFunnel = {
  started: number;
  emailed: number;
  clicked: number;
  recovered: number;
  expired: number;
};

export type AdminAnalytics = {
  range: AnalyticsRange;
  from: string;
  to: string;
  kpis: AnalyticsKpis;
  revenueByDay: AnalyticsDayPoint[];
  ordersByStatus: AnalyticsCountPoint[];
  buildsByDay: AnalyticsDayPoint[];
  buildsByVisibility: AnalyticsCountPoint[];
  topBuildProducts: TopBuildProduct[];
  abandonedByStatus: AnalyticsCountPoint[];
  abandonedFunnel: AbandonedFunnel;
};

function decimalToNumber(value: { toString(): string } | null | undefined): number {
  if (value == null) return 0;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

export async function getAdminAnalytics(
  prisma: PrismaClient,
  rawInput: unknown,
  now = new Date(),
): Promise<AdminAnalytics> {
  const input = parseOrThrow(adminAnalyticsInputSchema, rawInput ?? {});
  const { from, to } = analyticsWindow(input.range, now);
  const inRange = { gte: from, lte: to };

  const [
    paidOrders,
    refunds,
    ordersByStatusRows,
    builds,
    topItemRows,
    abandonedByStatusRows,
    emailsSent,
    emailsClicked,
    recovered,
    expired,
    emailedCarts,
    clickedCarts,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        paidAt: inRange,
        status: { in: [...PAID_ORDER_STATUSES] },
      },
      select: { paidAt: true, grandTotal: true },
    }),
    prisma.refund.findMany({
      where: { status: 'SUCCEEDED', createdAt: inRange },
      select: { createdAt: true, amount: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: inRange },
      _count: { _all: true },
    }),
    prisma.pCBuild.findMany({
      where: { createdAt: inRange },
      select: { createdAt: true, visibility: true },
    }),
    prisma.pCBuildItem.groupBy({
      by: ['productId', 'slot'],
      where: { build: { createdAt: inRange } },
      _count: { _all: true },
    }),
    prisma.abandonedCart.groupBy({
      by: ['status'],
      where: { createdAt: inRange },
      _count: { _all: true },
    }),
    prisma.abandonedCartEmail.count({ where: { sentAt: inRange } }),
    prisma.abandonedCartEmail.count({
      where: { clickedAt: inRange },
    }),
    prisma.abandonedCart.count({ where: { recoveredAt: inRange } }),
    prisma.abandonedCart.count({
      where: { status: 'EXPIRED', updatedAt: inRange },
    }),
    prisma.abandonedCart.count({
      where: {
        createdAt: inRange,
        status: { in: ['EMAIL_SENT', 'CLICKED', 'RECOVERED'] },
      },
    }),
    prisma.abandonedCart.count({
      where: {
        createdAt: inRange,
        status: { in: ['CLICKED', 'RECOVERED'] },
      },
    }),
  ]);

  const gross = roundMoney(
    paidOrders.reduce((sum, row) => sum + decimalToNumber(row.grandTotal), 0),
  );
  const refunded = roundMoney(
    refunds.reduce((sum, row) => sum + decimalToNumber(row.amount), 0),
  );
  const net = roundMoney(Math.max(0, gross - refunded));
  const paidCount = paidOrders.length;
  const started = abandonedByStatusRows.reduce((sum, row) => sum + row._count._all, 0);

  const rankedItems = [...topItemRows]
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 8);
  const productIds = [...new Set(rankedItems.map((row) => row.productId))];
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      })
    : [];
  const productName = new Map(products.map((row) => [row.id, row.name]));

  const revenueByDay = fillDailySeries(
    from,
    to,
    bucketByUtcDay(
      paidOrders.map((row) => ({
        at: row.paidAt ?? from,
        amount: decimalToNumber(row.grandTotal),
      })),
    ),
  );
  const refundByDay = new Map(
    fillDailySeries(
      from,
      to,
      bucketByUtcDay(
        refunds.map((row) => ({
          at: row.createdAt,
          amount: decimalToNumber(row.amount),
        })),
      ),
    ).map((point) => [point.day, point.value]),
  );

  const buildsByVisibility = new Map<string, number>();
  for (const build of builds) {
    buildsByVisibility.set(
      build.visibility,
      (buildsByVisibility.get(build.visibility) ?? 0) + 1,
    );
  }

  return {
    range: input.range,
    from: from.toISOString(),
    to: to.toISOString(),
    kpis: {
      paidOrders: paidCount,
      grossRevenue: moneyString(gross),
      refundedTotal: moneyString(refunded),
      netRevenue: moneyString(net),
      averageOrderValue: moneyString(averageOrderValue(gross, paidCount)),
      buildsCreated: builds.length,
      abandonedStarted: started,
      recovered,
      recoveryRate: rate(recovered, started),
      emailsSent,
      emailsClicked,
      clickRate: rate(emailsClicked, emailsSent),
    },
    revenueByDay: revenueByDay.map((point) => ({
      day: point.day,
      value: moneyString(
        Math.max(0, roundMoney(point.value - (refundByDay.get(point.day) ?? 0))),
      ),
    })),
    ordersByStatus: ordersByStatusRows.map((row) => ({
      key: row.status,
      count: row._count._all,
    })),
    buildsByDay: fillDailySeries(
      from,
      to,
      bucketByUtcDay(builds.map((row) => ({ at: row.createdAt, amount: 1 }))),
    ).map((point) => ({
      day: point.day,
      value: String(point.value),
    })),
    buildsByVisibility: [...buildsByVisibility.entries()].map(([key, count]) => ({
      key,
      count,
    })),
    topBuildProducts: rankedItems.map((row) => ({
      productId: row.productId,
      productName: productName.get(row.productId) ?? 'Unknown product',
      slot: row.slot,
      count: row._count._all,
    })),
    abandonedByStatus: abandonedByStatusRows.map((row) => ({
      key: row.status,
      count: row._count._all,
    })),
    abandonedFunnel: abandonedFunnelFromCounts({
      started,
      emailed: emailedCarts,
      clicked: clickedCarts,
      recovered,
      expired,
    }),
  };
}
