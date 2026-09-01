'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IMAGE_SIZES, PRODUCT_STATUSES, PRODUCT_TYPES } from '@vorqen/types';
import { ErrorState } from '@/components/shared/SectionStates';
import { CatalogImage } from '@/components/shared/CatalogImage';
import { Price } from '@/components/shared/Price';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADMIN_PRODUCTS } from '../graphql';
import { AdminHeader, AdminPager, AdminTable, Field, StatusBadge, fieldClass } from '../ui';

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
  images: Array<{ id: string; url: string; alt: string | null; isPrimary: boolean }>;
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
        setError(null);
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
        description="Drafts and archived SKUs stay here. The storefront only lists ACTIVE products with their saved photos."
        action={
          <Link
            href="/admin/catalog/new"
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-cream"
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
          <thead className="bg-elevated/80 text-[11px] tracking-wide text-muted uppercase">
            <tr>
              <th className="px-3 py-2.5 font-medium">Product</th>
              <th className="px-3 py-2.5 font-medium">Type</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const image =
                p.images.find((img) => img.isPrimary) ?? p.images[0];
              return (
                <tr key={p.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/catalog/${p.id}`}
                      className="flex items-center gap-3 hover:text-sage"
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                        <CatalogImage
                          src={image?.url ?? ''}
                          alt={image?.alt ?? p.name}
                          sizes={IMAGE_SIZES.adminThumb}
                        />
                      </span>
                      <span>
                        <span className="block font-medium">{p.name}</span>
                        <span className="font-mono text-[10px] text-muted">
                          {p.brand.name} · {p.slug}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{p.type}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2.5">
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
              );
            })}
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
