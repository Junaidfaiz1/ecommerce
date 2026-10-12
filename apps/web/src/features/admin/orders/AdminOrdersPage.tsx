'use client';

import { useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/shared/Skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import Link from 'next/link';
import { ORDER_STATUSES } from '@vorqen/types';
import { ErrorState } from '@/components/shared/SectionStates';
import { Price } from '@/components/shared/Price';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADMIN_ORDERS } from '../graphql';
import { AdminHeader, AdminPager, AdminTable, AdminEmptyState, Field, fieldClass } from '../ui';

type Row = {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: string;
  currency: string;
  customerEmail: string;
  createdAt: string;
  paymentStatus: string;
};

type PageInfo = {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<Row[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Debounce typing so each keystroke does not refetch (and flash a skeleton).
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const requestKey = JSON.stringify([page, debouncedQuery, status]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  /** True until the response for the current filters arrives. */
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{
          adminOrders: { items: Row[]; pageInfo: PageInfo };
        }>(ADMIN_ORDERS, {
          input: {
            page,
            ...(debouncedQuery ? { query: debouncedQuery } : {}),
            ...(status ? { status } : {}),
          },
        });
        if (cancelled) return;
        setItems(data.adminOrders.items);
        setPageInfo(data.adminOrders.pageInfo);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoadedKey(requestKey);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery, status, requestKey]);

  if (error && items.length === 0) return <ErrorState message={error} />;

  return (
    <div>
      <AdminHeader title="Orders" description="Fulfillment only. Paid status comes from Stripe webhooks." />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Field label="Search">
          <input
            className={fieldClass}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order number or email…"
          />
        </Field>
        <Field label="Status">
          <select
            className={fieldClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {loading ? (
        <TableSkeleton cols={5} label="Loading orders" />
      ) : items.length === 0 ? (
        <AdminEmptyState
          title={query || status ? 'No orders match these filters' : 'No orders yet'}
          description={
            query || status
              ? 'Try a different order number, email, or status.'
              : 'Orders appear here after a customer starts checkout.'
          }
        />
      ) : (
      <AdminTable>
        <thead className="bg-surface text-[11px] text-muted uppercase">
          <tr>
            <th className="px-3 py-2">Order</th>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="px-3 py-2">
                <Link href={`/admin/orders/${row.id}`} className="font-mono hover:text-accent">
                  {row.orderNumber}
                </Link>
              </td>
              <td className="px-3 py-2 text-xs">{row.customerEmail}</td>
              <td className="px-3 py-2 text-xs">{row.status}</td>
              <td className="px-3 py-2">
                <Price amount={row.grandTotal} currency={row.currency} />
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
      )}
      {pageInfo ? (
        <AdminPager
          page={pageInfo.page}
          totalPages={pageInfo.totalPages}
          hasPrev={pageInfo.hasPreviousPage}
          hasNext={pageInfo.hasNextPage}
          onPrev={() => setPage((n) => Math.max(1, n - 1))}
          onNext={() => setPage((n) => n + 1)}
        />
      ) : null}
    </div>
  );
}
