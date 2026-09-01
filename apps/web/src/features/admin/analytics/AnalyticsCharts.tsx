'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { THEME } from '@/theme/palette';

const GRID = 'rgba(255,255,255,0.06)';
const TICK = THEME.cream;
const SERIES = [THEME.sage, THEME.clay, '#7C5CFF', '#F5C16C', '#4ADE80', '#60A5FA'];

const TOOLTIP_STYLE = {
  background: 'rgba(18, 22, 44, 0.96)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  fontSize: 12,
  color: THEME.cream,
  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
};

function shortDay(day: string): string {
  return day.slice(5);
}

function moneyLabel(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <p className="flex h-64 items-center justify-center text-center text-sm text-muted">
      {message}
    </p>
  );
}

export function RevenueChart({
  data,
}: {
  data: Array<{ day: string; value: string }>;
}) {
  const series = data.map((row) => ({
    day: shortDay(row.day),
    net: Number(row.value),
  }));

  if (series.length === 0 || series.every((row) => row.net === 0)) {
    return <ChartEmpty message="No paid revenue in this range yet." />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="vorqenRevenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={THEME.sage} stopOpacity={0.45} />
              <stop offset="100%" stopColor={THEME.sage} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: TICK, fontSize: 11, opacity: 0.7 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: TICK, fontSize: 11, opacity: 0.7 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [moneyLabel(Number(value)), 'Net']}
          />
          <Area
            type="monotone"
            dataKey="net"
            stroke={THEME.sage}
            strokeWidth={2.5}
            fill="url(#vorqenRevenueFill)"
            dot={false}
            activeDot={{ r: 4, fill: THEME.cream, stroke: THEME.sage }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CountChart({
  data,
  valueKey = 'count',
}: {
  data: Array<{ key: string; count?: number; value?: string }>;
  valueKey?: 'count' | 'value';
}) {
  const series = data.map((row, index) => ({
    key: row.key.replaceAll('_', ' '),
    count: valueKey === 'value' ? Number(row.value ?? 0) : (row.count ?? 0),
    fill: SERIES[index % SERIES.length],
  }));

  if (series.length === 0 || series.every((row) => row.count === 0)) {
    return <ChartEmpty message="No records in this range yet." />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="key"
            tick={{ fill: TICK, fontSize: 10, opacity: 0.7 }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: TICK, fontSize: 11, opacity: 0.7 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="count" radius={[8, 8, 4, 4]}>
            {series.map((row) => (
              <Cell key={row.key} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DayCountChart({
  data,
}: {
  data: Array<{ day: string; value: string }>;
}) {
  const series = data.map((row) => ({
    day: shortDay(row.day),
    count: Number(row.value),
  }));

  if (series.length === 0 || series.every((row) => row.count === 0)) {
    return <ChartEmpty message="No PC builds saved in this range yet." />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="vorqenBuildsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={THEME.clay} stopOpacity={0.4} />
              <stop offset="100%" stopColor={THEME.clay} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: TICK, fontSize: 11, opacity: 0.7 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: TICK, fontSize: 11, opacity: 0.7 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={THEME.clay}
            strokeWidth={2.5}
            fill="url(#vorqenBuildsFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
}: {
  data: Array<{ key: string; count: number }>;
}) {
  const series = data
    .filter((row) => row.count > 0)
    .map((row, index) => ({
      name: row.key.replaceAll('_', ' '),
      value: row.count,
      fill: SERIES[index % SERIES.length],
    }));
  const total = series.reduce((sum, row) => sum + row.value, 0);

  if (series.length === 0) {
    return <p className="py-12 text-center text-sm text-muted">No data in this range.</p>;
  }

  return (
    <div className="flex h-64 items-center gap-4">
      <div className="relative h-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={series}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={3}
              stroke="none"
            >
              {series.map((row) => (
                <Cell key={row.name} fill={row.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">Total</p>
          <p className="text-xl tabular-nums">{total}</p>
        </div>
      </div>
      <ul className="w-36 shrink-0 space-y-1.5 text-xs">
        {series.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: row.fill }}
              />
              <span className="truncate text-muted">{row.name}</span>
            </span>
            <span className="tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FunnelChart({
  steps,
}: {
  steps: Array<{ label: string; count: number }>;
}) {
  if (steps.every((step) => step.count === 0)) {
    return <ChartEmpty message="No abandoned-cart activity in this range yet." />;
  }
  const max = Math.max(...steps.map((s) => s.count), 1);
  return (
    <ul className="space-y-3">
      {steps.map((step, index) => {
        const width = Math.max(8, Math.round((step.count / max) * 100));
        return (
          <li key={step.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted">{step.label}</span>
              <span className="tabular-nums">{step.count}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${width}%`,
                  background: `linear-gradient(90deg, ${SERIES[index % SERIES.length]}, ${THEME.sage})`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function RankBarChart({
  data,
}: {
  data: Array<{ label: string; hint?: string; count: number }>;
}) {
  const max = Math.max(...data.map((row) => row.count), 1);
  if (data.length === 0) {
    return <p className="mt-4 text-sm text-muted">No saved builds in this window.</p>;
  }
  return (
    <ul className="space-y-3">
      {data.map((row) => (
        <li key={`${row.label}-${row.hint ?? ''}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {row.label}
              {row.hint ? (
                <span className="ml-2 font-mono text-[10px] text-muted uppercase">
                  {row.hint}
                </span>
              ) : null}
            </span>
            <span className="tabular-nums text-sage">{row.count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-sage"
              style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
