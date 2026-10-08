'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Skeleton, SkeletonRegion } from '@/components/shared/Skeleton';
import { useSearchParams } from 'next/navigation';

function CancelBody() {
  const searchParams = useSearchParams();
  const order = searchParams.get('order');

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
        Checkout
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Payment cancelled
      </h1>
      <p className="mt-3 text-sm text-muted">
        No payment was taken. Your cart is still available. You will not be
        charged twice if you try again.
      </p>
      {order ? (
        <p className="mt-4 font-mono text-[11px] text-muted">
          Reference {order}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/checkout"
          className="glass-btn inline-flex h-10 items-center rounded-full px-4 text-sm font-medium"
        >
          Return to checkout
        </Link>
        <Link
          href="/cart"
          className="glass-panel inline-flex h-10 items-center rounded-full px-4 text-sm"
        >
          View cart
        </Link>
      </div>
    </main>
  );
}

export function CheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-xl px-4 py-16">
          <SkeletonRegion label="Loading" className="flex flex-col gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-72 max-w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-5 h-10 w-40 rounded-full" />
          </SkeletonRegion>
        </main>
      }
    >
      <CancelBody />
    </Suspense>
  );
}
