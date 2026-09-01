'use client';

import { useEffect, useState } from 'react';
import { ErrorState } from '@/components/shared/SectionStates';
import { Button } from '@/components/ui/button';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADMIN_CUSTOMERS, SET_CUSTOMER_ACTIVE } from '../graphql';
import { AdminHeader, AdminPager, AdminTable, AdminEmptyState, Field, fieldClass } from '../ui';

type Row = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  orderCount: number;
};

type PageInfo = {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Row[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(nextPage = page) {
    const data = await graphqlRequest<{
      adminCustomers: { items: Row[]; pageInfo: PageInfo };
    }>(ADMIN_CUSTOMERS, {
      input: { page: nextPage, ...(query ? { query } : {}) },
    });
    setItems(data.adminCustomers.items);
    setPageInfo(data.adminCustomers.pageInfo);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{
          adminCustomers: { items: Row[]; pageInfo: PageInfo };
        }>(ADMIN_CUSTOMERS, {
          input: { page, ...(query ? { query } : {}) },
        });
        if (cancelled) return;
        setItems(data.adminCustomers.items);
        setPageInfo(data.adminCustomers.pageInfo);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, query]);

  async function toggle(userId: string, isActive: boolean) {
    setError(null);
    try {
      await graphqlRequest(SET_CUSTOMER_ACTIVE, {
        input: { userId, isActive },
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (error && items.length === 0) return <ErrorState message={error} />;

  return (
    <div>
      <AdminHeader title="Customers" description="Deactivate accounts without changing roles from the client." />
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      <Field label="Search">
        <input
          className={`${fieldClass} mb-4 max-w-sm`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by email or name…"
        />
      </Field>
      {loading && items.length === 0 ? (
        <p className="text-sm text-muted">Loading customers…</p>
      ) : items.length === 0 ? (
        <AdminEmptyState
          title={query ? 'No customers match this search' : 'No customers yet'}
          description={
            query
              ? 'Try a different email or name.'
              : 'Customer accounts appear here after someone registers.'
          }
        />
      ) : (
      <AdminTable>
        <thead className="bg-surface text-[11px] text-muted uppercase">
          <tr>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Orders</th>
            <th className="px-3 py-2">Active</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="px-3 py-2 text-sm">{row.email}</td>
              <td className="px-3 py-2 font-mono text-xs">{row.role}</td>
              <td className="px-3 py-2">{row.orderCount}</td>
              <td className="px-3 py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void toggle(row.id, !row.isActive)}
                >
                  {row.isActive ? 'Disable' : 'Enable'}
                </Button>
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
