'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ADDRESS_TYPES,
  createAddressInputSchema,
  type AddressType,
} from '@vorqen/types';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/shared/SectionStates';
import { ListSkeleton } from '@/components/shared/Skeleton';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';

const ADDRESSES_QUERY = `
  query MyAddresses {
    myAddresses {
      id
      label
      line1
      line2
      city
      state
      postalCode
      country
      phone
      type
      isDefault
    }
  }
`;

const CREATE_ADDRESS = `
  mutation CreateAddress($input: CreateAddressInput!) {
    createAddress(input: $input) {
      id
    }
  }
`;

const DELETE_ADDRESS = `
  mutation DeleteAddress($input: DeleteAddressInput!) {
    deleteAddress(input: $input) { ok }
  }
`;

type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  type: AddressType;
  isDefault: boolean;
};

const emptyForm = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
  type: 'SHIPPING' as AddressType,
  isDefault: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  async function load() {
    const data = await graphqlRequest<{ myAddresses: Address[] }>(
      ADDRESSES_QUERY,
    );
    setItems(data.myAddresses);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          const msg = getErrorMessage(err);
          if (msg.toLowerCase().includes('auth') || msg.includes('Sign in')) {
            router.replace('/login?next=/account/addresses');
            return;
          }
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = createAddressInputSchema.safeParse({
      label: form.label.trim() || null,
      line1: form.line1,
      line2: form.line2.trim() || null,
      city: form.city,
      state: form.state.trim() || null,
      postalCode: form.postalCode,
      country: form.country,
      phone: form.phone.trim() || null,
      type: form.type,
      isDefault: form.isDefault,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the address.');
      return;
    }
    setPending(true);
    try {
      await graphqlRequest(CREATE_ADDRESS, { input: parsed.data });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      await graphqlRequest(DELETE_ADDRESS, { input: { id } });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return <ListSkeleton rows={3} label="Loading addresses" />;
  }

  if (error && items.length === 0) {
    return (
      <ErrorState
        message={error}
        action={
          <Link
            href="/login?next=/account/addresses"
            className="text-sm text-accent"
          >
            Sign in
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl tracking-tight">Addresses</h1>
      <p className="mt-2 text-sm text-muted">
        Shipping and billing addresses for checkout.
      </p>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <div className="mt-8 space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="No addresses yet"
            description="Add a shipping address to speed up future checkout."
          />
        ) : (
          items.map((addr) => (
            <article
              key={addr.id}
              className="flex flex-col gap-2 border border-border bg-surface/40 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {addr.label ?? 'Address'}
                  {addr.isDefault ? (
                    <span className="ml-2 font-mono text-[10px] text-accent uppercase">
                      Default
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-muted">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ''}
                </p>
                <p className="text-muted">
                  {addr.city}
                  {addr.state ? `, ${addr.state}` : ''} {addr.postalCode}
                </p>
                <p className="font-mono text-xs text-muted">
                  {addr.country} · {addr.type}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDelete(addr.id)}
              >
                Remove
              </Button>
            </article>
          ))
        )}
      </div>

      <form
        onSubmit={onCreate}
        className="mt-10 grid max-w-xl gap-3 border border-border bg-surface/30 p-4"
      >
        <h2 className="font-display text-xl tracking-tight">Add address</h2>
        {(
          [
            ['label', 'Label', 'form-text'],
            ['line1', 'Line 1', 'address-line1'],
            ['line2', 'Line 2', 'address-line2'],
            ['city', 'City', 'address-level2'],
            ['state', 'State', 'address-level1'],
            ['postalCode', 'Postal code', 'postal-code'],
            ['country', 'Country (ISO)', 'country'],
            ['phone', 'Phone', 'tel'],
          ] as const
        ).map(([key, label, auto]) => (
          <label key={key} className="flex flex-col gap-1.5 text-xs text-muted">
            {label}
            <input
              autoComplete={auto}
              value={form[key]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [key]: e.target.value }))
              }
              required={key === 'line1' || key === 'city' || key === 'postalCode' || key === 'country'}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
        ))}
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Type
          <select
            value={form.type}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                type: e.target.value as AddressType,
              }))
            }
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            {ADDRESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isDefault: e.target.checked }))
            }
          />
          Default address
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save address'}
        </Button>
      </form>
    </div>
  );
}
