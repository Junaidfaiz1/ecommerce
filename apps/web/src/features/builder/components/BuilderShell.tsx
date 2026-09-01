'use client';

import { BuilderPartPicker } from './BuilderPartPicker';
import { BuilderStepNav } from './BuilderStepNav';
import { BuilderSummary } from './BuilderSummary';
import { BuilderViewport } from './BuilderViewport';
import { SaveBuildPanel } from './SaveBuildPanel';
import {
  BUILDER_STEPS,
  isComponentSlot,
  slotLabel,
  useBuilderStore,
} from '../store';

export function BuilderShell() {
  const step = useBuilderStore((s) => s.step);
  const nextStep = useBuilderStore((s) => s.nextStep);
  const prevStep = useBuilderStore((s) => s.prevStep);
  const parts = useBuilderStore((s) => s.parts);
  const reset = useBuilderStore((s) => s.reset);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 md:px-8">
      <header className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            PC Builder
          </p>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">
            Configure your machine
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Live prices and compatibility run on the server. Rotate the chassis,
            explode parts, or highlight the active step in 3D.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <p className="font-mono text-xs text-muted">
            {parts.length} part{parts.length === 1 ? '' : 's'} selected
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="text-sm text-muted hover:text-foreground"
          >
            New build
          </button>
        </div>
      </header>

      <div className="grid flex-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)_300px]">
        <BuilderStepNav className="hidden lg:flex" />

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex gap-1 overflow-x-auto pb-2 lg:hidden">
            {BUILDER_STEPS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => useBuilderStore.getState().setStep(s)}
                className={
                  s === step
                    ? 'shrink-0 rounded-2xl glass-btn px-3 py-1.5 text-xs'
                    : 'shrink-0 rounded-2xl glass-panel px-3 py-1.5 text-xs text-muted'
                }
              >
                {slotLabel(s)}
              </button>
            ))}
          </div>

          {step === 'REVIEW' ? (
            <section className="space-y-6">
              <div>
                <h2 className="font-display text-2xl tracking-tight md:text-3xl">
                  {slotLabel('REVIEW')}
                </h2>
                <p className="mt-1 text-sm text-muted">
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

          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={prevStep}
              className="text-sm text-muted hover:text-foreground"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="glass-btn rounded-2xl px-4 py-2 text-sm"
            >
              {step === 'REVIEW' ? 'Done' : 'Continue'}
            </button>
          </div>
        </div>

        <BuilderSummary />
      </div>
    </div>
  );
}
