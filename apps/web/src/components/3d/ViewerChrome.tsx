'use client';

import { Maximize2, Minimize2, RotateCcw, Layers } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ViewerChromeProps = {
  children: ReactNode;
  className?: string;
  /** Demo label for procedural assets. */
  demoLabel?: string | null;
  explode: boolean;
  onExplodeChange: (next: boolean) => void;
  autoRotate: boolean;
  onAutoRotateChange: (next: boolean) => void;
  showExplode?: boolean;
};

/**
 * Overlay controls: explode, auto-rotate, fullscreen.
 */
export function ViewerChrome({
  children,
  className,
  demoLabel,
  explode,
  onExplodeChange,
  autoRotate,
  onAutoRotateChange,
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
        'relative overflow-hidden border border-border bg-[#0a0b0d]',
        className,
      )}
    >
      {children}
      {demoLabel ? (
        <p className="pointer-events-none absolute top-3 left-3 font-mono text-[10px] tracking-widest text-muted uppercase">
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
                ? 'border-accent/50 bg-accent/15 text-accent'
                : 'border-border bg-surface/90 text-muted hover:text-foreground',
            )}
            aria-pressed={explode}
          >
            <Layers className="size-3.5" aria-hidden />
            Explode
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onAutoRotateChange(!autoRotate)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-mono text-[10px] tracking-wider uppercase transition-colors',
            autoRotate
              ? 'border-accent/50 bg-accent/15 text-accent'
              : 'border-border bg-surface/90 text-muted hover:text-foreground',
          )}
          aria-pressed={autoRotate}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Spin
        </button>
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface/90 px-2.5 font-mono text-[10px] tracking-wider text-muted uppercase transition-colors hover:text-foreground"
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
