'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ORDER_STATUSES, type OrderStatus } from '@vorqen/types';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/shared/SectionStates';
import { Price } from '@/components/shared/Price';
import { graphqlRequest, GraphQLClientError } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { MY_ORDERS_QUERY, type OrderConnection } from './graphql';
import { formatOrderStatus } from './status';

export function OrdersListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [data, setData] = useState<OrderConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await graphqlRequest<{ myOrders: OrderConnection }>(
          MY_ORDERS_QUERY,
          {
            input: {
              page,
              pageSize: 10,
              ...(status ? { status } : {}),
            },
          },
        );
        if (!cancelled) setData(result.myOrders);
      } catch (err) {
        if (cancelled) return;
        if (
          err instanceof GraphQLClientError &&
          err.code === 'UNAUTHENTICATED'
        ) {
          router.replace('/login?next=/account/orders');
          return;
        }
        setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, status, router]);

  if (loading && !data) {
    return <p className="text-sm text-muted">Loading orders…</p>;
  }

  if (error && !data) {
    return <ErrorState message={error} />;
  }

  const items = data?.items ?? [];
  const pageInfo = data?.pageInfo;

  return (
    <div>
      <h1 className="font-display text-3xl tracking-tight">Orders</h1>
      <p className="mt-2 text-sm text-muted">
        Status and totals come from the server — payment confirmation is never
        inferred from the browser.
      </p>

      <label className="mt-6 flex max-w-xs flex-col gap-1.5 text-sm">
        <span className="text-muted">Filter by status</span>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | '');
            setPage(1);
          }}
          className="rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
        >
          <option value="">All</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {formatOrderStatus(value)}
            </option>
          ))}
        </select>
      </label>

      {items.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No orders yet"
          description="When you complete checkout, orders appear here with live status from the server."
          action={
            <Link href="/shop" className="text-sm text-accent">
              Browse hardware
            </Link>
          }
        />
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((order) => (
            <li
              key={order.id}
              className="border border-border bg-surface/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="font-display text-lg tracking-tight hover:text-accent"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="mt-1 font-mono text-[10px] text-muted uppercase">
                    {formatOrderStatus(order.status)} ·{' '}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {order.items
                      .map((item) => `${item.quantity}× ${item.productName}`)
                      .join(' · ')}
                  </p>
                </div>
                <Price amount={order.grandTotal} currency={order.currency} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {pageInfo && pageInfo.totalPages > 1 ? (
        <div className="mt-8 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!pageInfo.hasPreviousPage || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <p className="font-mono text-[11px] text-muted uppercase">
            Page {pageInfo.page} of {pageInfo.totalPages}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!pageInfo.hasNextPage || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
