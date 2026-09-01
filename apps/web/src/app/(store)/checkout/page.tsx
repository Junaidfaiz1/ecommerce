import { CheckoutPage } from '@/features/checkout/CheckoutPage';
import { privatePageMetadata } from '@/server/seo';

export const metadata = privatePageMetadata(
  'Checkout',
  'Review shipping and pay securely with Stripe.',
);

export default function CheckoutRoute() {
  return <CheckoutPage />;
}
