'use client';

import type { ComponentSlot } from '@vorqen/types';
import { cn } from '@/lib/utils';
import {
  catalogPickToDraft,
  useSlotProducts,
  type CatalogPick,
} from '../hooks';
import { slotLabel, useBuilderStore } from '../store';

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
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl tracking-tight md:text-3xl">
            {slotLabel(slot)}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Prices and stock from catalog — confirmed again when you save.
          </p>
        </div>
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
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {pending && items.length === 0 ? (
        <p className="text-sm text-muted">Loading parts…</p>
      ) : null}

      {!pending && items.length === 0 && !error ? (
        <p className="text-sm text-muted">No active products in this category yet.</p>
      ) : null}

      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((product) => {
          const active = selectedIds.has(product.id);
          const variant = product.defaultVariant;
          return (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onPick(product)}
                className={cn(
                  'flex w-full flex-col gap-1 rounded-md border px-4 py-3 text-left transition-colors',
                  active
                    ? 'border-accent bg-elevated'
                    : 'border-border bg-surface hover:border-muted',
                )}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  {product.brand.name}
                </span>
                <span className="text-sm font-medium leading-snug">
                  {product.name}
                </span>
                <span className="mt-1 flex items-center justify-between gap-2 font-mono text-xs text-muted">
                  <span>{formatMoney(variant?.price, variant?.currency)}</span>
                  <span>
                    {variant?.inStock
                      ? `${variant.availableQuantity} in stock`
                      : 'Out of stock'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
