'use client';

import { BUILDER_STEPS, type BuilderStep, type ComponentSlot } from '@vorqen/types';
import { cn } from '@/lib/utils';
import { isComponentSlot, slotLabel, useBuilderStore } from '../store';

type Props = {
  className?: string;
};

export function BuilderStepNav({ className }: Props) {
  const step = useBuilderStore((s) => s.step);
  const parts = useBuilderStore((s) => s.parts);
  const setStep = useBuilderStore((s) => s.setStep);

  const filled = new Set(parts.map((p) => p.slot));

  return (
    <nav
      aria-label="Builder steps"
      className={cn('flex flex-col gap-1 rounded-3xl glass-panel p-3', className)}
    >
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        Components
      </p>
      <ul className="flex flex-col gap-0.5">
        {BUILDER_STEPS.map((s) => {
          const active = s === step;
          const complete =
            s === 'REVIEW'
              ? parts.length > 0
              : isComponentSlot(s) && filled.has(s as ComponentSlot);
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => setStep(s as BuilderStep)}
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors',
                  active
                    ? 'glass-btn text-cream'
                    : 'glass-panel text-muted hover:bg-white/50 hover:text-foreground',
                )}
              >
                <span>{slotLabel(s)}</span>
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    complete ? 'bg-accent' : 'bg-border',
                  )}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
