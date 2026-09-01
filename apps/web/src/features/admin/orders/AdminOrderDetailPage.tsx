'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ORDER_STATUSES, canAdminTransitionOrder, type OrderStatus } from '@vorqen/types';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/shared/SectionStates';
import { Price } from '@/components/shared/Price';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import {
  ADMIN_ORDER,
  REFUND_ADMIN_ORDER,
  UPDATE_ADMIN_ORDER_STATUS,
} from '../graphql';
import { AdminHeader, Field, fieldClass } from '../ui';

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  subtotal: string;
  discountTotal: string;
  grandTotal: string;
  couponCode: string | null;
  shipName: string;
  shipLine1: string;
  shipCity: string;
  shipPostalCode: string;
  shipCountry: string;
  paymentStatus: string;
  customerEmail: string;
  refundedTotal: string;
  items: Array<{ id: string; productName: string; sku: string; quantity: number; lineTotal: string }>;
};

export function AdminOrderDetailPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('PROCESSING');
  const [refundAmount, setRefundAmount] = useState('');
  const [restock, setRestock] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{ adminOrder: Order }>(ADMIN_ORDER, {
          id: orderId,
        });
        if (cancelled) return;
        setOrder(data.adminOrder);
        setRefundAmount(
          (
            Number(data.adminOrder.grandTotal) -
            Number(data.adminOrder.refundedTotal)
          ).toFixed(2),
        );
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function refresh() {
    const data = await graphqlRequest<{ adminOrder: Order }>(ADMIN_ORDER, {
      id: orderId,
    });
    setOrder(data.adminOrder);
    setRefundAmount(
      (
        Number(data.adminOrder.grandTotal) - Number(data.adminOrder.refundedTotal)
      ).toFixed(2),
    );
  }

  async function onStatus(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    setPending(true);
    setError(null);
    try {
      await graphqlRequest(UPDATE_ADMIN_ORDER_STATUS, {
        input: { id: order.id, status: nextStatus },
      });
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onRefund(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    setPending(true);
    setError(null);
    try {
      await graphqlRequest(REFUND_ADMIN_ORDER, {
        input: {
          orderId: order.id,
          amount: refundAmount,
          restock,
        },
      });
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (error && !order) return <ErrorState message={error} />;
  if (!order) return <p className="text-sm text-muted">Loading order…</p>;

  const allowed = ORDER_STATUSES.filter((s) =>
    canAdminTransitionOrder(order.status, s),
  );

  return (
    <div>
      <AdminHeader
        title={order.orderNumber}
        description={`${order.customerEmail} · payment ${order.paymentStatus}`}
      />
      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      <p className="font-mono text-xs text-muted uppercase">{order.status}</p>
      <ul className="mt-6 space-y-2">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between border border-border px-3 py-2 text-sm">
            <span>
              {item.quantity}× {item.productName}{' '}
              <span className="font-mono text-[10px] text-muted">{item.sku}</span>
            </span>
            <Price amount={item.lineTotal} currency={order.currency} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        Total <Price amount={order.grandTotal} currency={order.currency} /> · Refunded{' '}
        <Price amount={order.refundedTotal} currency={order.currency} />
      </p>
      <p className="mt-4 text-sm text-muted">
        {order.shipName}, {order.shipLine1}, {order.shipCity} {order.shipPostalCode}{' '}
        {order.shipCountry}
      </p>

      {allowed.length > 0 ? (
        <form onSubmit={(e) => void onStatus(e)} className="mt-8 flex max-w-sm items-end gap-3">
          <Field label="Fulfillment status">
            <select
              className={fieldClass}
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
            >
              {allowed.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" disabled={pending}>
            Update
          </Button>
        </form>
      ) : null}

      {order.paymentStatus === 'SUCCEEDED' ||
      order.paymentStatus === 'PARTIALLY_REFUNDED' ? (
        <form onSubmit={(e) => void onRefund(e)} className="mt-8 max-w-sm space-y-3">
          <Field label="Refund amount">
            <input
              className={fieldClass}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={restock}
              onChange={(e) => setRestock(e.target.checked)}
            />
            Restock on full refund
          </label>
          <Button type="submit" variant="outline" disabled={pending}>
            Issue Stripe refund
          </Button>
        </form>
      ) : null}
    </div>
  );
}
