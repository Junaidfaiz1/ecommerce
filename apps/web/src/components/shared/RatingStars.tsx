import { cn } from '@/lib/utils';

type RatingStarsProps = {
  rating: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md';
};

export function RatingStars({
  rating,
  max = 5,
  className,
  size = 'sm',
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(max, rating));
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span
      className={cn('inline-flex items-center gap-0.5', textSize, className)}
      aria-label={`${clamped.toFixed(1)} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= Math.round(clamped);
        return (
          <span
            key={i}
            className={filled ? 'text-accent' : 'text-border'}
            aria-hidden
          >
            ★
          </span>
        );
      })}
    </span>
  );
}
