import { Suspense } from 'react';
import Link from 'next/link';
import {
  COMPONENT_SLOTS,
  IMAGE_SIZES,
  organizationJsonLd,
  SITE_DESCRIPTION,
  SITE_NAME,
  websiteJsonLd,
} from '@vorqen/types';
import { ProductCard } from '@/components/shared/ProductCard';
import { productGridClass } from '@/components/shared/product-grid';
import { JsonLd } from '@/components/shared/JsonLd';
import { ProductGridSkeleton } from '@/components/shared/Skeleton';
import { SectionHeader, sectionLinkClass } from '@/components/shared/SectionStates';
import {
  fetchFeaturedProducts,
  fetchProductsByType,
} from '@/features/products/catalog-data';
import {
  COMPATIBILITY_CHECKS,
  ConfiguratorTeaser,
} from '@/features/storefront/ConfiguratorTeaser';
import { HeroHardwareMedia } from '@/features/storefront/HeroHardwareMedia';
import {
  PerformanceShowcase,
  PerformanceShowcaseSkeleton,
} from '@/features/storefront/PerformanceShowcase';
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
    return await fetchFeaturedProducts(4);
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

const PROOF = [
  {
    value: String(COMPATIBILITY_CHECKS.length),
    body: 'compatibility rules run server-side on every change — socket, memory, clearance, wattage, cooler, form factor.',
  },
  {
    value: String(COMPONENT_SLOTS.length),
    body: 'component slots, from processor to cooling, with live price and power totals.',
  },
  {
    value: '1',
    body: 'source of truth — totals and stock are computed on the server, and Stripe charges that figure.',
  },
] as const;

/* Data sections stream in behind skeletons so the hero paints immediately. */

async function FeaturedGrid() {
  const featured = await safeFeatured();
  if (!featured || featured.items.length === 0) {
    return (
      <p className="text-sm text-muted">
        Featured catalog will appear when the database is seeded.
      </p>
    );
  }
  return (
    <div className={productGridClass}>
      {featured.items.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 2}
          imageSizes={IMAGE_SIZES.productCardDense}
        />
      ))}
    </div>
  );
}

async function GpuGrid() {
  const gpus = await safeGpus();
  if (!gpus || gpus.items.length === 0) {
    return <p className="text-sm text-muted">GPU listings load from the catalog.</p>;
  }
  return (
    <div className={productGridClass}>
      {gpus.items.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          imageSizes={IMAGE_SIZES.productCardDense}
        />
      ))}
    </div>
  );
}

async function PerformanceSection() {
  return <PerformanceShowcase showcase={await safeShowcase()} />;
}

export default function HomePage() {
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

      {/* Hero */}
      <section className="mx-auto max-w-[1360px] px-4 pt-10 md:px-10 md:pt-16">
        <div className="flex flex-wrap justify-between gap-3 font-mono text-xs tracking-[0.06em] text-muted uppercase">
          <span>VQ / Hardware laboratory</span>
          <span>Server-checked builds</span>
        </div>
        <div className="ticks mt-3.5" aria-hidden />
        <div className="grid items-end gap-12 pt-10 md:pt-14 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col gap-8">
            <h1 className="animate-fade-up font-display text-[clamp(52px,7.4vw,112px)] leading-[0.9] font-extrabold tracking-[-0.02em] uppercase [font-stretch:125%]">
              Build
              <br />
              beyond
              <br />
              limits<span className="text-accent">.</span>
            </h1>
            <p className="animate-fade-up max-w-[460px] text-lg leading-relaxed text-muted md:text-[19px]">
              Spec a gaming PC the way you&apos;d configure a performance car —
              every part checked for fit, power and clearance on our servers
              before it reaches your cart.
            </p>
            <div className="animate-fade-up flex flex-wrap gap-3">
              <Link
                href="/build"
                className="inline-flex h-14 items-center gap-3 rounded-full bg-accent px-7 text-base font-semibold text-ink transition-[filter] hover:brightness-110"
              >
                Start a build <span aria-hidden>→</span>
              </Link>
              <Link
                href="/shop"
                className="inline-flex h-14 items-center rounded-full border border-border-strong px-7 text-base transition-colors hover:border-foreground"
              >
                Shop hardware
              </Link>
            </div>
          </div>
          <HeroHardwareMedia />
        </div>
      </section>

      {/* Proof strip */}
      <section className="mx-auto max-w-[1360px] px-4 pt-20 md:px-10 md:pt-24">
        <ul className="grid border-y border-border md:grid-cols-3">
          {PROOF.map((item, i) => (
            <li
              key={item.body}
              className={
                i === 0
                  ? 'flex flex-col gap-1.5 py-7 md:pr-6'
                  : 'flex flex-col gap-1.5 border-t border-border py-7 md:border-t-0 md:border-l md:px-6'
              }
            >
              <span className="font-display text-[40px] leading-none font-bold [font-stretch:112%]">
                {item.value}
              </span>
              <span className="text-[15px] text-muted">{item.body}</span>
            </li>
          ))}
        </ul>
      </section>

      <ConfiguratorTeaser />

      {/* Featured hardware */}
      <section className="mx-auto max-w-[1360px] px-4 pt-24 md:px-10 md:pt-32">
        <SectionHeader
          index="02"
          eyebrow="Featured hardware"
          title="On the bench this week"
          action={
            <Link href="/shop?featured=true" className={sectionLinkClass}>
              View all hardware
            </Link>
          }
        />
        <Suspense fallback={<ProductGridSkeleton count={4} label="Loading featured hardware" />}>
          <FeaturedGrid />
        </Suspense>
      </section>

      <Suspense fallback={<PerformanceShowcaseSkeleton />}>
        <PerformanceSection />
      </Suspense>

      {/* GPUs */}
      <section className="mx-auto max-w-[1360px] px-4 pt-24 md:px-10 md:pt-32">
        <SectionHeader
          index="04"
          eyebrow="Graphics"
          title="Popular GPUs"
          description="High-VRAM cards for competitive and cinematic frames."
          action={
            <Link href="/shop?type=GPU" className={sectionLinkClass}>
              Shop GPUs
            </Link>
          }
        />
        <Suspense fallback={<ProductGridSkeleton count={4} label="Loading GPUs" />}>
          <GpuGrid />
        </Suspense>
      </section>

      {/* Compare CTA */}
      <section className="mx-auto max-w-[1360px] px-4 pt-24 md:px-10 md:pt-32">
        <div className="flex flex-wrap items-end justify-between gap-8 border-t border-border pt-12">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="eyebrow">05 / Compare</p>
            <h2 className="font-display text-[32px] leading-[1.05] font-bold [font-stretch:118%] md:text-[40px]">
              Put up to four parts side by side.
            </h2>
            <p className="text-[15px] text-muted">
              Add products from any card, then read the spec sheets in one
              table.
            </p>
          </div>
          <Link
            href="/compare"
            className="inline-flex h-14 items-center rounded-full bg-foreground px-7 text-base font-semibold text-ink transition-colors hover:bg-white"
          >
            Open compare
          </Link>
        </div>
      </section>
    </main>
  );
}
