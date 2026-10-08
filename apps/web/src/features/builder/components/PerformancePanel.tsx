'use client';

import { Skeleton, SkeletonRegion } from '@/components/shared/Skeleton';
import { usePerformanceEstimates } from '../hooks';

export function PerformancePanel() {
  const { result, error, ready, pending } = usePerformanceEstimates();

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="label-mono">
          Performance
        </span>
        <span className="text-[11px] text-muted">Estimated</span>
      </div>

      {!ready ? (
        <p className="text-muted">Choose a CPU and GPU for FPS estimates.</p>
      ) : null}

      {pending ? (
        <SkeletonRegion label="Loading FPS estimates" className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} aria-hidden className="flex items-end justify-between gap-3 border-b border-border pb-2">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-6 w-14" />
            </div>
          ))}
        </SkeletonRegion>
      ) : null}

      {error ? <p className="text-accent">{error}</p> : null}

      {result?.missing ? (
        <p className="text-muted">{result.message}</p>
      ) : null}

      {result && !result.missing ? (
        <ul className="space-y-2">
          {result.estimates.map((row) => (
            <li
              key={`${row.gameId}-${row.resolution}-${row.quality}`}
              className="flex items-end justify-between gap-3 border-b border-border pb-2"
            >
              <div>
                <p className="font-medium">{row.gameName}</p>
                <p className="font-mono text-[11px] text-muted">
                  {row.resolution} · {row.quality}
                </p>
              </div>
              <p className="font-display text-xl font-bold tabular-nums [font-stretch:112%]">
                ~{Math.round(row.avgFps)}
                <span className="ml-1 text-xs font-sans text-muted">FPS</span>
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-[11px] leading-relaxed text-muted">
        Figures are benchmark-based estimates for reference only — not a guarantee
        of in-game performance.
      </p>
    </div>
  );
}
