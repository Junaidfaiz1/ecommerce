'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

type Props = {
  orderId: string;
  disabled?: boolean;
};

export function CheckoutPaymentForm({ orderId, disabled }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || disabled) return;

    setPending(true);
    setError(null);

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
      window.location.origin;

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${origin}/checkout/success?order=${orderId}`,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setError(
        result.error.message ?? 'Payment could not be completed. Try again.',
      );
      setPending(false);
      return;
    }

    // Client success is not paid. Webhook is the source of truth.
    router.push(`/checkout/success?order=${orderId}`);
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        disabled={pending || disabled || !stripe || !elements}
      >
        {pending ? 'Processing…' : 'Pay now'}
      </Button>
      <p className="text-center font-mono text-[10px] text-muted">
        Paid status is confirmed by Stripe webhook, not this button.
      </p>
    </form>
  );
}
