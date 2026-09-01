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
    <aside className="flex h-full flex-col gap-6 border-border lg:border-l lg:pl-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Build summary
        </p>
        <p className="mt-2 font-display text-3xl tracking-tight tabular-nums">
          {formatMoney(preview?.totalPrice, preview?.currency)}
        </p>
        <p className="mt-1 text-xs text-muted">
          {pending ? 'Updating…' : 'Live total from server'}
        </p>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>

      <ul className="space-y-2 text-sm">
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
                    className="flex items-start justify-between gap-2 border-b border-border/50 pb-2"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                        {slotLabel(part.slot as ComponentSlot)}
                      </p>
                      <p className="truncate">{part.productName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-xs">
                        {formatMoney(line?.lineTotal ?? part.unitPrice)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removePart(part.slot, part.productId)}
                        className="mt-1 text-[11px] text-muted hover:text-foreground"
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
