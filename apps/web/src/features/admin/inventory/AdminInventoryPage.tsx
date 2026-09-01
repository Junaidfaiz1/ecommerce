'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ErrorState } from '@/components/shared/SectionStates';
import { Button } from '@/components/ui/button';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADJUST_INVENTORY, ADMIN_INVENTORY } from '../graphql';
import { AdminHeader, AdminPager, AdminTable, AdminEmptyState, Field, fieldClass } from '../ui';

type Row = {
  variantId: string;
  productName: string;
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  isLow: boolean;
};

type PageInfo = {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function AdminInventoryPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [delta, setDelta] = useState('0');
  const [reason, setReason] = useState('cycle count');
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{
          adminInventory: { items: Row[]; pageInfo: PageInfo };
        }>(ADMIN_INVENTORY, {
          input: {
            page,
            lowStockOnly: lowOnly,
            ...(query ? { query } : {}),
          },
        });
        if (cancelled) return;
        setItems(data.adminInventory.items);
        setPageInfo(data.adminInventory.pageInfo);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, query, lowOnly]);

  async function onAdjust(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    try {
      await graphqlRequest(ADJUST_INVENTORY, {
        input: {
          variantId: selected,
          quantityDelta: Number(delta),
          reason,
        },
      });
      setDelta('0');
      const data = await graphqlRequest<{
        adminInventory: { items: Row[]; pageInfo: PageInfo };
      }>(ADMIN_INVENTORY, {
        input: { page, lowStockOnly: lowOnly, ...(query ? { query } : {}) },
      });
      setItems(data.adminInventory.items);
      setPageInfo(data.adminInventory.pageInfo);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (error && items.length === 0) return <ErrorState message={error} />;

  return (
    <div>
      <AdminHeader
        title="Inventory"
        description="Adjustments write InventoryTransaction rows. On-hand cannot fall below reserved."
      />
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Search SKU / name">
          <input
            className={fieldClass}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by SKU or product name…"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => {
              setLowOnly(e.target.checked);
              setPage(1);
            }}
          />
          Low stock only
        </label>
      </div>
      {loading && items.length === 0 ? (
        <p className="text-sm text-muted">Loading inventory…</p>
      ) : items.length === 0 ? (
        <AdminEmptyState
          title={query || lowOnly ? 'No SKUs match these filters' : 'No inventory rows yet'}
          description={
            query || lowOnly
              ? 'Try a different SKU search, or turn off low-stock only.'
              : 'Inventory appears after a product variant is created with stock.'
          }
        />
      ) : (
      <AdminTable>
        <thead className="bg-surface text-[11px] text-muted uppercase">
          <tr>
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">On hand</th>
            <th className="px-3 py-2">Reserved</th>
            <th className="px-3 py-2">Avail</th>
            <th className="px-3 py-2">Threshold</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr
              key={row.variantId}
              className={`border-t border-border ${selected === row.variantId ? 'bg-elevated' : ''}`}
              onClick={() => setSelected(row.variantId)}
            >
              <td className="px-3 py-2">
                <span className="font-mono text-xs">{row.sku}</span>
                <p className="text-xs text-muted">{row.productName}</p>
              </td>
              <td className="px-3 py-2">{row.onHand}</td>
              <td className="px-3 py-2">{row.reserved}</td>
              <td className="px-3 py-2">{row.available}</td>
              <td className="px-3 py-2">
                {row.lowStockThreshold}
                {row.isLow ? ' · low' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
      )}
      {items.length > 0 ? (
      <form onSubmit={(e) => void onAdjust(e)} className="mt-4 flex max-w-xl flex-wrap items-end gap-3">
        <Field label="Delta">
          <input
            className={fieldClass}
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="+5 or -3"
          />
        </Field>
        <Field label="Reason">
          <input
            className={fieldClass}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Cycle count, received stock…"
          />
        </Field>
        <Button type="submit" disabled={!selected}>
          Adjust selected
        </Button>
      </form>
      ) : null}
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
