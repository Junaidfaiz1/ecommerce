'use client';

import { useEffect, useState } from 'react';
import { DashboardSkeleton } from '@/components/shared/Skeleton';
import Link from 'next/link';
import { ANALYTICS_RANGES, type AnalyticsRange } from '@vorqen/types';
import { ErrorState } from '@/components/shared/SectionStates';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADMIN_DASHBOARD } from '../graphql';
import { AdminHeader } from '../ui';
import {
  CountChart,
  DayCountChart,
  DonutChart,
  FunnelChart,
  RankBarChart,
  RevenueChart,
} from '../analytics/AnalyticsCharts';
import { cn } from '@/lib/utils';

type Overview = {
  pendingPaymentOrders: number;
  openFulfillmentOrders: number;
  pendingReviews: number;
  lowStockVariants: number;
  activeCustomers: number;
};

type Analytics = {
  range: AnalyticsRange;
  from: string;
  to: string;
  kpis: {
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
  revenueByDay: Array<{ day: string; value: string }>;
  ordersByStatus: Array<{ key: string; count: number }>;
  buildsByDay: Array<{ day: string; value: string }>;
  buildsByVisibility: Array<{ key: string; count: number }>;
  topBuildProducts: Array<{
    productId: string;
    productName: string;
    slot: string;
    count: number;
  }>;
  abandonedByStatus: Array<{ key: string; count: number }>;
  abandonedFunnel: {
    started: number;
    emailed: number;
    clicked: number;
    recovered: number;
    expired: number;
  };
};

const OPS_CARDS: Array<{ key: keyof Overview; label: string; href: string }> = [
  { key: 'pendingPaymentOrders', label: 'Pending payment', href: '/admin/orders' },
  { key: 'openFulfillmentOrders', label: 'Open fulfillment', href: '/admin/orders' },
  { key: 'pendingReviews', label: 'Reviews to moderate', href: '/admin/reviews' },
  { key: 'lowStockVariants', label: 'Low stock SKUs', href: '/admin/inventory' },
  { key: 'activeCustomers', label: 'Active customers', href: '/admin/customers' },
];

function money(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return `$${value}`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function AdminOverviewPage() {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await graphqlRequest<{
          adminOverview: Overview;
          adminAnalytics: Analytics;
        }>(ADMIN_DASHBOARD, { input: { range } });
        if (cancelled) return;
        setOverview(result.adminOverview);
        setAnalytics(result.adminAnalytics);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  if (error) return <ErrorState message={error} />;
  if (!overview || !analytics) {
    return <DashboardSkeleton />;
  }

  const kpis = analytics.kpis;
  const funnel = analytics.abandonedFunnel;

  return (
    <div>
      <AdminHeader
        title="Overview"
        description="Live ops counts plus server-computed revenue, builder, and recovery metrics."
        action={
          <div className="flex gap-1 rounded-lg border border-white/12 bg-elevated/50 p-0.5">
            {ANALYTICS_RANGES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  'px-2 py-1 font-mono text-[11px] uppercase',
                  range === option
                    ? 'rounded-md bg-sage/20 text-sage'
                    : 'rounded-md text-muted hover:text-foreground',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Net revenue" value={money(kpis.netRevenue)} hint={`${kpis.paidOrders} paid`} />
        <Kpi label="Average order" value={money(kpis.averageOrderValue)} hint={`Gross ${money(kpis.grossRevenue)}`} />
        <Kpi label="Builds saved" value={String(kpis.buildsCreated)} hint="Created in range" />
        <Kpi
          label="Cart recovery"
          value={pct(kpis.recoveryRate)}
          hint={`${kpis.recovered} / ${kpis.abandonedStarted}`}
        />
      </ul>

      <section className="mt-8">
        <h2 className="mb-3 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          Live ops
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {OPS_CARDS.map((card) => (
            <li key={card.key} className="rounded-2xl border border-white/10 bg-elevated/50 p-4">
              <p className="font-mono text-[11px] text-muted uppercase">{card.label}</p>
              <p className="mt-2 text-2xl tabular-nums">{overview[card.key]}</p>
              <Link href={card.href} className="mt-3 inline-block text-xs text-accent">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Net revenue" subtitle="Paid orders minus refunds in range">
          <RevenueChart data={analytics.revenueByDay} />
        </ChartPanel>
        <ChartPanel title="Orders created" subtitle="By status">
          <DonutChart data={analytics.ordersByStatus} />
        </ChartPanel>
        <ChartPanel title="Builder saves" subtitle="PC builds created per day">
          <DayCountChart data={analytics.buildsByDay} />
          {analytics.buildsByVisibility.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
              {analytics.buildsByVisibility.map((row) => (
                <li key={row.key}>
                  <span className="font-mono uppercase">{row.key}</span>{' '}
                  <span className="tabular-nums text-foreground">{row.count}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </ChartPanel>
        <ChartPanel title="Abandoned carts" subtitle="Status in range">
          <CountChart data={analytics.abandonedByStatus} />
        </ChartPanel>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-elevated/50 p-5">
          <h2 className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
            Recovery funnel
          </h2>
          <p className="mt-1 text-xs text-muted">
            Click rate {pct(kpis.clickRate)} · {kpis.emailsSent} emails sent
          </p>
          <div className="mt-5">
            <FunnelChart
              steps={[
                { label: 'Started', count: funnel.started },
                { label: 'Emailed', count: funnel.emailed },
                { label: 'Clicked', count: funnel.clicked },
                { label: 'Recovered', count: funnel.recovered },
                { label: 'Expired', count: funnel.expired },
              ]}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-elevated/50 p-5">
          <h2 className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
            Top builder parts
          </h2>
          <div className="mt-5">
            <RankBarChart
              data={analytics.topBuildProducts.map((row) => ({
                label: row.productName,
                hint: row.slot,
                count: row.count,
              }))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <li className="rounded-2xl border border-white/10 bg-elevated/50 p-4">
      <p className="font-mono text-[11px] text-muted uppercase">{label}</p>
      <p className="mt-2 text-2xl tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </li>
  );
}

function ChartPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-elevated/50 p-5">
      <h2 className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
        {title}
      </h2>
      {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}
