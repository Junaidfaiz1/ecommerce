'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Price } from '@/components/shared/Price';
import { StockBadge } from '@/components/shared/StockBadge';
import { QuantityStepper } from '@/components/shared/QuantityStepper';
import { CatalogImage } from '@/components/shared/CatalogImage';
import { EmptyState, ErrorState } from '@/components/shared/SectionStates';
import { CommercePageSkeleton } from '@/components/shared/Skeleton';
import { Button } from '@/components/ui/button';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { productHref } from '@/features/products/product-path';
import type { ProductType } from '@vorqen/types';
import { CART_MAX_LINE_QUANTITY, CATALOG_PLACEHOLDER_IMAGE, IMAGE_SIZES } from '@vorqen/types';
import {
  APPLY_COUPON,
  CART_QUERY,
  CLEAR_CART,
  REMOVE_CART_ITEM,
  REMOVE_COUPON,
  UPDATE_CART_ITEM,
  type CartData,
} from './graphql';
import { syncCartUi } from './sync';

export function CartPage() {
  const [cart, setCart] = useState<CartData | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{ cart: CartData | null }>(CART_QUERY);
        if (cancelled) return;
        setCart(data.cart);
        syncCartUi(data.cart);
      } catch (e) {
        if (cancelled) return;
        setError(getErrorMessage(e));
        setCart(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(mut: () => Promise<CartData>) {
    setPending(true);
    setCouponError(null);
    try {
      const next = await mut();
      setCart(next);
      syncCartUi(next);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setPending(false);
    }
  }

  async function onQuantity(variantId: string, quantity: number) {
    await run(async () => {
      const data = await graphqlRequest<{ updateCartItem: CartData }>(
        UPDATE_CART_ITEM,
        { input: { variantId, quantity } },
      );
      return data.updateCartItem;
    });
  }

  async function onRemove(variantId: string) {
    await run(async () => {
      const data = await graphqlRequest<{ removeCartItem: CartData }>(
        REMOVE_CART_ITEM,
        { input: { variantId } },
      );
      return data.removeCartItem;
    });
  }

  async function onClear() {
    await run(async () => {
      const data = await graphqlRequest<{ clearCart: CartData }>(CLEAR_CART);
      return data.clearCart;
    });
  }

  async function onApplyCoupon(e: FormEvent) {
    e.preventDefault();
    setCouponError(null);
    setPending(true);
    try {
      const data = await graphqlRequest<{ applyCoupon: CartData }>(
        APPLY_COUPON,
        { input: { code: couponInput } },
      );
      setCart(data.applyCoupon);
      syncCartUi(data.applyCoupon);
      setCouponInput('');
    } catch (err) {
      setCouponError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onRemoveCoupon() {
    await run(async () => {
      const data = await graphqlRequest<{ removeCoupon: CartData }>(
        REMOVE_COUPON,
      );
      return data.removeCoupon;
    });
  }

  if (cart === undefined && !error) {
    return <CommercePageSkeleton label="Loading cart" />;
  }

  if (error && !cart) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <ErrorState message={error} />
      </main>
    );
  }

  const empty = !cart || cart.items.length === 0;
  const outOfStock = Boolean(
    cart?.items.some((line) => line.quantity > line.availableQuantity),
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
          Commerce
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Cart
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Prices and stock are recalculated on the server. Checkout requires a
          signed-in account.
        </p>
      </header>

      {empty ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse the catalog or open the PC Builder to assemble a rig."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="glass-btn inline-flex h-10 items-center rounded-2xl px-4 text-sm font-medium"
              >
                Shop hardware
              </Link>
              <Link
                href="/build"
                className="glass-panel inline-flex h-10 items-center rounded-2xl px-4 text-sm"
              >
                Open Builder
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <section className="space-y-0">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-xs text-muted">
                {cart.totals.itemCount} item
                {cart.totals.itemCount === 1 ? '' : 's'}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => void onClear()}
              >
                Clear cart
              </Button>
            </div>

            <ul className="divide-y divide-border border-y border-border">
              {cart.items.map((line) => {
                const href = productHref({
                  slug: line.product.slug,
                  type: line.product.type as ProductType,
                });
                return (
                  <li
                    key={line.id}
                    className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start"
                  >
                    <Link
                      href={href}
                      className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl glass-panel sm:w-36"
                    >
                      <CatalogImage
                        src={line.product.imageUrl ?? CATALOG_PLACEHOLDER_IMAGE}
                        alt={line.product.name}
                        sizes={IMAGE_SIZES.cartThumb}
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                        {line.product.brandName} · {line.product.type}
                      </p>
                      <Link
                        href={href}
                        className="font-display text-lg tracking-tight hover:text-accent"
                      >
                        {line.product.name}
                      </Link>
                      <p className="font-mono text-xs text-muted">
                        {line.variant.name ?? line.variant.sku}
                      </p>
                      <StockBadge
                        inStock={line.inStock}
                        quantity={line.availableQuantity}
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-4">
                        <QuantityStepper
                          value={line.quantity}
                          max={Math.min(
                            CART_MAX_LINE_QUANTITY,
                            Math.max(1, line.availableQuantity),
                          )}
                          disabled={pending}
                          onChange={(q) => void onQuantity(line.variantId, q)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => void onRemove(line.variantId)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <Price
                        amount={line.lineTotal}
                        currency={line.currency}
                      />
                      <p className="mt-1 font-mono text-[11px] text-muted">
                        {line.unitPrice} each
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="h-fit rounded-md glass-panel p-6">
            <h2 className="font-display text-xl tracking-tight">Summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Subtotal</dt>
                <dd>
                  <Price
                    amount={cart.totals.subtotal}
                    currency={cart.totals.currency}
                  />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Discount</dt>
                <dd>
                  <Price
                    amount={cart.totals.discount}
                    currency={cart.totals.currency}
                  />
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-3 font-medium">
                <dt>Total</dt>
                <dd>
                  <Price
                    amount={cart.totals.total}
                    currency={cart.totals.currency}
                    className="text-lg"
                  />
                </dd>
              </div>
            </dl>

            <form onSubmit={onApplyCoupon} className="mt-6 space-y-2">
              <label className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                Coupon
              </label>
              {cart.totals.couponCode && cart.totals.couponValid ? (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-accent">
                    {cart.totals.couponCode}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => void onRemoveCoupon()}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="BUILD10"
                    className="glass-input h-10 flex-1 rounded-2xl px-3 font-mono text-sm uppercase outline-none focus:border-accent"
                    disabled={pending}
                  />
                  <Button type="submit" variant="outline" disabled={pending}>
                    Apply
                  </Button>
                </div>
              )}
              {couponError ? (
                <p className="text-xs text-red-400">{couponError}</p>
              ) : null}
              {cart.totals.couponMessage ? (
                <p className="text-xs text-muted">{cart.totals.couponMessage}</p>
              ) : null}
            </form>

            {outOfStock ? (
              <p className="mt-4 text-xs text-red-400" role="alert">
                Some items no longer have enough stock. Update quantities
                before checkout.
              </p>
            ) : null}

            {outOfStock ? (
              <Button type="button" className="mt-8 w-full" disabled>
                Checkout
              </Button>
            ) : (
              <Link
                href="/checkout"
                className="glass-btn mt-8 inline-flex h-10 w-full items-center justify-center rounded-2xl px-4 text-sm font-medium"
              >
                Checkout
              </Link>
            )}
            <p className="mt-3 text-center font-mono text-[10px] text-muted">
              Secure payment with Stripe
            </p>
          </aside>
        </div>
      )}

      {error ? (
        <p className="mt-6 text-sm text-red-400">{error}</p>
      ) : null}
    </main>
  );
}
