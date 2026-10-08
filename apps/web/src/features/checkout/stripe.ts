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
    colorBackground: '#141619',
    colorText: THEME.cream,
    colorDanger: '#FF8A8A',
    colorTextSecondary: '#A3A9B1',
    fontFamily: '"Instrument Sans", system-ui, sans-serif',
    borderRadius: '6px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      backgroundColor: 'transparent',
      border: '1px solid #3A3F45',
    },
    '.Input:focus': {
      border: `1px solid ${THEME.clay}`,
      boxShadow: 'none',
    },
  },
};
