'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cuidSchema } from '@vorqen/types';
import { Price } from '@/components/shared/Price';
import { ErrorState } from '@/components/shared/SectionStates';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { syncCartUi } from '@/features/cart/sync';
import { CHECKOUT_STATUS, type CheckoutStatusData } from './graphql';

function SuccessBody() {
  const searchParams = useSearchParams();
  const rawOrder = searchParams.get('order');
  const parsed = cuidSchema.safeParse(rawOrder);
  const orderId = parsed.success ? parsed.data : null;
  const [status, setStatus] = useState<CheckoutStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15;

    async function tick() {
      try {
        const data = await graphqlRequest<{
          checkoutStatus: CheckoutStatusData;
        }>(CHECKOUT_STATUS, { orderId });
        if (cancelled) return;
        setStatus(data.checkoutStatus);
        if (data.checkoutStatus.orderStatus === 'PAID') {
          setProcessing(false);
          syncCartUi({
            id: data.checkoutStatus.orderId,
            items: [],
            totals: {
              subtotal: '0.00',
              discount: '0.00',
              total: '0.00',
              currency: data.checkoutStatus.currency,
              itemCount: 0,
              couponCode: null,
              couponValid: false,
              couponMessage: null,
            },
            lastActivityAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          return;
        }
        if (
          data.checkoutStatus.orderStatus === 'CANCELLED' ||
          data.checkoutStatus.paymentStatus === 'FAILED'
        ) {
          setProcessing(false);
          return;
        }
        attempts += 1;
        if (attempts >= maxAttempts) {
          setProcessing(false);
          return;
        }
        window.setTimeout(() => {
          void tick();
        }, 2000);
      } catch (e) {
        if (cancelled) return;
        setError(getErrorMessage(e));
        setProcessing(false);
      }
    }

    void tick();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <ErrorState message="Missing or invalid order." />
        <p className="mt-6 text-sm">
          <Link href="/cart" className="text-accent">
            Return to cart
          </Link>
        </p>
      </main>
    );
  }

  if (error && !status) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <ErrorState message={error} />
        <p className="mt-6 text-sm">
          <Link href="/cart" className="text-accent">
            Return to cart
          </Link>
        </p>
      </main>
    );
  }

  const paid = status?.orderStatus === 'PAID';
  const failed =
    status?.orderStatus === 'CANCELLED' || status?.paymentStatus === 'FAILED';

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
        Checkout
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        {paid
          ? 'Payment confirmed'
          : failed
            ? 'Payment did not complete'
            : 'Payment processing'}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {paid
          ? 'Stripe webhook confirmed this order. Thank you.'
          : failed
            ? 'No charge was captured for this attempt. You can safely try again.'
            : 'Waiting for Stripe to confirm the PaymentIntent. This page will not mark the order paid on its own.'}
      </p>

      {status ? (
        <dl className="mt-8 space-y-3 border border-border bg-surface p-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Order</dt>
            <dd className="font-mono">{status.orderNumber}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Status</dt>
            <dd>{status.orderStatus.replaceAll('_', ' ')}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Total</dt>
            <dd>
              <Price amount={status.grandTotal} currency={status.currency} />
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-8 text-sm text-muted">Checking payment status…</p>
      )}

      {processing && !paid && !failed ? (
        <p className="mt-4 font-mono text-[11px] text-muted">
          Refreshing status…
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {paid ? (
          <Link
            href={`/account/orders/${orderId}`}
            className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-background"
          >
            View order
          </Link>
        ) : null}
        <Link
          href="/shop"
          className={
            paid
              ? 'inline-flex h-10 items-center rounded-md border border-border px-4 text-sm'
              : 'inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-background'
          }
        >
          Continue shopping
        </Link>
        {!paid ? (
          <Link
            href="/checkout"
            className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm"
          >
            Return to checkout
          </Link>
        ) : null}
      </div>
    </main>
  );
}

export function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-xl px-4 py-16">
          <p className="text-sm text-muted">Loading payment status…</p>
        </main>
      }
    >
      <SuccessBody />
    </Suspense>
  );
}
