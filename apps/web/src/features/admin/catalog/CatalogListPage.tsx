'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PRODUCT_STATUSES, PRODUCT_TYPES } from '@vorqen/types';
import { ErrorState } from '@/components/shared/SectionStates';
import { Price } from '@/components/shared/Price';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADMIN_PRODUCTS } from '../graphql';
import { AdminHeader, AdminPager, AdminTable, Field, fieldClass } from '../ui';

type Product = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  isFeatured: boolean;
  brand: { name: string };
  category: { name: string };
  defaultVariant: { price: string; currency: string; sku: string } | null;
};

type PageInfo = {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function CatalogListPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [items, setItems] = useState<Product[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{
          adminProducts: { items: Product[]; pageInfo: PageInfo };
        }>(ADMIN_PRODUCTS, {
          input: {
            page,
            pageSize: 20,
            ...(query ? { query } : {}),
            ...(status ? { status } : {}),
            ...(type ? { type } : {}),
          },
        });
        if (cancelled) return;
        setItems(data.adminProducts.items);
        setPageInfo(data.adminProducts.pageInfo);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, query, status, type]);

  if (error && items.length === 0) return <ErrorState message={error} />;

  return (
    <div>
      <AdminHeader
        title="Catalog"
        description="Drafts and archived SKUs are visible here. Storefront stays ACTIVE-only."
        action={
          <Link
            href="/admin/catalog/new"
            className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-background"
          >
            New product
          </Link>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Field label="Search">
          <input
            className={fieldClass}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Name or slug"
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
            <option value="">All</option>
            {PRODUCT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select
            className={fieldClass}
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {loading && items.length === 0 ? (
        <p className="text-sm text-muted">Loading catalog…</p>
      ) : (
        <AdminTable>
          <thead className="bg-surface text-[11px] tracking-wide text-muted uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <Link href={`/admin/catalog/${p.id}`} className="hover:text-accent">
                    {p.name}
                  </Link>
                  <p className="font-mono text-[10px] text-muted">
                    {p.brand.name} · {p.slug}
                  </p>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{p.type}</td>
                <td className="px-3 py-2 text-xs">{p.status}</td>
                <td className="px-3 py-2">
                  {p.defaultVariant ? (
                    <Price
                      amount={p.defaultVariant.price}
                      currency={p.defaultVariant.currency}
                    />
                  ) : (
                    '—'
                  )}
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
