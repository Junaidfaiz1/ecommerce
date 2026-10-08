import Link from 'next/link';
import {
  PRODUCT_SORTS,
  PRODUCT_TYPES,
  productListInputSchema,
  type ProductSort,
  type ProductType,
} from '@vorqen/types';
import { ProductCard, productGridClass } from '@/components/shared/ProductCard';
import { EmptyState, ErrorState } from '@/components/shared/SectionStates';
import {
  fetchCatalogList,
  fetchShopMeta,
} from '@/features/products/catalog-data';
import { cn } from '@/lib/utils';
import { publicPageMetadata } from '@/server/seo';

export const metadata = publicPageMetadata({
  title: 'Shop',
  description: 'Browse VORQEN gaming hardware — search, filter, and compare.',
  path: '/shop',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Pill row — the component types a builder actually shops for. */
const TYPE_PILLS: Array<{ value: ProductType | null; label: string }> = [
  { value: null, label: 'All' },
  { value: 'CPU', label: 'Processors' },
  { value: 'GPU', label: 'Graphics cards' },
  { value: 'MOTHERBOARD', label: 'Motherboards' },
  { value: 'RAM', label: 'Memory' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'PSU', label: 'Power supplies' },
  { value: 'CASE', label: 'Cases' },
  { value: 'COOLER', label: 'Cooling' },
];

const SORT_LABELS: Record<ProductSort, string> = {
  FEATURED: 'Featured',
  PRICE_ASC: 'Price — low to high',
  PRICE_DESC: 'Price — high to low',
  NEWEST: 'Newest',
  NAME_ASC: 'Name A–Z',
  NAME_DESC: 'Name Z–A',
};

const fieldClass =
  'glass-input h-11 w-full rounded-full px-4 text-[15px] outline-none';

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

  const activeType =
    type && (PRODUCT_TYPES as readonly string[]).includes(type)
      ? (type as ProductType)
      : undefined;

  const baseParams = {
    q: query,
    type: activeType,
    brand: brandSlug,
    category: categorySlug,
    featured: featured ? 'true' : undefined,
    inStock: inStock ? 'true' : undefined,
    sort: sort !== 'FEATURED' ? sort : undefined,
  };

  const activeTypeLabel =
    TYPE_PILLS.find((p) => p.value === (activeType ?? null))?.label ?? 'All';

  return (
    <main className="mx-auto max-w-[1360px] px-4 pt-10 md:px-10 md:pt-14">
      <p className="label-mono">
        Shop / {activeType ? activeTypeLabel : 'All hardware'}
      </p>
      <h1 className="mt-4 font-display text-[clamp(48px,6vw,72px)] leading-[0.95] font-extrabold tracking-[-0.01em] uppercase [font-stretch:122%]">
        Hardware
      </h1>

      <nav
        aria-label="Product types"
        className="mt-8 flex flex-wrap gap-2 border-b border-border pb-6"
      >
        {TYPE_PILLS.map((pill) => {
          const active = (activeType ?? null) === pill.value;
          return (
            <Link
              key={pill.label}
              href={`/shop${buildQuery({ ...baseParams, type: pill.value ?? undefined })}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex h-10 items-center rounded-full border px-4 text-sm transition-colors',
                active
                  ? 'border-foreground bg-foreground text-ink'
                  : 'border-border text-foreground/85 hover:border-border-strong',
              )}
            >
              {pill.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-start gap-10 pt-8">
        <form
          method="get"
          aria-label="Filter products"
          className="flex w-full flex-col gap-7 lg:max-w-[280px] lg:flex-[1_1_240px]"
        >
          {activeType ? <input type="hidden" name="type" value={activeType} /> : null}
          <label className="flex flex-col gap-2.5">
            <span className="label-mono">Search</span>
            <input
              name="q"
              defaultValue={query ?? ''}
              placeholder="Name or model"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-2.5">
            <span className="label-mono">Brand</span>
            <select
              name="brand"
              defaultValue={brandSlug ?? ''}
              className={cn(fieldClass, 'bg-background')}
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2.5">
            <span className="label-mono">Category</span>
            <select
              name="category"
              defaultValue={categorySlug ?? ''}
              className={cn(fieldClass, 'bg-background')}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2.5">
            <span className="label-mono">Sort</span>
            <select
              name="sort"
              defaultValue={sort}
              className={cn(fieldClass, 'bg-background')}
            >
              {PRODUCT_SORTS.map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="flex flex-col gap-3">
            <legend className="label-mono mb-3">Availability</legend>
            <label className="flex items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                name="inStock"
                value="true"
                defaultChecked={inStock === true}
                className="h-[18px] w-[18px] accent-[var(--color-foreground)]"
              />
              In stock only
            </label>
            <label className="flex items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                name="featured"
                value="true"
                defaultChecked={featured === true}
                className="h-[18px] w-[18px] accent-[var(--color-foreground)]"
              />
              Featured
            </label>
          </fieldset>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-semibold text-ink transition-colors hover:bg-white"
            >
              Apply filters
            </button>
            <Link href="/shop" className="text-sm text-muted hover:text-foreground">
              Reset
            </Link>
          </div>
          <div className="flex flex-col gap-3 rounded-md border border-border p-5">
            <p className="eyebrow">Building a PC?</p>
            <p className="text-[15px] text-foreground/85">
              The builder only shows parts that pass the server&apos;s
              compatibility checks.
            </p>
            <Link
              href="/build"
              className="self-start border-b border-border-strong text-sm hover:border-foreground"
            >
              Open builder
            </Link>
          </div>
        </form>

        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-5">
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
              <p className="label-mono">
                {catalog.pageInfo.totalCount} results · page{' '}
                {catalog.pageInfo.page} of{' '}
                {Math.max(1, catalog.pageInfo.totalPages)}
              </p>
              <div className={productGridClass}>
                {catalog.items.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 3}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                {catalog.pageInfo.hasPreviousPage ? (
                  <Link
                    href={`/shop${buildQuery({
                      ...baseParams,
                      page: String(catalog.pageInfo.page - 1),
                    })}`}
                    className="inline-flex h-11 items-center rounded-full border border-border-strong px-5 text-sm hover:border-foreground"
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
                    className="inline-flex h-11 items-center rounded-full border border-border-strong px-5 text-sm hover:border-foreground"
                  >
                    Next →
                  </Link>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
