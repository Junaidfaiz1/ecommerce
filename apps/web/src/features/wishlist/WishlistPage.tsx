'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Price } from '@/components/shared/Price';
import { StockBadge } from '@/components/shared/StockBadge';
import { EmptyState, ErrorState } from '@/components/shared/SectionStates';
import { CommercePageSkeleton } from '@/components/shared/Skeleton';
import { Button } from '@/components/ui/button';
import { graphqlRequest, GraphQLClientError } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { productHref } from '@/features/products/product-path';
import type { ProductType } from '@vorqen/types';
import { CATALOG_PLACEHOLDER_IMAGE, IMAGE_SIZES } from '@vorqen/types';
import { CatalogImage } from '@/components/shared/CatalogImage';
import { loginHref } from '@/lib/auth-redirect';
import { syncCartUi } from '@/features/cart/sync';
import {
  MOVE_WISHLIST_TO_CART,
  REMOVE_FROM_WISHLIST,
  WISHLIST_QUERY,
  type WishlistData,
} from './graphql';

export function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{ wishlist: WishlistData }>(
          WISHLIST_QUERY,
        );
        if (cancelled) return;
        setWishlist(data.wishlist);
        setNeedsAuth(false);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof GraphQLClientError && e.code === 'UNAUTHENTICATED') {
          setNeedsAuth(true);
          setWishlist(null);
        } else {
          setError(getErrorMessage(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onRemove(variantId: string) {
    setPending(true);
    try {
      const data = await graphqlRequest<{ removeFromWishlist: WishlistData }>(
        REMOVE_FROM_WISHLIST,
        { input: { variantId } },
      );
      setWishlist(data.removeFromWishlist);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setPending(false);
    }
  }

  async function onMoveToCart(variantId: string) {
    setPending(true);
    setError(null);
    try {
      const data = await graphqlRequest<{
        moveWishlistItemToCart: {
          wishlist: WishlistData;
          cart: { totals: { itemCount: number } };
        };
      }>(MOVE_WISHLIST_TO_CART, { input: { variantId, quantity: 1 } });
      setWishlist(data.moveWishlistItemToCart.wishlist);
      syncCartUi({
        id: '',
        items: [],
        totals: {
          subtotal: '0',
          discount: '0',
          total: '0',
          currency: 'USD',
          itemCount: data.moveWishlistItemToCart.cart.totals.itemCount,
          couponCode: null,
          couponValid: false,
          couponMessage: null,
        },
        lastActivityAt: '',
        updatedAt: '',
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <CommercePageSkeleton label="Loading wishlist" summary={false} />;
  }

  if (needsAuth) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <EmptyState
          title="Sign in to view your wishlist"
          description="Saved parts sync across devices once you’re authenticated."
          action={
            <Link
              href={loginHref('/wishlist')}
              className="glass-btn inline-flex h-10 items-center rounded-2xl px-4 text-sm font-medium"
            >
              Sign in
            </Link>
          }
        />
      </main>
    );
  }

  if (error && !wishlist) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <ErrorState message={error} />
      </main>
    );
  }

  const empty = !wishlist || wishlist.items.length === 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
          Account
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Wishlist
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Prices shown are live from the catalog — never cached client totals.
        </p>
      </header>

      {empty ? (
        <EmptyState
          title="No saved parts yet"
          description="Add components from a product page to keep them here."
          action={
            <Link
              href="/shop"
              className="glass-btn inline-flex h-10 items-center rounded-2xl px-4 text-sm font-medium"
            >
              Browse shop
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {wishlist.items.map((item) => {
            const href = productHref({
              slug: item.product.slug,
              type: item.product.type as ProductType,
            });
            return (
              <li
                key={item.id}
                className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center"
              >
                <Link
                  href={href}
                  className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl glass-panel sm:w-28"
                >
                  <CatalogImage
                    src={item.product.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE}
                    alt={item.product.name}
                    sizes={IMAGE_SIZES.wishlistThumb}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                    {item.product.brandName}
                  </p>
                  <Link
                    href={href}
                    className="font-display text-lg tracking-tight hover:text-accent"
                  >
                    {item.product.name}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Price amount={item.unitPrice} currency={item.currency} />
                    <StockBadge
                      inStock={item.inStock}
                      quantity={item.availableQuantity}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending || !item.inStock}
                    onClick={() => void onMoveToCart(item.variantId)}
                  >
                    Move to cart
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => void onRemove(item.variantId)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p className="mt-6 text-sm text-red-400">{error}</p>
      ) : null}
    </main>
  );
}
