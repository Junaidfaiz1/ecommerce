import { WishlistPage } from '@/features/wishlist/WishlistPage';
import { privatePageMetadata } from '@/server/seo';

export const metadata = privatePageMetadata(
  'Wishlist',
  'Saved hardware for your next VORQEN build.',
);

export default function WishlistRoute() {
  return <WishlistPage />;
}
