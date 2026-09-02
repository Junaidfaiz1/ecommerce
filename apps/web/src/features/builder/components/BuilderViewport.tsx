'use client';

/**
 * Center viewport — selected part photo with slot thumbnails.
 * Highlights the active step; empty slots use category catalog photos.
 */
import { COMPONENT_SLOTS, IMAGE_SIZES, type ComponentSlot } from '@vorqen/types';
import { CatalogImage } from '@/components/shared/CatalogImage';
import { cn } from '@/lib/utils';
import { SLOT_PLACEHOLDER_IMAGE } from '../slot-images';
import { isComponentSlot, slotLabel, useBuilderStore } from '../store';

export function BuilderViewport() {
  const parts = useBuilderStore((s) => s.parts);
  const step = useBuilderStore((s) => s.step);
  const setStep = useBuilderStore((s) => s.setStep);

  const highlight: ComponentSlot | null = isComponentSlot(step) ? step : null;
  const featuredSlot = highlight ?? parts[0]?.slot ?? 'CASE';
  const featuredPart = parts.find((p) => p.slot === featuredSlot);
  const featuredSrc =
    featuredPart?.imageUrl ?? SLOT_PLACEHOLDER_IMAGE[featuredSlot];

  return (
    <div className="overflow-hidden rounded-3xl glass-panel">
      <div className="relative min-h-[240px] bg-cream sm:min-h-[280px] lg:min-h-[360px]">
        <CatalogImage
          src={featuredSrc}
          alt={
            featuredPart
              ? `${featuredPart.brandName} ${featuredPart.productName}`
              : `${slotLabel(featuredSlot)}`
          }
          sizes={IMAGE_SIZES.builderStage}
          className="object-contain p-8 sm:p-10"
        />
      </div>
      <div className="flex items-end justify-between gap-3 border-t border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            {slotLabel(featuredSlot)}
          </p>
          <p className="mt-0.5 truncate font-display text-lg tracking-tight">
            {featuredPart
              ? featuredPart.productName
              : `Select ${slotLabel(featuredSlot).toLowerCase()}`}
          </p>
        </div>
        {featuredPart ? (
          <p className="shrink-0 font-mono text-[11px] text-sage">Selected</p>
        ) : (
          <p className="shrink-0 font-mono text-[11px] text-muted">Empty</p>
        )}
      </div>
      <ul className="flex gap-2 overflow-x-auto border-t border-white/10 p-3">
        {COMPONENT_SLOTS.map((slot) => {
          const part = parts.find((p) => p.slot === slot);
          const active = slot === featuredSlot;
          return (
            <li key={slot}>
              <button
                type="button"
                onClick={() => setStep(slot)}
                aria-label={slotLabel(slot)}
                aria-pressed={active}
                className={cn(
                  'relative h-16 w-16 overflow-hidden rounded-xl bg-cream',
                  active
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-transparent'
                    : 'ring-1 ring-white/15',
                  !part && 'opacity-55',
                )}
              >
                <CatalogImage
                  src={part?.imageUrl ?? SLOT_PLACEHOLDER_IMAGE[slot]}
                  alt=""
                  sizes={IMAGE_SIZES.builderSlot}
                  className="object-contain p-1.5"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
