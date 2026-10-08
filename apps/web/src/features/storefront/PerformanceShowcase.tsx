import Link from 'next/link';
import type { HomepagePerformanceShowcase } from '@/server/performance';
import { productHref } from '@/features/products/product-path';
import { sectionLinkClass } from '@/components/shared/SectionStates';
import { cn } from '@/lib/utils';

type Props = {
  showcase: HomepagePerformanceShowcase | null;
};

/** Bar fills step down in lightness so resolutions differ without hue. */
const BAR_FILLS = ['bg-accent', 'bg-foreground', 'bg-muted'] as const;

export function PerformanceShowcase({ showcase }: Props) {
  const buildHref = showcase?.buildSlug
    ? `/build?slug=${encodeURIComponent(showcase.buildSlug)}`
    : '/build';
  const maxFps = showcase
    ? Math.max(60, ...showcase.frames.map((f) => f.avgFps))
    : 0;
  // Round the axis up to a clean 40-FPS step so the bars keep headroom.
  const axisMax = Math.ceil((maxFps * 1.1) / 40) * 40;

  return (
    <section className="mx-auto max-w-[1360px] px-4 pt-24 md:px-10 md:pt-32">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-5">
          <p className="eyebrow">03 / Performance</p>
          <h2 className="font-display text-[32px] leading-none font-bold tracking-[-0.01em] [font-stretch:118%] md:text-5xl">
            Know the frame rate before you check out.
          </h2>
          <p className="max-w-md text-[15px] text-muted md:text-base">
            Server-side FPS samples for a CPU + GPU pairing. Labelled as
            estimates — measured on reference hardware, not promised.
          </p>
          {showcase ? (
            <dl className="mt-2 grid max-w-md grid-cols-2 gap-px border border-border bg-border">
              <div className="bg-background px-4 py-3">
                <dt className="label-mono">CPU</dt>
                <dd className="mt-1">
                  <Link
                    href={productHref({ type: 'CPU', slug: showcase.cpuSlug })}
                    className="text-sm text-foreground hover:text-accent"
                  >
                    {showcase.cpuName}
                  </Link>
                </dd>
              </div>
              <div className="bg-background px-4 py-3">
                <dt className="label-mono">GPU</dt>
                <dd className="mt-1">
                  <Link
                    href={productHref({ type: 'GPU', slug: showcase.gpuSlug })}
                    className="text-sm text-foreground hover:text-accent"
                  >
                    {showcase.gpuName}
                  </Link>
                </dd>
              </div>
            </dl>
          ) : null}
          <Link href={buildHref} className={cn(sectionLinkClass, 'mt-2')}>
            {showcase ? 'Load this pairing in the builder' : 'Open the builder'}
          </Link>
        </div>

        <div className="flex flex-col gap-6 rounded-md border border-border p-6 md:p-7">
          {showcase && showcase.frames.length > 0 ? (
            <>
              <div className="flex flex-wrap justify-between gap-2 font-mono text-xs text-muted uppercase">
                <span>{showcase.gameName}</span>
                <span>Avg FPS · est.</span>
              </div>
              <ul className="flex flex-col gap-5">
                {showcase.frames.map((frame, i) => (
                  <li
                    key={`${frame.resolution}-${frame.quality}`}
                    className="grid grid-cols-[72px_minmax(0,1fr)_64px] items-center gap-4"
                  >
                    <span className="font-mono text-[13px] leading-tight text-muted">
                      {frame.resolution}
                      <span className="block text-[11px] text-subtle uppercase">
                        {frame.quality}
                      </span>
                    </span>
                    <span className="block h-7 overflow-hidden rounded-[2px] bg-surface">
                      <span
                        className={cn(
                          'block h-7',
                          BAR_FILLS[Math.min(i, BAR_FILLS.length - 1)],
                        )}
                        style={{
                          width: `${Math.min(100, (frame.avgFps / axisMax) * 100)}%`,
                        }}
                      />
                    </span>
                    <span className="text-right font-display text-[22px] font-bold tabular-nums [font-stretch:112%]">
                      {Math.round(frame.avgFps)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="ticks" aria-hidden />
              <div className="flex justify-between font-mono text-[11px] text-subtle">
                <span>0</span>
                <span>{axisMax / 2}</span>
                <span>{axisMax} FPS</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">
              FPS estimates appear when benchmark samples are seeded for a CPU
              and GPU.
            </p>
          )}
          <p className="text-[13px] text-subtle">
            Benchmark-based estimates for reference only — not a guarantee of
            in-game performance.
          </p>
        </div>
      </div>
    </section>
  );
}
