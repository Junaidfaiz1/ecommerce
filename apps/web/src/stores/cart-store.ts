'use client';

import { create } from 'zustand';

/**
 * UI-only cart badge count. Totals / prices always come from the server cart query.
 */
type CartUiState = {
  itemCount: number;
  setItemCount: (count: number) => void;
};

export const useCartUiStore = create<CartUiState>((set) => ({
  itemCount: 0,
  setItemCount: (itemCount) => set({ itemCount }),
}));
