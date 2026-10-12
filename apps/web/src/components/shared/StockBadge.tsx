import { cn } from '@/lib/utils';

type StockBadgeProps = {
  inStock: boolean;
  quantity?: number;
  className?: string;
};

export function StockBadge({ inStock, quantity, className }: StockBadgeProps) {
  const base = 'shrink-0 font-mono text-[11px] tracking-[0.06em] uppercase';

  if (!inStock) {
    return <span className={cn(base, 'text-subtle', className)}>Out of stock</span>;
  }

  const low = quantity !== undefined && quantity > 0 && quantity <= 5;

  return (
    <span className={cn(base, low ? 'text-accent' : 'text-muted', className)}>
      {low
        ? `${quantity} left`
        : quantity !== undefined && quantity > 0
          ? `${quantity} in stock`
          : 'In stock'}
    </span>
  );
}
