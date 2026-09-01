'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { COUPON_TYPES, upsertAdminCouponInputSchema } from '@vorqen/types';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/shared/SectionStates';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADMIN_COUPONS, UPSERT_ADMIN_COUPON } from '../graphql';
import { AdminHeader, AdminTable, AdminEmptyState, Field, fieldClass } from '../ui';

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: string;
  isActive: boolean;
  usageCount: number;
  maxUses: number | null;
};

export function AdminCouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [type, setType] = useState<(typeof COUPON_TYPES)[number]>('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await graphqlRequest<{ adminCoupons: Coupon[] }>(ADMIN_COUPONS);
    setItems(data.adminCoupons);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const parsed = upsertAdminCouponInputSchema.safeParse({
      code,
      type,
      value: Number(value),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid coupon.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await graphqlRequest(UPSERT_ADMIN_COUPON, { input: parsed.data });
      setCode('');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (error && items.length === 0) return <ErrorState message={error} />;

  return (
    <div>
      <AdminHeader title="Coupons" description="Discount math stays on the server when the code is applied at checkout." />
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      <form onSubmit={(e) => void onCreate(e)} className="mb-6 flex max-w-2xl flex-wrap items-end gap-3">
        <Field label="Code">
          <input
            className={fieldClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="BUILD10"
          />
        </Field>
        <Field label="Type">
          <select
            className={fieldClass}
            value={type}
            onChange={(e) => setType(e.target.value as (typeof COUPON_TYPES)[number])}
          >
            {COUPON_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Value">
          <input
            className={fieldClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="10 for percent, or 25.00 off"
          />
        </Field>
        <Button type="submit" disabled={pending}>
          Save coupon
        </Button>
      </form>
      {loading && items.length === 0 ? (
        <p className="text-sm text-muted">Loading coupons…</p>
      ) : items.length === 0 ? (
        <AdminEmptyState
          title="No coupons yet"
          description="Create a code above. Checkout applies the discount on the server."
        />
      ) : (
      <AdminTable>
        <thead className="bg-surface text-[11px] text-muted uppercase">
          <tr>
            <th className="px-3 py-2">Code</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Value</th>
            <th className="px-3 py-2">Uses</th>
            <th className="px-3 py-2">Active</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="px-3 py-2 font-mono">{c.code}</td>
              <td className="px-3 py-2 text-xs">{c.type}</td>
              <td className="px-3 py-2">{c.value}</td>
              <td className="px-3 py-2">
                {c.usageCount}
                {c.maxUses ? ` / ${c.maxUses}` : ''}
              </td>
              <td className="px-3 py-2">{c.isActive ? 'yes' : 'no'}</td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
      )}
    </div>
  );
}
