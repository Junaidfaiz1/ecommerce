'use client';

import { useCartUiStore } from '@/stores/cart-store';
import type { CartData } from './graphql';

export function syncCartUi(cart: CartData | null | undefined): void {
  useCartUiStore.getState().setItemCount(cart?.totals.itemCount ?? 0);
}
