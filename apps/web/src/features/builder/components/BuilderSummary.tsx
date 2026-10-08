'use client';

import { COMPONENT_SLOTS, type ComponentSlot } from '@vorqen/types';
import { CompatPanel } from './CompatPanel';
import { PerformancePanel } from './PerformancePanel';
import { useBuildPreview } from '../hooks';
import { slotLabel, useBuilderStore } from '../store';

function formatMoney(price: string | null | undefined, currency = 'USD') {
  if (!price) return '—';
  const n = Number(price);
  if (Number.isNaN(n)) return price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(n);
}

export function BuilderSummary() {
  const parts = useBuilderStore((s) => s.parts);
  const removePart = useBuilderStore((s) => s.removePart);
  const { preview, error, pending } = useBuildPreview(parts);

  const orderedSlots = COMPONENT_SLOTS.filter((slot) =>
    parts.some((p) => p.slot === slot),
  );

  return (
    <aside className="flex w-full flex-col gap-7 border-t border-border bg-surface px-4 py-7 md:px-8 lg:w-[360px] lg:shrink-0 lg:border-t-0 lg:border-l lg:px-7 lg:py-8">
      <div className="flex flex-col gap-1">
        <p className="label-mono">Build total · server-priced</p>
        <p className="font-display text-[48px] leading-[1.05] font-extrabold tabular-nums [font-stretch:115%]">
          {parts.length === 0
            ? formatMoney('0')
            : formatMoney(preview?.totalPrice, preview?.currency)}
        </p>
        <p className="font-mono text-xs text-subtle" aria-live="polite">
          {pending ? 'Updating…' : 'Live total from server'}
        </p>
        {error ? <p className="mt-2 text-sm text-accent">{error}</p> : null}
      </div>

      <ul className="flex flex-col text-sm">
        {orderedSlots.length === 0 ? (
          <li className="text-muted">No parts selected yet.</li>
        ) : (
          orderedSlots.map((slot) =>
            parts
              .filter((p) => p.slot === slot)
              .map((part) => {
                const line = preview?.lineItems.find(
                  (l) => l.slot === slot && l.productId === part.productId,
                );
                return (
                  <li
                    key={`${part.slot}-${part.productId}`}
                    className="flex items-start justify-between gap-3 border-b border-border py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="label-mono">
                        {slotLabel(part.slot as ComponentSlot)}
                      </p>
                      <p className="truncate">{part.productName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-xs tabular-nums">
                        {formatMoney(line?.lineTotal ?? part.unitPrice)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removePart(part.slot, part.productId)}
                        className="mt-0.5 text-xs text-subtle hover:text-foreground"
                        aria-label={`Remove ${part.productName}`}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              }),
          )
        )}
      </ul>

      <CompatPanel
        compatibility={preview?.compatibility ?? null}
        pending={pending && parts.length > 0}
      />

      <PerformancePanel />
    </aside>
  );
}
