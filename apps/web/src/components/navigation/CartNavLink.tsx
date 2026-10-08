'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { graphqlRequest } from '@/lib/graphql-client';
import { useCartUiStore } from '@/stores/cart-store';
import { CART_QUERY, type CartData } from '@/features/cart/graphql';
import { syncCartUi } from '@/features/cart/sync';
import { cn } from '@/lib/utils';

export function CartNavLink({ className }: { className?: string }) {
  const itemCount = useCartUiStore((s) => s.itemCount);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{ cart: CartData | null }>(
          CART_QUERY,
        );
        if (!cancelled) syncCartUi(data.cart);
      } catch {
        // Badge stays at last known count.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/cart"
      aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
      className={cn(
        'inline-flex h-11 items-center gap-2.5 rounded-full border border-border-strong px-4 text-[15px] text-foreground transition-colors hover:border-foreground',
        className,
      )}
    >
      Cart
      {itemCount > 0 ? (
        <span className="rounded-full bg-accent px-1.5 font-mono text-[12px] leading-5 text-ink">
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
