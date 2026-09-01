import Link from 'next/link';
import {
  organizationJsonLd,
  SITE_DESCRIPTION,
  SITE_NAME,
  websiteJsonLd,
} from '@vorqen/types';
import { ProductCard } from '@/components/shared/ProductCard';
import { JsonLd } from '@/components/shared/JsonLd';
import { SectionHeader } from '@/components/shared/SectionStates';
import {
  fetchFeaturedProducts,
  fetchProductsByType,
} from '@/features/products/catalog-data';
import { HeroPcViewer } from '@/features/three-d';
import { absoluteUrl, publicPageMetadata } from '@/server/seo';

export const metadata = publicPageMetadata({
  title: 'Build Beyond Limits',
  description: `VORQEN — ${SITE_DESCRIPTION}`,
  path: '/',
});

async function safeFeatured() {
  try {
    return await fetchFeaturedProducts(8);
  } catch {
    return null;
  }
}

async function safeGpus() {
  try {
    return await fetchProductsByType('GPU', 4);
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [featured, gpus] = await Promise.all([safeFeatured(), safeGpus()]);
  const origin = absoluteUrl('/');

  return (
    <main>
      <JsonLd
        data={[
          organizationJsonLd({
            name: SITE_NAME,
            url: origin,
            description: SITE_DESCRIPTION,
          }),
          websiteJsonLd({
            name: SITE_NAME,
            url: origin,
            description: SITE_DESCRIPTION,
            searchUrl: `${absoluteUrl('/shop')}?q=`,
          }),
        ]}
      />
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,_rgba(109,124,255,0.14),_transparent_50%),linear-gradient(180deg,_rgba(23,23,23,0.4),_transparent_60%)]"
        />
        <div className="relative mx-auto grid min-h-[78vh] max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8 md:py-20">
          <div>
            <p className="animate-fade-up mb-4 font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
              VORQEN
            </p>
            <h1 className="animate-fade-up font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
              BUILD BEYOND
              <br />
              LIMITS.
            </h1>
            <p className="animate-fade-up mt-5 max-w-md text-base text-muted md:text-lg">
              Configure high-performance machines with server-checked compatibility
              and laboratory-grade hardware.
            </p>
            <div className="animate-fade-up mt-9 flex flex-wrap gap-3">
              <Link
                href="/build"
                className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Build Your PC
              </Link>
              <Link
                href="/shop"
                className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:bg-elevated"
              >
                Explore Hardware
              </Link>
            </div>
          </div>
          <div className="animate-fade-up h-[320px] md:h-[420px]">
            <HeroPcViewer className="h-full w-full rounded-lg" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <SectionHeader
          eyebrow="Featured"
          title="Selected hardware"
          description="Curated components ready for your next build."
          action={
            <Link
              href="/shop?featured=true"
              className="text-sm text-muted transition-colors hover:text-accent"
            >
              View all →
            </Link>
          }
        />
        {featured && featured.items.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Featured catalog will appear when the database is seeded.
          </p>
        )}
      </section>

      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:flex-row md:items-center md:justify-between md:px-8 md:py-20">
          <div className="max-w-lg">
            <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
              PC Builder
            </p>
            <h2 className="font-display text-3xl tracking-tight md:text-4xl">
              Build your machine
            </h2>
            <p className="mt-3 text-muted">
              Step through components with live server pricing and compatibility —
              never trust a client-side green check.
            </p>
          </div>
          <Link
            href="/build"
            className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Open Builder
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <SectionHeader
          eyebrow="GPUs"
          title="Popular graphics"
          description="High-VRAM cards for competitive and cinematic frames."
          action={
            <Link
              href="/shop?type=GPU"
              className="text-sm text-muted transition-colors hover:text-accent"
            >
              Shop GPUs →
            </Link>
          }
        />
        {gpus && gpus.items.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {gpus.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">GPU listings load from the catalog.</p>
        )}
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <SectionHeader
            eyebrow="Compare"
            title="Side-by-side specs"
            description="Add up to four products from the shop, then open compare."
          />
          <Link
            href="/compare"
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm transition-colors hover:bg-elevated"
          >
            Open compare
          </Link>
        </div>
      </section>
    </main>
  );
}
