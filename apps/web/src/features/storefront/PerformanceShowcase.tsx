import Link from 'next/link';
import type { HomepagePerformanceShowcase } from '@/server/performance';
import { SectionHeader } from '@/components/shared/SectionStates';
import { productHref } from '@/features/products/product-path';

type Props = {
  showcase: HomepagePerformanceShowcase | null;
};

export function PerformanceShowcase({ showcase }: Props) {
  const buildHref = showcase?.buildSlug
    ? `/build?slug=${encodeURIComponent(showcase.buildSlug)}`
    : '/build';

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
      <SectionHeader
        eyebrow="Performance"
        title="Estimated frames"
        description="Benchmark samples for a CPU + GPU pair. Labeled estimates — not a guarantee."
        action={
          <Link
            href={buildHref}
            className="text-sm text-muted transition-colors hover:text-sage"
          >
            See this build →
          </Link>
        }
      />
      <div className="rounded-[2rem] glass-panel p-5 sm:p-8 md:p-10">
        {showcase ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end lg:gap-12">
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] text-sage uppercase">
                {showcase.gameName} · estimated
              </p>
              <h3 className="mt-3 font-display text-2xl tracking-tight md:text-3xl">
                Flagship pairing
              </h3>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <span className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
                    CPU
                  </span>
                  <Link
                    href={productHref({ type: 'CPU', slug: showcase.cpuSlug })}
                    className="mt-1 block font-medium text-cream transition-colors hover:text-sage"
                  >
                    {showcase.cpuName}
                  </Link>
                </li>
                <li>
                  <span className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
                    GPU
                  </span>
                  <Link
                    href={productHref({ type: 'GPU', slug: showcase.gpuSlug })}
                    className="mt-1 block font-medium text-cream transition-colors hover:text-sage"
                  >
                    {showcase.gpuName}
                  </Link>
                </li>
              </ul>
              <Link
                href={buildHref}
                className="glass-btn mt-7 inline-flex h-11 w-full items-center justify-center rounded-full px-6 text-sm font-medium sm:w-auto"
              >
                Load in builder
              </Link>
            </div>
            <ul
              className={
                showcase.frames.length >= 3
                  ? 'grid grid-cols-1 gap-3 sm:grid-cols-3'
                  : showcase.frames.length === 2
                    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
                    : 'grid grid-cols-1 gap-3'
              }
            >
              {showcase.frames.map((frame) => (
                <li
                  key={`${frame.resolution}-${frame.quality}`}
                  className="rounded-2xl border border-white/10 bg-ink/40 px-5 py-5"
                >
                  <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                    {frame.resolution}
                    <span className="text-white/40"> · </span>
                    {frame.quality}
                  </p>
                  <p className="mt-3 font-display text-4xl tabular-nums tracking-tight md:text-5xl">
                    ~{Math.round(frame.avgFps)}
                    <span className="ml-1.5 align-middle font-sans text-sm text-muted">
                      FPS
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <p className="max-w-lg text-sm text-muted md:text-base">
              FPS estimates appear when benchmark samples are seeded for a CPU and
              GPU. Open the builder to preview a machine with live server checks.
            </p>
            <Link
              href="/build"
              className="glass-btn mt-6 inline-flex h-11 w-full items-center justify-center rounded-full px-6 text-sm font-medium sm:w-auto"
            >
              Open builder
            </Link>
          </div>
        )}
        <p className="mt-8 max-w-2xl text-[11px] leading-relaxed text-muted">
          Figures are benchmark-based estimates for reference only — not a
          guarantee of in-game performance.
        </p>
      </div>
    </section>
  );
}
