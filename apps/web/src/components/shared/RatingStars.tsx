'use client';

import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

type RatingStarsProps = {
  rating: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md';
  /** When set, stars are a rating picker (not a dropdown). */
  onChange?: (rating: number) => void;
  disabled?: boolean;
  name?: string;
};

const SIZE = {
  sm: 'size-3.5',
  md: 'size-7',
} as const;

function StarIcon({ filled, size }: { filled: boolean; size: 'sm' | 'md' }) {
  return (
    <Star
      className={cn(
        SIZE[size],
        filled ? 'fill-accent text-accent' : 'fill-none text-muted/45',
      )}
      strokeWidth={1.6}
      aria-hidden
    />
  );
}

export function RatingStars({
  rating,
  max = 5,
  className,
  size = 'sm',
  onChange,
  disabled = false,
  name,
}: RatingStarsProps) {
  const uid = useId();
  const [hover, setHover] = useState<number | null>(null);
  const clamped = Math.max(0, Math.min(max, rating));
  const preview = hover ?? clamped;
  const interactive = Boolean(onChange) && !disabled;

  if (!interactive) {
    return (
      <span
        className={cn('inline-flex items-center gap-0.5', className)}
        aria-label={`${clamped.toFixed(1)} out of ${max} stars`}
      >
        {Array.from({ length: max }, (_, i) => (
          <StarIcon key={i} filled={i + 1 <= Math.round(clamped)} size={size} />
        ))}
      </span>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className={cn('inline-flex items-center gap-1', className)}
      onMouseLeave={() => setHover(null)}
    >
      {name ? (
        <input type="hidden" name={name} value={clamped || ''} />
      ) : null}
      {Array.from({ length: max }, (_, i) => {
        const value = i + 1;
        const filled = value <= Math.round(preview);
        const selected = value === clamped;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
            id={`${uid}-${value}`}
            disabled={disabled}
            onMouseEnter={() => setHover(value)}
            onFocus={() => setHover(value)}
            onBlur={() => setHover(null)}
            onClick={() => onChange?.(value)}
            className={cn(
              'rounded-sm p-0.5 transition-transform hover:scale-110',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/70',
            )}
          >
            <StarIcon filled={filled} size={size} />
          </button>
        );
      })}
    </div>
  );
}
