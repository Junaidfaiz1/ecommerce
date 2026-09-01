'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { PRODUCT_STATUSES, upsertAdminBundleInputSchema } from '@vorqen/types';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/shared/SectionStates';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { ADMIN_BUNDLES, UPSERT_ADMIN_BUNDLE } from '../graphql';
import { AdminHeader, AdminTable, Field, fieldClass } from '../ui';

type Bundle = {
  id: string;
  name: string;
  slug: string;
  status: string;
  bundlePrice: string | null;
  items: Array<{ sku: string; quantity: number; productName: string; variantId: string }>;
};

export function AdminBundlesPage() {
  const [items, setItems] = useState<Bundle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [variantId, setVariantId] = useState('');
  const [status, setStatus] = useState<(typeof PRODUCT_STATUSES)[number]>('DRAFT');
  const [pending, setPending] = useState(false);

  async function load() {
    const data = await graphqlRequest<{ adminBundles: Bundle[] }>(ADMIN_BUNDLES);
    setItems(data.adminBundles);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const parsed = upsertAdminBundleInputSchema.safeParse({
      name,
      slug,
      status,
      items: [{ variantId, quantity: 1 }],
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid bundle.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await graphqlRequest(UPSERT_ADMIN_BUNDLE, { input: parsed.data });
      setName('');
      setSlug('');
      setVariantId('');
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
      <AdminHeader
        title="Bundles"
        description="Bundle price is optional. Checkout still prices variants on the server."
      />
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      <form onSubmit={(e) => void onCreate(e)} className="mb-6 grid max-w-2xl gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Slug">
          <input className={fieldClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
        </Field>
        <Field label="Variant id">
          <input className={fieldClass} value={variantId} onChange={(e) => setVariantId(e.target.value)} />
        </Field>
        <Field label="Status">
          <select
            className={fieldClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof PRODUCT_STATUSES)[number])}
          >
            {PRODUCT_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Button type="submit" disabled={pending}>
          Save bundle
        </Button>
      </form>
      <AdminTable>
        <thead className="bg-surface text-[11px] text-muted uppercase">
          <tr>
            <th className="px-3 py-2">Bundle</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Items</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id} className="border-t border-border">
              <td className="px-3 py-2">
                {b.name}
                <p className="font-mono text-[10px] text-muted">{b.slug}</p>
              </td>
              <td className="px-3 py-2 text-xs">{b.status}</td>
              <td className="px-3 py-2 text-xs">
                {b.items.map((i) => `${i.quantity}× ${i.sku}`).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
