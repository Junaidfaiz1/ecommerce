import type { ComponentSlot } from '@vorqen/types';

/** Category catalog photos shown when a builder slot is empty. */
export const SLOT_PLACEHOLDER_IMAGE: Record<ComponentSlot, string> = {
  CPU: '/assets/catalog/cpu.jpg',
  GPU: '/assets/catalog/gpu.jpg',
  MOTHERBOARD: '/assets/catalog/motherboard.jpg',
  RAM: '/assets/catalog/ram.jpg',
  STORAGE: '/assets/catalog/storage.jpg',
  PSU: '/assets/catalog/psu.jpg',
  CASE: '/assets/catalog/case.jpg',
  COOLER: '/assets/catalog/cooler.jpg',
};
