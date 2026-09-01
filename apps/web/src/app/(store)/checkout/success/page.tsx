import { CheckoutSuccessPage } from '@/features/checkout/CheckoutSuccessPage';
import { privatePageMetadata } from '@/server/seo';

export const metadata = privatePageMetadata(
  'Payment status',
  'VORQEN checkout confirmation. Paid only after Stripe webhook.',
);

export default function CheckoutSuccessRoute() {
  return <CheckoutSuccessPage />;
}
