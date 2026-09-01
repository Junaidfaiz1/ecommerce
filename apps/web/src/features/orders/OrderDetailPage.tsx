'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/shared/SectionStates';
import { Price } from '@/components/shared/Price';
import { graphqlRequest, GraphQLClientError } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import {
  CANCEL_PENDING_ORDER,
  ORDER_QUERY,
  type OrderDetail,
} from './graphql';
import { formatOrderStatus, formatPaymentStatus } from './status';

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{ order: OrderDetail }>(ORDER_QUERY, {
          id: orderId,
        });
        if (!cancelled) setOrder(data.order);
      } catch (err) {
        if (cancelled) return;
        if (
          err instanceof GraphQLClientError &&
          err.code === 'UNAUTHENTICATED'
        ) {
          router.replace(`/login?next=/account/orders/${orderId}`);
          return;
        }
        setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  async function onCancel() {
    if (!order || order.status !== 'PENDING_PAYMENT' || cancelling) return;
    setCancelling(true);
    setError(null);
    try {
      await graphqlRequest(CANCEL_PENDING_ORDER, { id: order.id });
      const data = await graphqlRequest<{ order: OrderDetail }>(ORDER_QUERY, {
        id: order.id,
      });
      setOrder(data.order);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading order…</p>;
  }

  if (error && !order) {
    return (
      <ErrorState
        message={error}
        action={
          <Link href="/account/orders" className="text-sm text-accent">
            Back to orders
          </Link>
        }
      />
    );
  }

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        action={
          <Link href="/account/orders" className="text-sm text-accent">
            Back to orders
          </Link>
        }
      />
    );
  }

  const shipping = [
    order.shipName,
    order.shipLine1,
    order.shipLine2,
    [order.shipCity, order.shipState, order.shipPostalCode]
      .filter(Boolean)
      .join(', '),
    order.shipCountry,
    order.shipPhone,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div>
      <p className="text-sm">
        <Link href="/account/orders" className="text-muted hover:text-accent">
          ← Orders
        </Link>
      </p>
      <h1 className="mt-4 font-display text-3xl tracking-tight">
        {order.orderNumber}
      </h1>
      <p className="mt-2 font-mono text-[11px] text-muted uppercase">
        {formatOrderStatus(order.status)} · Payment{' '}
        {formatPaymentStatus(order.paymentStatus)} ·{' '}
        {new Date(order.createdAt).toLocaleString()}
      </p>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      {order.status === 'PENDING_PAYMENT' ? (
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            disabled={cancelling}
            onClick={() => void onCancel()}
          >
            {cancelling ? 'Cancelling…' : 'Cancel unpaid order'}
          </Button>
        </div>
      ) : null}

      <ul className="mt-8 space-y-3">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 border border-border bg-surface/40 p-4"
          >
            <div>
              <p className="text-sm">{item.productName}</p>
              <p className="mt-1 font-mono text-[10px] text-muted uppercase">
                {item.sku} · Qty {item.quantity}
              </p>
            </div>
            <Price amount={item.lineTotal} currency={order.currency} />
          </li>
        ))}
      </ul>

      <dl className="mt-8 space-y-2 border border-border bg-surface p-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Subtotal</dt>
          <dd>
            <Price amount={order.subtotal} currency={order.currency} />
          </dd>
        </div>
        {Number(order.discountTotal) > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">
              Discount{order.couponCode ? ` (${order.couponCode})` : ''}
            </dt>
            <dd>
              −
              <Price amount={order.discountTotal} currency={order.currency} />
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Shipping</dt>
          <dd>
            <Price amount={order.shippingTotal} currency={order.currency} />
          </dd>
        </div>
        <div className="flex justify-between gap-4 font-medium">
          <dt>Total</dt>
          <dd>
            <Price amount={order.grandTotal} currency={order.currency} />
          </dd>
        </div>
      </dl>

      <section className="mt-8">
        <h2 className="font-display text-xl tracking-tight">Shipping</h2>
        <pre className="mt-3 font-sans text-sm whitespace-pre-wrap text-muted">
          {shipping}
        </pre>
      </section>
    </div>
  );
}
