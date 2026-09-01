import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  adminAnalyticsInputSchema,
  analyticsWindow,
  averageOrderValue,
  bucketByUtcDay,
  fillDailySeries,
  moneyString,
  rate,
  roundMoney,
} from '@vorqen/types';

const NOW = new Date('2026-09-01T15:30:00.000Z');

describe('analyticsWindow', () => {
  it('uses an inclusive UTC window ending today', () => {
    const week = analyticsWindow('7d', NOW);
    assert.equal(week.days, 7);
    assert.equal(week.from.toISOString(), '2026-08-26T00:00:00.000Z');
    assert.equal(week.to.toISOString(), '2026-09-01T23:59:59.999Z');
  });

  it('spans 30 and 90 days', () => {
    assert.equal(analyticsWindow('30d', NOW).from.toISOString(), '2026-08-03T00:00:00.000Z');
    assert.equal(analyticsWindow('90d', NOW).from.toISOString(), '2026-06-04T00:00:00.000Z');
  });
});

describe('fillDailySeries', () => {
  it('fills missing days with zero', () => {
    const { from, to } = analyticsWindow('7d', NOW);
    const series = fillDailySeries(from, to, [
      { day: '2026-08-26', value: 10 },
      { day: '2026-09-01', value: 4 },
    ]);
    assert.equal(series.length, 7);
    assert.equal(series[0]?.value, 10);
    assert.equal(series[1]?.value, 0);
    assert.equal(series[6]?.value, 4);
  });
});

describe('bucketByUtcDay', () => {
  it('sums amounts on the UTC day', () => {
    const points = bucketByUtcDay([
      { at: new Date('2026-09-01T01:00:00.000Z'), amount: 10 },
      { at: new Date('2026-09-01T23:00:00.000Z'), amount: 2.5 },
      { at: new Date('2026-08-31T23:00:00.000Z'), amount: 1 },
    ]);
    const byDay = Object.fromEntries(points.map((p) => [p.day, p.value]));
    assert.equal(byDay['2026-09-01'], 12.5);
    assert.equal(byDay['2026-08-31'], 1);
  });
});

describe('money helpers', () => {
  it('computes AOV and rates without dividing by zero', () => {
    assert.equal(averageOrderValue(199.98, 2), 99.99);
    assert.equal(averageOrderValue(50, 0), 0);
    assert.equal(rate(3, 10), 0.3);
    assert.equal(rate(1, 0), 0);
    assert.equal(moneyString(10.1 + 0.2), '10.30');
    assert.equal(roundMoney(2.5), 2.5);
  });
});

describe('adminAnalyticsInputSchema', () => {
  it('defaults to 30d and rejects unknown ranges', () => {
    assert.equal(adminAnalyticsInputSchema.parse({}).range, '30d');
    assert.equal(adminAnalyticsInputSchema.safeParse({ range: '1d' }).success, false);
    assert.equal(
      adminAnalyticsInputSchema.safeParse({ range: '30d', extra: true }).success,
      false,
    );
  });
});
