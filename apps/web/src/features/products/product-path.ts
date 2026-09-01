import type { ProductType } from '@vorqen/types';

/** URL path segment ↔ product type for PDPs (`/gpu/[slug]`, …). */
export const PRODUCT_TYPE_PATHS = {
  cpu: 'CPU',
  gpu: 'GPU',
  motherboard: 'MOTHERBOARD',
  ram: 'RAM',
  storage: 'STORAGE',
  psu: 'PSU',
  case: 'CASE',
  cooler: 'COOLER',
  accessory: 'ACCESSORY',
} as const satisfies Record<string, ProductType>;

export type ProductTypePath = keyof typeof PRODUCT_TYPE_PATHS;

export function isProductTypePath(value: string): value is ProductTypePath {
  return value in PRODUCT_TYPE_PATHS;
}

export function productTypeToPath(type: ProductType): string {
  const entry = Object.entries(PRODUCT_TYPE_PATHS).find(([, t]) => t === type);
  return entry?.[0] ?? 'products';
}

export function productHref(product: { type: ProductType; slug: string }): string {
  const segment = productTypeToPath(product.type);
  if (segment === 'products') return `/products/${product.slug}`;
  return `/${segment}/${product.slug}`;
}

export function formatMoney(amount: string, currency = 'USD'): string {
  const value = Number(amount);
  if (Number.isNaN(value)) return amount;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${amount}`;
  }
}

/** One-line highlight from typed hardware specs for cards / compare. */
export function keySpecLabel(product: {
  type: ProductType;
  cpu?: { cores: number; threads: number; socket: string } | null;
  gpu?: { vramGb: number; chipset: string } | null;
  motherboard?: { socket: string; chipset: string } | null;
  ram?: { capacityGb: number; speedMhz: number; memoryType: string } | null;
  storage?: { capacityGb: number; interface: string } | null;
  psu?: { wattage: number; efficiency: string } | null;
  pcCase?: { maxGpuLengthMm: number; supportedFormFactors: string[] } | null;
  cooler?: { coolerType: string; tdpRatingWatts: number | null } | null;
}): string | null {
  switch (product.type) {
    case 'CPU':
      return product.cpu
        ? `${product.cpu.cores}C/${product.cpu.threads}T · ${product.cpu.socket}`
        : null;
    case 'GPU':
      return product.gpu
        ? `${product.gpu.vramGb} GB · ${product.gpu.chipset}`
        : null;
    case 'MOTHERBOARD':
      return product.motherboard
        ? `${product.motherboard.socket} · ${product.motherboard.chipset}`
        : null;
    case 'RAM':
      return product.ram
        ? `${product.ram.capacityGb} GB ${product.ram.memoryType} · ${product.ram.speedMhz}`
        : null;
    case 'STORAGE':
      return product.storage
        ? `${product.storage.capacityGb} GB · ${product.storage.interface}`
        : null;
    case 'PSU':
      return product.psu
        ? `${product.psu.wattage} W · ${product.psu.efficiency}`
        : null;
    case 'CASE':
      return product.pcCase
        ? `GPU ≤ ${product.pcCase.maxGpuLengthMm} mm`
        : null;
    case 'COOLER':
      return product.cooler
        ? `${product.cooler.coolerType}${
            product.cooler.tdpRatingWatts
              ? ` · ${product.cooler.tdpRatingWatts} W`
              : ''
          }`
        : null;
    default:
      return null;
  }
}
