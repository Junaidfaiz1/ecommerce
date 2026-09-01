'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { createAddressInputSchema } from '@vorqen/types';
import { Price } from '@/components/shared/Price';
import { EmptyState, ErrorState } from '@/components/shared/SectionStates';
import { Button } from '@/components/ui/button';
import { graphqlRequest } from '@/lib/graphql-client';
import { getErrorMessage } from '@/lib/errors';
import { CheckoutPaymentForm } from './CheckoutPaymentForm';
import {
  CHECKOUT_CART_QUERY,
  CREATE_CHECKOUT_SESSION,
  type CheckoutAddress,
  type CheckoutCart,
  type CheckoutPaymentData,
} from './graphql';
import { getStripeJs, PAYMENT_ELEMENT_APPEARANCE } from './stripe';

const emptyAddress = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
};

export function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CheckoutCart | null | undefined>(undefined);
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(emptyAddress);
  const [saveAddress, setSaveAddress] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [payment, setPayment] = useState<CheckoutPaymentData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{
          me: { id: string } | null;
          cart: CheckoutCart | null;
          myAddresses: CheckoutAddress[];
        }>(CHECKOUT_CART_QUERY);
        if (cancelled) return;
        if (!data.me) {
          router.replace('/login?next=/checkout');
          return;
        }
        setCart(data.cart);
        setAddresses(data.myAddresses);
        const def =
          data.myAddresses.find((a) => a.isDefault) ?? data.myAddresses[0];
        setSelectedId(def?.id ?? 'new');
      } catch (e) {
        if (cancelled) return;
        const msg = getErrorMessage(e);
        if (msg.toLowerCase().includes('sign in')) {
          router.replace('/login?next=/checkout');
          return;
        }
        setError(msg);
        setCart(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const blockedLine = useMemo(
    () => cart?.items.find((line) => line.quantity > line.availableQuantity),
    [cart],
  );

  async function onContinue(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!cart || cart.items.length === 0 || payment) return;

    let input: Record<string, unknown>;
    if (selectedId && selectedId !== 'new') {
      input = { shippingAddressId: selectedId };
    } else {
      const parsed = createAddressInputSchema.safeParse({
        line1: form.line1,
        line2: form.line2.trim() || null,
        city: form.city,
        state: form.state.trim() || null,
        postalCode: form.postalCode,
        country: form.country,
        phone: form.phone.trim() || null,
        type: 'SHIPPING',
        isDefault: addresses.length === 0,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Check the shipping address.');
        return;
      }
      input = { shippingAddress: parsed.data, saveAddress };
    }

    setPending(true);
    try {
      const data = await graphqlRequest<{
        createCheckoutSession: CheckoutPaymentData;
      }>(CREATE_CHECKOUT_SESSION, { input });
      setPayment(data.createCheckoutSession);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (cart === undefined && !error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <p className="text-sm text-muted">Loading checkout…</p>
      </main>
    );
  }

  if (error && !cart) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <ErrorState message={error} />
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <EmptyState
          title="Your cart is empty"
          description="Add hardware before starting checkout."
          action={
            <Link
              href="/shop"
              className="glass-btn inline-flex h-10 items-center rounded-2xl px-4 text-sm font-medium"
            >
              Shop hardware
            </Link>
          }
        />
      </main>
    );
  }

  const paying = Boolean(payment);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <header className="mb-10">
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
          Checkout
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Shipping & payment
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Totals are recalculated on the server. Card details stay in Stripe.
          Paid status is confirmed by webhook — not this page.
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
        <section className="space-y-8">
          <form onSubmit={(e) => void onContinue(e)} className="space-y-6">
            <h2 className="font-display text-xl tracking-tight">
              Shipping address
            </h2>
            <fieldset className="space-y-3" disabled={pending || paying}>
              <legend className="sr-only">Choose a shipping address</legend>
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className="flex cursor-pointer gap-3 rounded-2xl glass-panel p-4 has-[:checked]:ring-2 has-[:checked]:ring-accent"
                >
                  <input
                    type="radio"
                    name="shipping-address"
                    className="mt-1"
                    checked={selectedId === addr.id}
                    onChange={() => setSelectedId(addr.id)}
                  />
                  <span className="text-sm">
                    <span className="font-medium">
                      {addr.label ?? 'Address'}
                      {addr.isDefault ? (
                        <span className="ml-2 font-mono text-[10px] text-accent uppercase">
                          Default
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-muted">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''}
                    </span>
                    <span className="block text-muted">
                      {addr.city}
                      {addr.state ? `, ${addr.state}` : ''} {addr.postalCode}{' '}
                      {addr.country}
                    </span>
                  </span>
                </label>
              ))}
              <label className="flex cursor-pointer gap-3 rounded-2xl glass-panel p-4 has-[:checked]:ring-2 has-[:checked]:ring-accent">
                <input
                  type="radio"
                  name="shipping-address"
                  className="mt-1"
                  checked={selectedId === 'new'}
                  onChange={() => setSelectedId('new')}
                />
                <span className="text-sm font-medium">Use a new address</span>
              </label>
            </fieldset>

            {selectedId === 'new' ? (
              <div className="grid gap-3 rounded-2xl glass-panel p-4">
                {(
                  [
                    ['line1', 'Line 1', 'address-line1', true],
                    ['line2', 'Line 2', 'address-line2', false],
                    ['city', 'City', 'address-level2', true],
                    ['state', 'State', 'address-level1', false],
                    ['postalCode', 'Postal code', 'postal-code', true],
                    ['country', 'Country (ISO)', 'country', true],
                    ['phone', 'Phone', 'tel', false],
                  ] as const
                ).map(([key, label, auto, required]) => (
                  <label
                    key={key}
                    className="flex flex-col gap-1.5 text-xs text-muted"
                  >
                    {label}
                    <input
                      autoComplete={auto}
                      required={required}
                      disabled={pending || paying}
                      value={form[key]}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="glass-input h-10 rounded-2xl px-3 text-sm text-foreground outline-none focus:border-accent"
                    />
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    disabled={pending || paying}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                  />
                  Save this address to my account
                </label>
              </div>
            ) : null}

            {!paying ? (
              <Button
                type="submit"
                disabled={pending || Boolean(blockedLine)}
              >
                {pending ? 'Preparing payment…' : 'Continue to payment'}
              </Button>
            ) : null}
          </form>

          {payment ? (
            <div className="rounded-3xl glass-panel p-6">
              <h2 className="font-display text-xl tracking-tight">Payment</h2>
              <p className="mt-1 font-mono text-[11px] text-muted">
                Order {payment.orderNumber}
              </p>
              <div className="mt-6">
                {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ? (
                  <Elements
                    stripe={getStripeJs()}
                    options={{
                      clientSecret: payment.clientSecret,
                      appearance: PAYMENT_ELEMENT_APPEARANCE,
                    }}
                  >
                    <CheckoutPaymentForm
                      orderId={payment.orderId}
                      disabled={Boolean(blockedLine)}
                    />
                  </Elements>
                ) : (
                  <p className="text-sm text-red-400" role="alert">
                    Stripe publishable key is not configured.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <aside className="h-fit rounded-3xl glass-panel p-6">
          <h2 className="font-display text-xl tracking-tight">Order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {cart.items.map((line) => (
              <li key={line.id} className="flex justify-between gap-3">
                <span className="text-muted">
                  {line.quantity}× {line.product.name}
                </span>
                <Price amount={line.lineTotal} currency={line.currency} />
              </li>
            ))}
          </ul>
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
            {cart.totals.couponCode && cart.totals.couponValid ? (
              <p className="font-mono text-[11px] text-accent">
                {cart.totals.couponCode}
              </p>
            ) : null}
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

          {blockedLine ? (
            <p className="mt-4 text-xs text-red-400" role="alert">
              {blockedLine.product.name} does not have enough stock. Update your
              cart before paying.
            </p>
          ) : null}

          <p className="mt-6 text-center text-xs">
            <Link href="/cart" className="text-muted hover:text-foreground">
              Back to cart
            </Link>
          </p>
        </aside>
      </div>
    </main>
  );
}
