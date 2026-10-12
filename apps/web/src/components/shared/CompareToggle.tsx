'use client';

import Link from 'next/link';
import { COMPARE_MAX_ITEMS } from '@vorqen/types';
import { useCompareStore } from '@/features/comparison/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type CompareToggleProps = {
  productId: string;
  className?: string;
};

export function CompareToggle({ productId, className }: CompareToggleProps) {
  const ids = useCompareStore((s) => s.ids);
  const toggle = useCompareStore((s) => s.toggle);
  const selected = ids.includes(productId);
  const full = ids.length >= COMPARE_MAX_ITEMS && !selected;

  return (
    <Button
      type="button"
      variant={selected ? 'solid' : 'outline'}
      size="sm"
      className={cn('shrink-0', className)}
      disabled={full}
      aria-pressed={selected}
      onClick={() => toggle(productId)}
      title={
        full
          ? `Compare is limited to ${COMPARE_MAX_ITEMS} products`
          : selected
            ? 'Remove from compare'
            : 'Add to compare'
      }
    >
      {selected ? 'Comparing' : 'Compare'}
    </Button>
  );
}

export function CompareTray() {
  const ids = useCompareStore((s) => s.ids);
  const clear = useCompareStore((s) => s.clear);

  if (ids.length === 0) return null;

  const href = `/compare?ids=${ids.join(',')}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 md:px-10">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4">
        <p className="font-mono text-xs tracking-wide text-muted uppercase">
          <span className="text-foreground">{ids.length}</span> /{' '}
          {COMPARE_MAX_ITEMS} selected for compare
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
          <Link
            href={href}
            className="inline-flex h-9 items-center justify-center rounded-full bg-accent px-4 text-xs font-semibold text-ink"
          >
            Open compare
          </Link>
        </div>
      </div>
    </div>
  );
}
