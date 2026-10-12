'use client';

import { BuilderPartPicker } from './BuilderPartPicker';
import { BuilderStepNav } from './BuilderStepNav';
import { BuilderSummary } from './BuilderSummary';
import { BuilderViewport } from './BuilderViewport';
import { SaveBuildPanel } from './SaveBuildPanel';
import { cn } from '@/lib/utils';
import {
  BUILDER_STEPS,
  isComponentSlot,
  slotLabel,
  useBuilderStore,
} from '../store';

export function BuilderShell() {
  const step = useBuilderStore((s) => s.step);
  const setStep = useBuilderStore((s) => s.setStep);
  const nextStep = useBuilderStore((s) => s.nextStep);
  const prevStep = useBuilderStore((s) => s.prevStep);
  const parts = useBuilderStore((s) => s.parts);
  const buildName = useBuilderStore((s) => s.buildName);
  const reset = useBuilderStore((s) => s.reset);

  const stepIndex = BUILDER_STEPS.indexOf(step);
  const nextLabel =
    step === 'REVIEW'
      ? 'Done'
      : `Next: ${slotLabel(BUILDER_STEPS[stepIndex + 1] ?? 'REVIEW')}`;

  return (
    <div className="flex flex-col">
      <div className="border-b border-border">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8">
          <h1 className="label-mono flex-1">
            Configurator / {buildName || 'Untitled build'} ·{' '}
            {parts.length} part{parts.length === 1 ? '' : 's'}
          </h1>
          <button
            type="button"
            onClick={() => reset()}
            className="h-11 text-sm text-muted hover:text-foreground"
          >
            New build
          </button>
        </div>
      </div>

      {/* Mobile: progress segments + step pills */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 lg:hidden">
        <div className="flex gap-1" aria-hidden>
          {BUILDER_STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                'h-[3px] flex-1',
                i < stepIndex
                  ? 'bg-foreground'
                  : i === stepIndex
                    ? 'bg-accent'
                    : 'bg-border',
              )}
            />
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {BUILDER_STEPS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              aria-current={s === step ? 'step' : undefined}
              className={cn(
                'h-9 shrink-0 rounded-full border px-3.5 text-xs',
                s === step
                  ? 'border-foreground bg-foreground text-ink'
                  : 'border-border text-muted',
              )}
            >
              {slotLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-stretch">
        <BuilderStepNav className="hidden lg:flex lg:w-[280px] lg:shrink-0" />

        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7 px-4 py-6 md:px-8 md:py-8">
          {step === 'REVIEW' ? (
            <section className="flex flex-col gap-7">
              <div>
                <p className="eyebrow mb-2">Final check</p>
                <h2 className="font-display text-[32px] leading-none font-extrabold [font-stretch:118%] md:text-[40px]">
                  {slotLabel('REVIEW')}
                </h2>
                <p className="mt-3 text-[15px] text-muted">
                  Confirm the list, check estimates, then save.
                </p>
              </div>
              <BuilderViewport />
              <SaveBuildPanel />
            </section>
          ) : isComponentSlot(step) ? (
            <>
              <BuilderViewport />
              <BuilderPartPicker slot={step} />
            </>
          ) : null}

          <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
            <button
              type="button"
              onClick={prevStep}
              disabled={stepIndex === 0}
              className="h-11 text-sm text-muted hover:text-foreground disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex h-12 items-center rounded-full bg-foreground px-6 text-sm font-semibold text-ink transition-colors hover:bg-white"
            >
              {nextLabel}
            </button>
          </div>
        </div>

        <BuilderSummary />
      </div>
    </div>
  );
}
