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
      className={cn(
        'text-muted transition-colors hover:text-foreground',
        className,
      )}
    >
      Cart
      {itemCount > 0 ? (
        <span className="ml-1 font-mono text-[11px] text-accent">
          ({itemCount})
        </span>
      ) : null}
    </Link>
  );
}
