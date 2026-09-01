import type {
  Brand,
  Category,
  Cooler,
  Cpu,
  Gpu,
  Motherboard,
  PcCase,
  Product,
  ProductImage,
  ProductVariant,
  Psu,
  Ram,
  StorageDrive,
  Inventory,
} from '@/generated/prisma/client';
import { toPublicCatalogImageUrl } from './image-url';

type DecimalLike = { toFixed: (digits?: number) => string; toNumber: () => number };

function decimalToString(value: DecimalLike | number | string): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toFixed(2);
  return value.toFixed(2);
}

function decimalToNumber(value: DecimalLike | number | string): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return value.toNumber();
}

export type VariantWithInventory = ProductVariant & {
  inventory: Inventory | null;
};

export type ProductWithRelations = Product & {
  brand: Brand;
  category: Category;
  images: ProductImage[];
  variants: VariantWithInventory[];
  cpu: Cpu | null;
  gpu: Gpu | null;
  motherboard: Motherboard | null;
  ram: Ram | null;
  storage: StorageDrive | null;
  psu: Psu | null;
  pcCase: PcCase | null;
  cooler: Cooler | null;
};

export function mapBrand(brand: Brand) {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl,
    websiteUrl: brand.websiteUrl,
    description: brand.description,
  };
}

export function mapCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    parentId: category.parentId,
    sortOrder: category.sortOrder,
  };
}

export function mapImage(image: ProductImage) {
  return {
    id: image.id,
    url: toPublicCatalogImageUrl(image.url),
    alt: image.alt,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
  };
}

export function mapVariant(variant: VariantWithInventory) {
  const onHand = variant.inventory?.quantityOnHand ?? 0;
  const reserved = variant.inventory?.quantityReserved ?? 0;
  const availableQuantity = Math.max(0, onHand - reserved);

  return {
    id: variant.id,
    sku: variant.sku,
    name: variant.name,
    price: decimalToString(variant.price),
    compareAtPrice: variant.compareAtPrice
      ? decimalToString(variant.compareAtPrice)
      : null,
    currency: variant.currency,
    isDefault: variant.isDefault,
    isActive: variant.isActive,
    weightGrams: variant.weightGrams,
    availableQuantity,
    inStock: availableQuantity > 0,
    quantityOnHand: onHand,
    quantityReserved: reserved,
    lowStockThreshold: variant.inventory?.lowStockThreshold ?? 5,
  };
}

export function mapCpu(cpu: Cpu) {
  return {
    socket: cpu.socket,
    cores: cpu.cores,
    threads: cpu.threads,
    baseClockGhz: decimalToNumber(cpu.baseClockGhz),
    boostClockGhz: decimalToNumber(cpu.boostClockGhz),
    tdpWatts: cpu.tdpWatts,
    memoryType: cpu.memoryType,
    maxMemoryGhz: cpu.maxMemoryGhz,
    hasIntegratedGpu: cpu.hasIntegratedGpu,
  };
}

export function mapGpu(gpu: Gpu) {
  return {
    chipset: gpu.chipset,
    lengthMm: gpu.lengthMm,
    slotWidth: decimalToNumber(gpu.slotWidth),
    tdpWatts: gpu.tdpWatts,
    recommendedPsuWatts: gpu.recommendedPsuWatts,
    vramGb: gpu.vramGb,
    powerConnectors: gpu.powerConnectors,
    interfaceBus: gpu.interfaceBus,
  };
}

export function mapMotherboard(mb: Motherboard) {
  return {
    socket: mb.socket,
    chipset: mb.chipset,
    formFactor: mb.formFactor,
    memoryType: mb.memoryType,
    memorySlots: mb.memorySlots,
    maxMemoryGb: mb.maxMemoryGb,
    maxMemorySpeedMhz: mb.maxMemorySpeedMhz,
    m2Slots: mb.m2Slots,
    sataPorts: mb.sataPorts,
    wifi: mb.wifi,
  };
}

export function mapRam(ram: Ram) {
  return {
    memoryType: ram.memoryType,
    speedMhz: ram.speedMhz,
    capacityGb: ram.capacityGb,
    modules: ram.modules,
    voltage: ram.voltage ? decimalToNumber(ram.voltage) : null,
  };
}

export function mapStorage(storage: StorageDrive) {
  return {
    interface: storage.interface,
    capacityGb: storage.capacityGb,
    formFactor: storage.formFactor,
    readMbps: storage.readMbps,
    writeMbps: storage.writeMbps,
  };
}

export function mapPsu(psu: Psu) {
  return {
    wattage: psu.wattage,
    formFactor: psu.formFactor,
    efficiency: psu.efficiency,
    modular: psu.modular,
    lengthMm: psu.lengthMm,
  };
}

export function mapPcCase(pcCase: PcCase) {
  return {
    supportedFormFactors: pcCase.supportedFormFactors,
    maxGpuLengthMm: pcCase.maxGpuLengthMm,
    maxCoolerHeightMm: pcCase.maxCoolerHeightMm,
    psuFormFactor: pcCase.psuFormFactor,
    maxRadiatorMm: pcCase.maxRadiatorMm,
    includedFans: pcCase.includedFans,
  };
}

export function mapCooler(cooler: Cooler) {
  return {
    coolerType: cooler.coolerType,
    supportedSockets: cooler.supportedSockets,
    heightMm: cooler.heightMm,
    radiatorMm: cooler.radiatorMm,
    tdpRatingWatts: cooler.tdpRatingWatts,
  };
}

export function mapProduct(
  product: ProductWithRelations,
  opts?: { includeInactiveVariants?: boolean },
) {
  const variants = (
    opts?.includeInactiveVariants
      ? product.variants
      : product.variants.filter((v) => v.isActive)
  ).map(mapVariant);
  const defaultVariant =
    variants.find((v) => v.isDefault) ?? variants[0] ?? null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    type: product.type,
    status: product.status,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    brand: mapBrand(product.brand),
    category: mapCategory(product.category),
    images: [...product.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapImage),
    variants,
    defaultVariant,
    cpu: product.cpu ? mapCpu(product.cpu) : null,
    gpu: product.gpu ? mapGpu(product.gpu) : null,
    motherboard: product.motherboard ? mapMotherboard(product.motherboard) : null,
    ram: product.ram ? mapRam(product.ram) : null,
    storage: product.storage ? mapStorage(product.storage) : null,
    psu: product.psu ? mapPsu(product.psu) : null,
    pcCase: product.pcCase ? mapPcCase(product.pcCase) : null,
    cooler: product.cooler ? mapCooler(product.cooler) : null,
  };
}

export type CatalogProduct = ReturnType<typeof mapProduct>;
export type CatalogBrand = ReturnType<typeof mapBrand>;
export type CatalogCategory = ReturnType<typeof mapCategory>;
