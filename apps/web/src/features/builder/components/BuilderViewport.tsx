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

function formatMoney(price: string | null | undefined) {
  if (!price) return null;
  const n = Number(price);
  if (Number.isNaN(n)) return price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(n);
}

export function BuilderViewport() {
  const parts = useBuilderStore((s) => s.parts);
  const step = useBuilderStore((s) => s.step);
  const setStep = useBuilderStore((s) => s.setStep);

  const highlight: ComponentSlot | null = isComponentSlot(step) ? step : null;
  const featuredSlot = highlight ?? parts[0]?.slot ?? 'CASE';
  const featuredPart = parts.find((p) => p.slot === featuredSlot);
  const featuredSrc =
    featuredPart?.imageUrl ?? SLOT_PLACEHOLDER_IMAGE[featuredSlot];
  const slotIndex = COMPONENT_SLOTS.indexOf(featuredSlot) + 1;
  const price = formatMoney(featuredPart?.unitPrice);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2">
            {String(slotIndex).padStart(2, '0')} / {slotLabel(featuredSlot)}
          </p>
          <h2 className="font-display text-[28px] leading-none font-extrabold [font-stretch:118%] md:text-[40px]">
            {featuredPart
              ? featuredPart.productName
              : `Choose ${slotLabel(featuredSlot)}`}
          </h2>
        </div>
        {price ? (
          <p className="font-display text-[28px] font-bold tabular-nums [font-stretch:112%]">
            {price}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          'crop-marks media-bed relative h-[240px] overflow-hidden rounded-[4px] sm:h-[300px] lg:h-[360px]',
          !featuredPart && 'opacity-60',
        )}
      >
        <CatalogImage
          src={featuredSrc}
          alt={
            featuredPart
              ? `${featuredPart.brandName} ${featuredPart.productName}`
              : slotLabel(featuredSlot)
          }
          sizes={IMAGE_SIZES.builderStage}
        />
      </div>

      <ul className="grid grid-cols-8 gap-2" aria-label="Slots">
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
                  'media-bed relative block aspect-[8/7] w-full overflow-hidden rounded-[4px] border',
                  active ? 'border-foreground' : 'border-border',
                  !part && 'opacity-45',
                )}
              >
                <CatalogImage
                  src={part?.imageUrl ?? SLOT_PLACEHOLDER_IMAGE[slot]}
                  alt=""
                  sizes={IMAGE_SIZES.builderSlot}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
