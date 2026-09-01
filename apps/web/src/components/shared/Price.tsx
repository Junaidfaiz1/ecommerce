import { cn } from '@/lib/utils';
import { formatMoney } from '@/features/products/product-path';

type PriceProps = {
  amount: string;
  currency?: string;
  compareAt?: string | null;
  className?: string;
};

export function Price({
  amount,
  currency = 'USD',
  compareAt,
  className,
}: PriceProps) {
  const showCompare =
    compareAt != null && Number(compareAt) > Number(amount);

  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className="font-medium text-foreground">
        {formatMoney(amount, currency)}
      </span>
      {showCompare ? (
        <span className="text-sm text-muted line-through">
          {formatMoney(compareAt, currency)}
        </span>
      ) : null}
    </span>
  );
}
