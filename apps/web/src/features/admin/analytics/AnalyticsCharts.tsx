'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { THEME } from '@/theme/palette';

const GRID = THEME.sage;
const TICK = THEME.clay;
const ACCENT = THEME.clay;
const TOOLTIP_STYLE = {
  background: THEME.cream,
  border: `1px solid ${THEME.sage}`,
  borderRadius: 0,
  fontSize: 12,
  color: THEME.ink,
};

function shortDay(day: string): string {
  return day.slice(5);
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

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="day" tick={{ fill: TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: TICK, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Net']}
          />
          <Line type="monotone" dataKey="net" stroke={ACCENT} strokeWidth={2} dot={false} />
        </LineChart>
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
  const series = data.map((row) => ({
    key: row.key,
    count: valueKey === 'value' ? Number(row.value ?? 0) : (row.count ?? 0),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="key" tick={{ fill: TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            allowDecimals={false}
            tick={{ fill: TICK, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="count" fill={ACCENT} radius={0} />
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
  return (
    <CountChart
      data={data.map((row) => ({ key: shortDay(row.day), value: row.value }))}
      valueKey="value"
    />
  );
}
