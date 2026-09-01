import { CartPage } from '@/features/cart/CartPage';
import { privatePageMetadata } from '@/server/seo';

export const metadata = privatePageMetadata(
  'Cart',
  'Review your VORQEN cart. Prices recalculated on the server.',
);

export default function CartRoute() {
  return <CartPage />;
}
