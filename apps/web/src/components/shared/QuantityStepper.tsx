'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  className?: string;
};

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  disabled,
  onChange,
  className,
}: QuantityStepperProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center border border-border bg-surface',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 rounded-none px-0"
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </Button>
      <span className="min-w-8 text-center font-mono text-sm tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 rounded-none px-0"
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </Button>
    </div>
  );
}
