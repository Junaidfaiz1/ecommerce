'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { COMPARE_MAX_ITEMS } from '@vorqen/types';

type CompareState = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  setIds: (ids: string[]) => void;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const current = get().ids;
        if (current.includes(id)) {
          set({ ids: current.filter((x) => x !== id) });
          return;
        }
        if (current.length >= COMPARE_MAX_ITEMS) return;
        set({ ids: [...current, id] });
      },
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      clear: () => set({ ids: [] }),
      setIds: (ids) =>
        set({
          ids: [...new Set(ids)].slice(0, COMPARE_MAX_ITEMS),
        }),
    }),
    { name: 'vorqen-compare' },
  ),
);
