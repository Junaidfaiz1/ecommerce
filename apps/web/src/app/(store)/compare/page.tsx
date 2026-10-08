import Link from 'next/link';
import { COMPARE_MAX_ITEMS, compareProductIdsSchema } from '@vorqen/types';
import { prisma } from '@/server/common/prisma';
import { getProductsByIds } from '@/server/catalog/catalog.service';
import { Price } from '@/components/shared/Price';
import { StockBadge } from '@/components/shared/StockBadge';
import { EmptyState, ErrorState } from '@/components/shared/SectionStates';
import {
  keySpecLabel,
  productHref,
} from '@/features/products/product-path';
import { CompareClientSync } from '@/features/comparison/CompareClientSync';
import { CompareProductMedia } from '@/features/comparison/CompareProductMedia';
import { publicPageMetadata } from '@/server/seo';

export const metadata = publicPageMetadata({
  title: 'Compare',
  description: 'Side-by-side hardware comparison — up to four products.',
  path: '/compare',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseIds(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw.join(',') : (raw ?? '');
  if (!value.trim()) return [];
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawIds = parseIds(params.ids);
  const parsed = compareProductIdsSchema.safeParse(rawIds);

  let products: Awaited<ReturnType<typeof getProductsByIds>> = [];
  let error: string | null = null;

  if (rawIds.length === 0) {
    // empty tray — client may hydrate from store
  } else if (!parsed.success) {
    error = parsed.error.issues[0]?.message ?? 'Invalid compare selection.';
  } else {
    try {
      products = await getProductsByIds(prisma, parsed.data);
    } catch {
      error = 'Could not load products for comparison.';
    }
  }

  const specKeys = new Set<string>();
  for (const p of products) {
    const label = keySpecLabel(p);
    if (label) specKeys.add('Highlight');
    if (p.cpu) {
      ['Socket', 'Cores', 'TDP'].forEach((k) => specKeys.add(k));
    }
    if (p.gpu) {
      ['VRAM', 'Length', 'Chipset'].forEach((k) => specKeys.add(k));
    }
    if (p.ram) {
      ['Capacity', 'Speed', 'Memory type'].forEach((k) => specKeys.add(k));
    }
  }

  function cellValue(product: (typeof products)[number], key: string): string {
    switch (key) {
      case 'Highlight':
        return keySpecLabel(product) ?? '—';
      case 'Socket':
        return product.cpu?.socket ?? product.motherboard?.socket ?? '—';
      case 'Cores':
        return product.cpu
          ? `${product.cpu.cores}/${product.cpu.threads}`
          : '—';
      case 'TDP':
        return product.cpu
          ? `${product.cpu.tdpWatts} W`
          : product.gpu
            ? `${product.gpu.tdpWatts} W`
            : '—';
      case 'VRAM':
        return product.gpu ? `${product.gpu.vramGb} GB` : '—';
      case 'Length':
        return product.gpu ? `${product.gpu.lengthMm} mm` : '—';
      case 'Chipset':
        return product.gpu?.chipset ?? product.motherboard?.chipset ?? '—';
      case 'Capacity':
        return product.ram
          ? `${product.ram.capacityGb} GB`
          : product.storage
            ? `${product.storage.capacityGb} GB`
            : '—';
      case 'Speed':
        return product.ram ? `${product.ram.speedMhz} MHz` : '—';
      case 'Memory type':
        return product.ram?.memoryType ?? '—';
      default:
        return '—';
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <CompareClientSync ids={rawIds} />
      <div className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
          Compare · max {COMPARE_MAX_ITEMS}
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
          Hardware comparison
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Add products from shop cards, then open this page. Specs and prices come
          from the server.
        </p>
      </div>

      {error ? <ErrorState message={error} /> : null}

      {!error && products.length === 0 ? (
        <EmptyState
          title="Nothing to compare yet"
          description="Browse the shop and tap Compare on up to four products."
          action={
            <Link href="/shop" className="text-sm text-accent">
              Go to shop
            </Link>
          }
        />
      ) : null}

      {products.length > 0 ? (
        <div className="overflow-x-auto rounded-md glass-panel p-4">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/40">
                <th className="py-3 pr-4 font-mono text-[10px] tracking-wide text-muted uppercase">
                  Spec
                </th>
                {products.map((p) => (
                  <th key={p.id} className="min-w-[180px] px-3 py-3 align-bottom">
                    <CompareProductMedia
                      name={p.name}
                      imageUrl={
                        p.images.find((img) => img.isPrimary)?.url ??
                        p.images[0]?.url
                      }
                    />
                    <Link
                      href={productHref(p)}
                      className="font-display text-base tracking-tight hover:text-accent"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-1 font-mono text-[10px] text-muted uppercase">
                      {p.brand.name} · {p.type}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 pr-4 text-muted">Price</td>
                {products.map((p) => (
                  <td key={p.id} className="px-3 py-3">
                    {p.defaultVariant ? (
                      <Price
                        amount={p.defaultVariant.price}
                        currency={p.defaultVariant.currency}
                        compareAt={p.defaultVariant.compareAtPrice}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 pr-4 text-muted">Stock</td>
                {products.map((p) => (
                  <td key={p.id} className="px-3 py-3">
                    {p.defaultVariant ? (
                      <StockBadge
                        inStock={p.defaultVariant.inStock}
                        quantity={p.defaultVariant.availableQuantity}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                ))}
              </tr>
              {[...specKeys].map((key) => (
                <tr key={key} className="border-b border-border">
                  <td className="py-3 pr-4 text-muted">{key}</td>
                  {products.map((p) => (
                    <td key={p.id} className="px-3 py-3 font-mono text-xs">
                      {cellValue(p, key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
