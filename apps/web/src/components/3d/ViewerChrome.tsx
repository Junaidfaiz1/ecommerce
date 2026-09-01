'use client';

import { Maximize2, Minimize2, Layers } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ViewerChromeProps = {
  children: ReactNode;
  className?: string;
  /** Demo label for procedural assets. */
  demoLabel?: string | null;
  explode: boolean;
  onExplodeChange: (next: boolean) => void;
  showExplode?: boolean;
};

/**
 * Overlay controls: explode, fullscreen.
 */
export function ViewerChrome({
  children,
  className,
  demoLabel,
  explode,
  onExplodeChange,
  showExplode = true,
}: ViewerChromeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative overflow-hidden border border-border bg-[#101218]',
        className,
      )}
    >
      {children}
      {demoLabel ? (
        <p className="pointer-events-none absolute top-3 left-3 font-mono text-[10px] tracking-widest text-sage uppercase">
          {demoLabel}
        </p>
      ) : null}
      <div className="absolute right-3 bottom-3 flex flex-wrap justify-end gap-1.5">
        {showExplode ? (
          <button
            type="button"
            onClick={() => onExplodeChange(!explode)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-mono text-[10px] tracking-wider uppercase transition-colors',
              explode
                ? 'border-sage bg-sage/20 text-cream'
                : 'border-sage/50 bg-cream/90 text-ink hover:bg-cream',
            )}
            aria-pressed={explode}
          >
            <Layers className="size-3.5" aria-hidden />
            Explode
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-sage/50 bg-cream/90 px-2.5 font-mono text-[10px] tracking-wider text-ink uppercase transition-colors hover:bg-cream"
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {fullscreen ? (
            <Minimize2 className="size-3.5" aria-hidden />
          ) : (
            <Maximize2 className="size-3.5" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
