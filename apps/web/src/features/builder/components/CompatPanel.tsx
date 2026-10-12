'use client';

import type { CompatibilityResult } from '@vorqen/types';
import { cn } from '@/lib/utils';
import { Skeleton, SkeletonRegion } from '@/components/shared/Skeleton';

type Props = {
  compatibility: CompatibilityResult | null;
  pending?: boolean;
  className?: string;
};

function PowerMeter({
  draw,
  recommended,
}: {
  draw: number;
  recommended: number | null;
}) {
  const scale = Math.max(draw, recommended ?? 0) * 1.15 || 1;
  const over = recommended != null && draw > recommended;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between font-mono text-xs text-muted">
        <span>POWER</span>
        <span>
          ~{draw} W
          {recommended != null ? ` · rec. ≥ ${recommended} W PSU` : null}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className={cn('h-1.5', over ? 'bg-accent' : 'bg-foreground')}
          style={{ width: `${Math.min(100, (draw / scale) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function CompatPanel({ compatibility, pending, className }: Props) {
  if (!compatibility && !pending) {
    return (
      <div className={cn('text-sm text-muted', className)}>
        Select parts to see live compatibility from the server.
      </div>
    );
  }

  if (!compatibility) {
    return (
      <SkeletonRegion
        label="Checking compatibility"
        className={cn('flex flex-col gap-3', className)}
      >
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
      </SkeletonRegion>
    );
  }

  const ok = compatibility.compatible;

  return (
    <div className={cn('flex flex-col gap-4 text-sm', className)}>
      {compatibility.estimatedWattage != null ? (
        <PowerMeter
          draw={compatibility.estimatedWattage}
          recommended={compatibility.recommendedPsuWatts ?? null}
        />
      ) : null}

      <div className="flex items-center justify-between gap-2 font-mono text-xs">
        <span className="text-muted">COMPATIBILITY</span>
        <span className={ok ? 'text-pass' : 'text-accent'} aria-live="polite">
          {ok ? 'ALL CLEAR' : 'ACTION NEEDED'}
        </span>
      </div>

      {compatibility.errors.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {compatibility.errors.map((msg) => (
            <li key={msg} className="flex gap-2.5 text-foreground/90">
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mt-0.5 shrink-0 text-accent"
              >
                <path d="M12 4l9 16H3z" />
                <path d="M12 10v4M12 17v.5" />
              </svg>
              <span>
                <span className="sr-only">Error: </span>
                {msg}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {compatibility.warnings.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {compatibility.warnings.map((msg) => (
            <li key={msg} className="flex gap-2.5 text-muted">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>
                <span className="sr-only">Warning: </span>
                {msg}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {ok && compatibility.errors.length === 0 ? (
        <p className="flex items-center gap-2.5 text-foreground/85">
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-pass"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          Every server check passed.
        </p>
      ) : null}

      {compatibility.recommendations.length > 0 ? (
        <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-muted">
          {compatibility.recommendations.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
