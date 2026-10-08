'use client';

import { BUILDER_STEPS, type BuilderStep, type ComponentSlot } from '@vorqen/types';
import { cn } from '@/lib/utils';
import { isComponentSlot, slotLabel, useBuilderStore } from '../store';

type Props = {
  className?: string;
};

/** Left rail — one row per slot: index, label, chosen part, filled dot. */
export function BuilderStepNav({ className }: Props) {
  const step = useBuilderStore((s) => s.step);
  const parts = useBuilderStore((s) => s.parts);
  const setStep = useBuilderStore((s) => s.setStep);

  return (
    <nav
      aria-label="Builder steps"
      className={cn('flex-col border-r border-border py-6', className)}
    >
      <ol className="flex flex-col">
        {BUILDER_STEPS.map((s, i) => {
          const active = s === step;
          const slotParts = isComponentSlot(s)
            ? parts.filter((p) => p.slot === (s as ComponentSlot))
            : [];
          const complete = s === 'REVIEW' ? parts.length > 0 : slotParts.length > 0;
          const detail =
            s === 'REVIEW'
              ? `${parts.length} part${parts.length === 1 ? '' : 's'}`
              : slotParts.length > 1
                ? `${slotParts[0]?.productName} +${slotParts.length - 1}`
                : (slotParts[0]?.productName ?? 'Not selected');
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => setStep(s as BuilderStep)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'grid min-h-16 w-full grid-cols-[28px_minmax(0,1fr)_10px] items-center gap-2.5 border-l-2 px-6 py-3 text-left transition-colors',
                  active
                    ? 'border-accent bg-surface'
                    : 'border-transparent hover:bg-surface/60',
                )}
              >
                <span className="font-mono text-xs text-subtle">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="label-mono">{slotLabel(s)}</span>
                  <span
                    className={cn(
                      'truncate text-sm',
                      complete ? 'text-foreground' : 'text-subtle',
                    )}
                  >
                    {detail}
                  </span>
                </span>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    complete ? 'bg-pass' : 'bg-border-strong',
                  )}
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
