import { z } from 'zod';

export const ANALYTICS_RANGES = ['7d', '30d', '90d'] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export const RANGE_DAYS: Record<AnalyticsRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const adminAnalyticsInputSchema = z
  .object({
    range: z.enum(ANALYTICS_RANGES).default('30d'),
  })
  .strict();

export type AdminAnalyticsInput = z.infer<typeof adminAnalyticsInputSchema>;

const MS_PER_DAY = 86_400_000;

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function endOfUtcDay(date: Date): Date {
  return new Date(startOfUtcDay(date).getTime() + MS_PER_DAY - 1);
}

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Inclusive UTC window ending today, length based on range. Inject `now` in tests. */
export function analyticsWindow(
  range: AnalyticsRange,
  now = new Date(),
): { from: Date; to: Date; days: number } {
  const days = RANGE_DAYS[range];
  const to = endOfUtcDay(now);
  const from = startOfUtcDay(new Date(to.getTime() - (days - 1) * MS_PER_DAY));
  return { from, to, days };
}

export type DailyPoint = { day: string; value: number };

export function fillDailySeries(
  from: Date,
  to: Date,
  points: DailyPoint[],
): DailyPoint[] {
  const byDay = new Map(points.map((point) => [point.day, point.value]));
  const series: DailyPoint[] = [];
  const start = startOfUtcDay(from).getTime();
  const end = startOfUtcDay(to).getTime();
  for (let ts = start; ts <= end; ts += MS_PER_DAY) {
    const day = utcDayKey(new Date(ts));
    series.push({ day, value: byDay.get(day) ?? 0 });
  }
  return series;
}

export function bucketByUtcDay(
  items: Array<{ at: Date; amount: number }>,
): DailyPoint[] {
  const byDay = new Map<string, number>();
  for (const item of items) {
    const day = utcDayKey(item.at);
    byDay.set(day, (byDay.get(day) ?? 0) + item.amount);
  }
  return [...byDay.entries()].map(([day, value]) => ({ day, value }));
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function moneyString(value: number): string {
  return roundMoney(value).toFixed(2);
}

export function averageOrderValue(
  grossRevenue: number,
  paidOrderCount: number,
): number {
  if (paidOrderCount <= 0) return 0;
  return roundMoney(grossRevenue / paidOrderCount);
}

export function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return roundMoney(numerator / denominator);
}

export const ABANDONED_FUNNEL_KEYS = [
  'started',
  'emailed',
  'clicked',
  'recovered',
  'expired',
] as const;
export type AbandonedFunnelKey = (typeof ABANDONED_FUNNEL_KEYS)[number];

export function abandonedFunnelFromCounts(input: {
  started: number;
  emailed: number;
  clicked: number;
  recovered: number;
  expired: number;
}): Record<AbandonedFunnelKey, number> {
  return {
    started: Math.max(0, input.started),
    emailed: Math.max(0, input.emailed),
    clicked: Math.max(0, input.clicked),
    recovered: Math.max(0, input.recovered),
    expired: Math.max(0, input.expired),
  };
}
