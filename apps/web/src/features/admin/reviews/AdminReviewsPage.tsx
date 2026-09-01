'use client';

import { useEffect, useState } from 'react';
import { REVIEW_STATUSES } from '@vorqen/types';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/shared/SectionStates';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADMIN_REVIEWS, MODERATE_REVIEW } from '../graphql';
import { AdminHeader, AdminPager, AdminTable, Field, fieldClass } from '../ui';

type Row = {
  id: string;
  productName: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  authorName: string;
  createdAt: string;
};

type PageInfo = {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('PENDING');
  const [items, setItems] = useState<Row[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(nextPage = page, nextStatus = status) {
    const data = await graphqlRequest<{
      adminReviews: { items: Row[]; pageInfo: PageInfo };
    }>(ADMIN_REVIEWS, {
      input: {
        page: nextPage,
        ...(nextStatus ? { status: nextStatus } : {}),
      },
    });
    setItems(data.adminReviews.items);
    setPageInfo(data.adminReviews.pageInfo);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{
          adminReviews: { items: Row[]; pageInfo: PageInfo };
        }>(ADMIN_REVIEWS, {
          input: { page, ...(status ? { status } : {}) },
        });
        if (cancelled) return;
        setItems(data.adminReviews.items);
        setPageInfo(data.adminReviews.pageInfo);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, status]);

  async function moderate(id: string, next: 'APPROVED' | 'REJECTED') {
    setError(null);
    try {
      await graphqlRequest(MODERATE_REVIEW, { input: { id, status: next } });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (error && items.length === 0) return <ErrorState message={error} />;

  return (
    <div>
      <AdminHeader title="Reviews" description="Public PDPs only show APPROVED reviews." />
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      <Field label="Status">
        <select
          className={`${fieldClass} mb-4 max-w-xs`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          {REVIEW_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <AdminTable>
        <thead className="bg-surface text-[11px] text-muted uppercase">
          <tr>
            <th className="px-3 py-2">Review</th>
            <th className="px-3 py-2">Rating</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="px-3 py-2">
                <p className="text-sm">{row.title ?? row.productName}</p>
                <p className="text-xs text-muted">
                  {row.authorName} · {row.productName}
                </p>
                {row.body ? <p className="mt-1 text-xs text-muted">{row.body}</p> : null}
              </td>
              <td className="px-3 py-2">{row.rating}</td>
              <td className="px-3 py-2 text-xs">{row.status}</td>
              <td className="px-3 py-2">
                {row.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void moderate(row.id, 'APPROVED')}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void moderate(row.id, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
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
