import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { productGridClass } from '@/components/shared/product-grid';

/**
 * Shared loading skeletons. Every block is decorative (`aria-hidden`); wrap a
 * group in `SkeletonRegion` so assistive tech hears one "Loading …" status.
 */

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('skeleton block rounded-[4px]', className)} />;
}

type RegionProps = {
  /** Announced to screen readers, e.g. "Loading products". */
  label: string;
  className?: string;
  children: ReactNode;
};

export function SkeletonRegion({ label, className, children }: RegionProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

/** Paragraph-like stack of lines; the last line is shorter. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </span>
  );
}

/** Eyebrow + display title (+ optional description) block. */
export function SectionHeaderSkeleton({
  description = false,
  className,
}: {
  description?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn('mb-10 flex flex-col gap-4', className)}>
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-10 w-full max-w-md md:h-12" />
      {description ? <Skeleton className="h-4 w-full max-w-sm" /> : null}
    </div>
  );
}

/* ── Storefront ───────────────────────────────────────────── */

export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4 bg-background p-5">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex justify-between gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-5 w-4/5" />
      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  label = 'Loading products',
}: {
  count?: number;
  label?: string;
}) {
  return (
    <SkeletonRegion label={label}>
      <div className={productGridClass}>
        {Array.from({ length: count }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** Rows with a thumbnail, two text lines and a trailing value (cart, wishlist, picker). */
export function MediaListSkeleton({
  rows = 3,
  label = 'Loading',
  thumb = 'h-16 w-20',
  className,
}: {
  rows?: number;
  label?: string;
  thumb?: string;
  className?: string;
}) {
  return (
    <SkeletonRegion
      label={label}
      className={cn('divide-y divide-border rounded-md border border-border', className)}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className={cn('shrink-0', thumb)} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/** Plain stacked rows (orders, builds, addresses). */
export function ListSkeleton({
  rows = 4,
  label = 'Loading',
  className,
}: {
  rows?: number;
  label?: string;
  className?: string;
}) {
  return (
    <SkeletonRegion
      label={label}
      className={cn('divide-y divide-border border-y border-border', className)}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden className="flex items-center justify-between gap-6 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2 max-w-xs" />
            <Skeleton className="h-3 w-1/3 max-w-[12rem]" />
          </div>
          <Skeleton className="h-5 w-20 shrink-0" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/** Labelled fields + submit button. */
export function FormSkeleton({
  fields = 4,
  label = 'Loading form',
  className,
}: {
  fields?: number;
  label?: string;
  className?: string;
}) {
  return (
    <SkeletonRegion label={label} className={cn('flex flex-col gap-5', className)}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} aria-hidden className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="mt-1 h-11 w-36 rounded-full" />
    </SkeletonRegion>
  );
}

/** Order / checkout summary column: rows of label + value, then a total. */
export function SummarySkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn('flex flex-col gap-4 rounded-md border border-border bg-surface p-6', className)}>
      <Skeleton className="h-3 w-28" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex justify-between gap-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-border pt-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-7 w-24" />
      </div>
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}

/* ── Admin ────────────────────────────────────────────────── */

export function TableSkeleton({
  rows = 8,
  cols = 4,
  thumb = false,
  label = 'Loading table',
  className,
}: {
  rows?: number;
  cols?: number;
  /** First column shows an image thumbnail (catalog, inventory). */
  thumb?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <SkeletonRegion
      label={label}
      className={cn('overflow-hidden rounded-md border border-border', className)}
    >
      <div aria-hidden className="flex gap-6 bg-elevated/60 px-3 py-3">
        {Array.from({ length: cols }, (_, c) => (
          <Skeleton key={c} className={cn('h-2.5', c === 0 ? 'w-24 flex-[2]' : 'w-14 flex-1')} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          aria-hidden
          className="flex items-center gap-6 border-t border-border px-3 py-3"
        >
          {Array.from({ length: cols }, (_, c) =>
            c === 0 ? (
              <div key={c} className="flex flex-[2] items-center gap-3">
                {thumb ? <Skeleton className="size-12 shrink-0" /> : null}
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ) : (
              <Skeleton key={c} className="h-3.5 flex-1" />
            ),
          )}
        </div>
      ))}
    </SkeletonRegion>
  );
}

/** KPI tile row + chart blocks for the admin overview. */
export function DashboardSkeleton() {
  return (
    <SkeletonRegion label="Loading ops snapshot" className="flex flex-col gap-6">
      <div aria-hidden className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-md border border-border p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>
      <div aria-hidden className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </SkeletonRegion>
  );
}

/**
 * Cart / checkout / wishlist page frame: eyebrow + title, line items and
 * (optionally) the summary column.
 */
export function CommercePageSkeleton({
  label,
  rows = 3,
  summary = true,
}: {
  label: string;
  rows?: number;
  summary?: boolean;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div aria-hidden className="mb-10 flex flex-col gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-48 md:h-12" />
      </div>
      <div className={cn('grid gap-12', summary && 'lg:grid-cols-[1fr_320px]')}>
        <MediaListSkeleton rows={rows} label={label} thumb="h-20 w-24" />
        {summary ? <SummarySkeleton /> : null}
      </div>
    </main>
  );
}

/** Order detail: number + status, line items, totals (account and admin). */
export function OrderDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div aria-hidden className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <MediaListSkeleton rows={2} label="Loading order" thumb="h-16 w-20" />
      <SummarySkeleton rows={3} className="max-w-md" />
    </div>
  );
}
