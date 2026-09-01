'use client';

import type { CompatibilityResult } from '@vorqen/types';
import { cn } from '@/lib/utils';

type Props = {
  compatibility: CompatibilityResult | null;
  pending?: boolean;
  className?: string;
};

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
      <div className={cn('text-sm text-muted', className)}>Checking…</div>
    );
  }

  const status = compatibility.compatible ? 'Compatible' : 'Issues found';

  return (
    <div className={cn('space-y-3 text-sm', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Compatibility
        </span>
        <span
          className={cn(
            'font-medium',
            compatibility.compatible ? 'text-emerald-400' : 'text-amber-400',
          )}
        >
          {status}
        </span>
      </div>

      {compatibility.estimatedWattage != null ? (
        <p className="font-mono text-xs text-muted">
          Est. draw {compatibility.estimatedWattage}W
          {compatibility.recommendedPsuWatts != null
            ? ` · Recommend ≥ ${compatibility.recommendedPsuWatts}W PSU`
            : null}
        </p>
      ) : null}

      {compatibility.errors.length > 0 ? (
        <ul className="space-y-1.5 border-l-2 border-red-500/50 pl-3 text-red-300">
          {compatibility.errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      ) : null}

      {compatibility.warnings.length > 0 ? (
        <ul className="space-y-1.5 border-l-2 border-amber-500/40 pl-3 text-amber-200/90">
          {compatibility.warnings.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      ) : null}

      {compatibility.recommendations.length > 0 ? (
        <ul className="space-y-1.5 border-l-2 border-border pl-3 text-muted">
          {compatibility.recommendations.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
