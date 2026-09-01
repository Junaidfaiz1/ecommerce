import type { ComponentSlot } from '@vorqen/types';
import type { ProductType } from '@vorqen/types';
import type { ProceduralKind } from '@vorqen/types';

export type ViewerMode = 'hero' | 'builder' | 'product';

export type FilledSlots = Partial<Record<ComponentSlot, boolean>>;

export const SLOT_COLORS: Record<ComponentSlot, string> = {
  CASE: '#2a2e36',
  MOTHERBOARD: '#1a3d2a',
  CPU: '#c4a574',
  COOLER: '#5a6578',
  GPU: '#3d4a6b',
  RAM: '#4a6b8a',
  STORAGE: '#3a3a42',
  PSU: '#2c3038',
};

/** Rest positions (local) for assembled chassis parts. */
export const SLOT_REST: Record<ComponentSlot, [number, number, number]> = {
  CASE: [0, 0, 0],
  MOTHERBOARD: [-0.12, 0.05, -0.05],
  CPU: [-0.12, 0.22, -0.02],
  COOLER: [-0.12, 0.42, -0.02],
  GPU: [0.05, -0.05, 0.18],
  RAM: [0.08, 0.18, -0.05],
  STORAGE: [0.22, -0.25, 0.05],
  PSU: [0, -0.55, 0.05],
};

/** Exploded offsets added to rest when explode = 1. */
export const SLOT_EXPLODE: Record<ComponentSlot, [number, number, number]> = {
  CASE: [0, 0, -0.35],
  MOTHERBOARD: [-0.55, 0.1, -0.2],
  CPU: [-0.35, 0.55, 0.15],
  COOLER: [-0.2, 0.85, 0.25],
  GPU: [0.55, -0.15, 0.55],
  RAM: [0.65, 0.35, -0.15],
  STORAGE: [0.7, -0.45, 0.25],
  PSU: [0, -0.95, 0.35],
};

export function productTypeToKind(type: ProductType): ProceduralKind {
  switch (type) {
    case 'CPU':
      return 'cpu';
    case 'GPU':
      return 'gpu';
    case 'MOTHERBOARD':
      return 'motherboard';
    case 'RAM':
      return 'ram';
    case 'STORAGE':
      return 'storage';
    case 'PSU':
      return 'psu';
    case 'CASE':
      return 'case';
    case 'COOLER':
      return 'cooler';
    case 'ACCESSORY':
      return 'accessory';
    default:
      return 'other';
  }
}

export function kindToSlot(kind: ProceduralKind): ComponentSlot | null {
  switch (kind) {
    case 'cpu':
      return 'CPU';
    case 'gpu':
      return 'GPU';
    case 'motherboard':
      return 'MOTHERBOARD';
    case 'ram':
      return 'RAM';
    case 'storage':
      return 'STORAGE';
    case 'psu':
      return 'PSU';
    case 'case':
      return 'CASE';
    case 'cooler':
      return 'COOLER';
    default:
      return null;
  }
}

export function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}
