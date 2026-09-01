'use client';

import { useState } from 'react';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ADD_TO_CART, type CartData } from '@/features/cart/graphql';
import { syncCartUi } from '@/features/cart/sync';

type AddToCartButtonProps = {
  variantId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  label?: string;
};

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled,
  className,
  size = 'default',
  label = 'Add to cart',
}: AddToCartButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onClick() {
    setError(null);
    setDone(false);
    setPending(true);
    try {
      const data = await graphqlRequest<{ addToCart: CartData }>(ADD_TO_CART, {
        input: { variantId, quantity },
      });
      syncCartUi(data.addToCart);
      setDone(true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <Button
        type="button"
        size={size}
        disabled={disabled || pending || !variantId}
        onClick={onClick}
      >
        {pending ? 'Adding…' : done ? 'Added' : label}
      </Button>
      {error ? (
        <p className="max-w-[16rem] text-xs text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
