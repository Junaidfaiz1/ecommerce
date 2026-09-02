import Link from 'next/link';
import {
  IMAGE_SIZES,
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
import { HeroHardwareMedia } from '@/features/storefront/HeroHardwareMedia';
import { HowItWorks } from '@/features/storefront/HowItWorks';
import { PerformanceShowcase } from '@/features/storefront/PerformanceShowcase';
import { prisma } from '@/server/common/prisma';
import { getHomepagePerformanceShowcase } from '@/server/performance';
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

async function safeShowcase() {
  try {
    return await getHomepagePerformanceShowcase(prisma);
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [featured, gpus, showcase] = await Promise.all([
    safeFeatured(),
    safeGpus(),
    safeShowcase(),
  ]);
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
      <section className="px-3 pt-3 md:px-6">
        <div className="hero-stage relative mx-auto min-h-[78vh] max-w-6xl overflow-hidden rounded-[2rem] md:rounded-[2.5rem]">
          <div className="relative z-10 mx-auto grid items-center gap-10 px-5 py-14 md:grid-cols-2 md:px-12 md:py-20">
            <div>
              <p className="animate-fade-up mb-4 font-mono text-[11px] tracking-[0.22em] text-sage uppercase">
                VORQEN · hardware lab
              </p>
              <h1 className="animate-fade-up font-display text-5xl leading-[0.92] tracking-tight md:text-7xl">
                Shopping
                <br />
                to stay
                <br />
                <span className="bg-gradient-to-r from-sage via-cream to-accent bg-clip-text text-transparent">
                  limitless.
                </span>
              </h1>
              <p className="animate-fade-up mt-5 max-w-md text-base text-muted md:text-lg">
                Configure high-performance machines with server-checked
                compatibility and laboratory-grade hardware.
              </p>
              <div className="animate-fade-up mt-9 flex flex-wrap gap-3">
                <Link
                  href="/build"
                  className="glass-btn rounded-full px-6 py-3 text-sm font-medium"
                >
                  Build Your PC
                </Link>
                <Link
                  href="/shop"
                  className="glass-panel rounded-full px-6 py-3 text-sm font-medium"
                >
                  Explore Hardware
                </Link>
              </div>
            </div>
            <HeroHardwareMedia />
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <SectionHeader
          eyebrow="Featured"
          title="Selected hardware"
          description="Curated components ready for your next build."
          action={
            <Link
              href="/shop?featured=true"
              className="text-sm text-muted transition-colors hover:text-sage"
            >
              View all →
            </Link>
          }
        />
        {featured && featured.items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
                imageSizes={IMAGE_SIZES.productCardDense}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Featured catalog will appear when the database is seeded.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 md:px-8">
        <div className="flex flex-col gap-8 rounded-[2rem] glass-panel p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-lg">
            <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-sage uppercase">
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
            className="glass-btn inline-flex h-12 items-center justify-center rounded-full px-7 text-sm font-medium"
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
              className="text-sm text-muted transition-colors hover:text-sage"
            >
              Shop GPUs →
            </Link>
          }
        />
        {gpus && gpus.items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {gpus.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                imageSizes={IMAGE_SIZES.productCardDense}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">GPU listings load from the catalog.</p>
        )}
      </section>

      <PerformanceShowcase showcase={showcase} />

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-8 md:pb-24">
        <div className="rounded-[2rem] glass-panel p-6 md:p-10">
          <SectionHeader
            eyebrow="Compare"
            title="Side-by-side specs"
            description="Add up to four products from the shop, then open compare."
          />
          <Link
            href="/compare"
            className="glass-btn inline-flex h-11 items-center rounded-full px-6 text-sm font-medium"
          >
            Open compare
          </Link>
        </div>
      </section>
    </main>
  );
}
