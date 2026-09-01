import Link from 'next/link';
import {
  PRODUCT_SORTS,
  PRODUCT_TYPES,
  productListInputSchema,
  type ProductSort,
  type ProductType,
} from '@vorqen/types';
import { ProductCard } from '@/components/shared/ProductCard';
import { EmptyState, ErrorState } from '@/components/shared/SectionStates';
import {
  fetchCatalogList,
  fetchShopMeta,
} from '@/features/products/catalog-data';
import { publicPageMetadata } from '@/server/seo';

export const metadata = publicPageMetadata({
  title: 'Shop',
  description: 'Browse VORQEN gaming hardware — search, filter, and compare.',
  path: '/shop',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildQuery(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const query = first(raw.q)?.trim();
  const type = first(raw.type);
  const brandSlug = first(raw.brand);
  const categorySlug = first(raw.category);
  const featured = first(raw.featured) === 'true' ? true : undefined;
  const inStock = first(raw.inStock) === 'true' ? true : undefined;
  const sort = (first(raw.sort) as ProductSort | undefined) ?? 'FEATURED';
  const page = Number(first(raw.page) ?? '1') || 1;

  const parsed = productListInputSchema.safeParse({
    filter: {
      ...(query ? { query } : {}),
      ...(type && (PRODUCT_TYPES as readonly string[]).includes(type)
        ? { type: type as ProductType }
        : {}),
      ...(brandSlug ? { brandSlug } : {}),
      ...(categorySlug ? { categorySlug } : {}),
      ...(featured !== undefined ? { featured } : {}),
      ...(inStock !== undefined ? { inStock } : {}),
    },
    sort: (PRODUCT_SORTS as readonly string[]).includes(sort)
      ? sort
      : 'FEATURED',
    page,
    pageSize: 24,
  });

  let brands: Awaited<ReturnType<typeof fetchShopMeta>>['brands'] = [];
  let categories: Awaited<ReturnType<typeof fetchShopMeta>>['categories'] = [];
  let catalog: Awaited<ReturnType<typeof fetchCatalogList>> | null = null;
  let loadError: string | null = null;

  try {
    const [meta, list] = await Promise.all([
      fetchShopMeta(),
      parsed.success
        ? fetchCatalogList(parsed.data)
        : Promise.resolve(null),
    ]);
    brands = meta.brands;
    categories = meta.categories;
    catalog = list;
    if (!parsed.success) {
      loadError = parsed.error.issues[0]?.message ?? 'Invalid filters.';
    }
  } catch {
    loadError = 'Catalog is temporarily unavailable. Try again shortly.';
  }

  const baseParams = {
    q: query,
    type: type && (PRODUCT_TYPES as readonly string[]).includes(type) ? type : undefined,
    brand: brandSlug,
    category: categorySlug,
    featured: featured ? 'true' : undefined,
    inStock: inStock ? 'true' : undefined,
    sort: sort !== 'FEATURED' ? sort : undefined,
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <div className="mb-10">
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
          Catalog
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
          Shop hardware
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Prices and stock are loaded from the server. Compare up to four
          products from any card.
        </p>
      </div>

      <form
        method="get"
        className="mb-10 grid gap-3 border border-border bg-surface/40 p-4 md:grid-cols-6"
      >
        <label className="flex flex-col gap-1.5 text-xs text-muted md:col-span-2">
          Search
          <input
            name="q"
            defaultValue={query ?? ''}
            placeholder="Name or slug"
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Type
          <select
            name="type"
            defaultValue={type ?? ''}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">All</option>
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Brand
          <select
            name="brand"
            defaultValue={brandSlug ?? ''}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">All</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Category
          <select
            name="category"
            defaultValue={categorySlug ?? ''}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Sort
          <select
            name="sort"
            defaultValue={sort}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
          >
            {PRODUCT_SORTS.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-3 md:col-span-6">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={featured === true}
              className="accent-[var(--color-accent)]"
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="inStock"
              value="true"
              defaultChecked={inStock === true}
              className="accent-[var(--color-accent)]"
            />
            In stock
          </label>
          <button
            type="submit"
            className="ml-auto h-10 rounded-md bg-accent px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </form>

      {loadError ? (
        <ErrorState message={loadError} />
      ) : catalog && catalog.items.length === 0 ? (
        <EmptyState
          title="No products match"
          description="Try clearing filters or searching a different term."
          action={
            <Link href="/shop" className="text-sm text-accent">
              Reset filters
            </Link>
          }
        />
      ) : catalog ? (
        <>
          <p className="mb-6 font-mono text-xs text-muted">
            {catalog.pageInfo.totalCount} products · page {catalog.pageInfo.page}{' '}
            of {Math.max(1, catalog.pageInfo.totalPages)}
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-10 flex items-center justify-between gap-4">
            {catalog.pageInfo.hasPreviousPage ? (
              <Link
                href={`/shop${buildQuery({
                  ...baseParams,
                  page: String(catalog.pageInfo.page - 1),
                })}`}
                className="text-sm text-muted hover:text-accent"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {catalog.pageInfo.hasNextPage ? (
              <Link
                href={`/shop${buildQuery({
                  ...baseParams,
                  page: String(catalog.pageInfo.page + 1),
                })}`}
                className="text-sm text-muted hover:text-accent"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </>
      ) : null}
    </main>
  );
}
