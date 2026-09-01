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
      variant={selected ? 'default' : 'outline'}
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
    <div className="fixed inset-x-3 bottom-3 z-40 rounded-3xl glass-nav px-4 py-3 md:inset-x-6 md:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <span className="font-medium text-foreground">{ids.length}</span> selected
          for compare
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
          <Link
            href={href}
            className="glass-btn inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium"
          >
            Open compare
          </Link>
        </div>
      </div>
    </div>
  );
}
