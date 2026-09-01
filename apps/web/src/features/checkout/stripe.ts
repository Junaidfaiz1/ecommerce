import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeJs(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (!key) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export const PAYMENT_ELEMENT_APPEARANCE = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#8B9CFF',
    colorBackground: '#101010',
    colorText: '#F5F5F5',
    colorDanger: '#F87171',
    colorTextSecondary: '#8A8A8A',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '6px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      backgroundColor: '#070707',
      border: '1px solid #252525',
    },
    '.Input:focus': {
      border: '1px solid #8B9CFF',
      boxShadow: 'none',
    },
  },
};
