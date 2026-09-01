import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { THEME } from '@/theme/palette';

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
    colorPrimary: THEME.clay,
    colorBackground: '#12162C',
    colorText: THEME.cream,
    colorDanger: '#FF8A8A',
    colorTextSecondary: THEME.sage,
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '16px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      backgroundColor: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.16)',
    },
    '.Input:focus': {
      border: `1px solid ${THEME.clay}`,
      boxShadow: 'none',
    },
  },
};
