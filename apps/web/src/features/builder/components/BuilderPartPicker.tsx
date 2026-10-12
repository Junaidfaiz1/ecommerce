'use client';

import type { ComponentSlot } from '@vorqen/types';
import { CATALOG_PLACEHOLDER_IMAGE, IMAGE_SIZES } from '@vorqen/types';
import { cn } from '@/lib/utils';
import { CatalogImage } from '@/components/shared/CatalogImage';
import {
  catalogPickToDraft,
  useSlotProducts,
  type CatalogPick,
} from '../hooks';
import { slotLabel, useBuilderStore } from '../store';
import { PartOptionsSkeleton } from './BuilderSkeleton';

type Props = {
  slot: ComponentSlot;
};

function formatMoney(price: string | null | undefined, currency = 'USD') {
  if (!price) return '—';
  const n = Number(price);
  if (Number.isNaN(n)) return price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(n);
}

export function BuilderPartPicker({ slot }: Props) {
  const { items, error, pending } = useSlotProducts(slot);
  const selectPart = useBuilderStore((s) => s.selectPart);
  const clearSlot = useBuilderStore((s) => s.clearSlot);
  const partsForSlot = useBuilderStore((s) => s.partsForSlot);
  const selected = partsForSlot(slot);
  const selectedIds = new Set(selected.map((p) => p.productId));
  const multi = slot === 'RAM' || slot === 'STORAGE';

  function onPick(product: CatalogPick) {
    if (selectedIds.has(product.id) && multi) {
      useBuilderStore.getState().removePart(slot, product.id);
      return;
    }
    selectPart(catalogPickToDraft(slot, product));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-3 flex items-end justify-between gap-4">
        <p className="label-mono">
          {slotLabel(slot)} options{multi ? ' · pick one or more' : ''}
        </p>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={() => clearSlot(slot)}
            className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear
          </button>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-md border border-accent/40 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      ) : null}

      {pending && items.length === 0 ? (
        <PartOptionsSkeleton />
      ) : null}

      {!pending && items.length === 0 && !error ? (
        <p className="text-sm text-muted">No active products in this category yet.</p>
      ) : null}

      <ul
        className={cn(
          'flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border',
          items.length === 0 && 'hidden',
        )}
      >
        {items.map((product) => {
          const active = selectedIds.has(product.id);
          const variant = product.defaultVariant;
          return (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onPick(product)}
                aria-pressed={active}
                className={cn(
                  'flex w-full items-center gap-4 px-4 py-3 text-left transition-colors md:px-5',
                  active ? 'bg-surface' : 'hover:bg-surface/60',
                )}
              >
                <span
                  aria-hidden
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-subtle"
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      active ? 'bg-foreground' : 'bg-transparent',
                    )}
                  />
                </span>
                <span className="media-bed relative h-14 w-[72px] shrink-0 overflow-hidden rounded-[4px]">
                  <CatalogImage
                    src={
                      product.images.find((img) => img.isPrimary)?.url ??
                      product.images[0]?.url ??
                      CATALOG_PLACEHOLDER_IMAGE
                    }
                    alt=""
                    sizes={IMAGE_SIZES.productThumb}
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] leading-snug font-medium">
                    {product.name}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {product.brand.name} ·{' '}
                    {variant?.inStock
                      ? `${variant.availableQuantity} in stock`
                      : 'Out of stock'}
                  </span>
                </span>
                <span className="shrink-0 text-right font-mono text-sm tabular-nums">
                  {formatMoney(variant?.price, variant?.currency)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
