import { CheckoutCancelPage } from '@/features/checkout/CheckoutCancelPage';
import { privatePageMetadata } from '@/server/seo';

export const metadata = privatePageMetadata(
  'Payment cancelled',
  'Stripe checkout was cancelled. Your cart is unchanged.',
);

export default function CheckoutCancelRoute() {
  return <CheckoutCancelPage />;
}
