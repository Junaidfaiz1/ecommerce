import { cn } from '@/lib/utils';

type StockBadgeProps = {
  inStock: boolean;
  quantity?: number;
  className?: string;
};

export function StockBadge({ inStock, quantity, className }: StockBadgeProps) {
  if (!inStock) {
    return (
      <span
        className={cn(
          'font-mono text-[11px] tracking-wide text-muted uppercase',
          className,
        )}
      >
        Out of stock
      </span>
    );
  }

  const low = quantity !== undefined && quantity > 0 && quantity <= 5;

  return (
    <span
      className={cn(
        'font-mono text-[11px] tracking-wide uppercase',
        low ? 'text-amber-400/90' : 'text-emerald-400/80',
        className,
      )}
    >
      {low ? `Low stock · ${quantity}` : 'In stock'}
    </span>
  );
}
