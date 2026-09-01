import type {
  CheckCompatibilityInput,
  CompatibilityResult,
  ComponentSlot,
} from '@vorqen/types';
import type { Prisma, PrismaClient, ProductType } from '@/generated/prisma/client';
import { NotFoundError, ValidationError } from '../common/errors';
import { evaluateCompatibility } from './engine';
import type {
  CaseParts,
  CoolerParts,
  CpuParts,
  GpuParts,
  MotherboardParts,
  PsuParts,
  RamParts,
  ResolvedBuild,
  StorageParts,
} from './parts';

const SLOT_TO_PRODUCT_TYPE: Record<ComponentSlot, ProductType> = {
  CPU: 'CPU',
  GPU: 'GPU',
  MOTHERBOARD: 'MOTHERBOARD',
  RAM: 'RAM',
  STORAGE: 'STORAGE',
  PSU: 'PSU',
  CASE: 'CASE',
  COOLER: 'COOLER',
};

const productInclude = {
  cpu: true,
  gpu: true,
  motherboard: true,
  ram: true,
  storage: true,
  psu: true,
  pcCase: true,
  cooler: true,
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function assertSlotMatchesType(
  slot: ComponentSlot,
  product: { id: string; name: string; type: ProductType },
): void {
  const expected = SLOT_TO_PRODUCT_TYPE[slot];
  if (product.type !== expected) {
    throw new ValidationError(
      `Product "${product.name}" is type ${product.type} but slot ${slot} requires ${expected}.`,
      { productId: `Expected ${expected} for slot ${slot}` },
    );
  }
}

function toCpu(product: ProductRow): CpuParts {
  if (!product.cpu) {
    throw new ValidationError(`Product "${product.name}" is missing CPU specs.`);
  }
  return {
    productId: product.id,
    name: product.name,
    socket: product.cpu.socket,
    tdpWatts: product.cpu.tdpWatts,
    memoryType: product.cpu.memoryType,
  };
}

function toMotherboard(product: ProductRow): MotherboardParts {
  if (!product.motherboard) {
    throw new ValidationError(
      `Product "${product.name}" is missing motherboard specs.`,
    );
  }
  return {
    productId: product.id,
    name: product.name,
    socket: product.motherboard.socket,
    formFactor: product.motherboard.formFactor,
    memoryType: product.motherboard.memoryType,
    memorySlots: product.motherboard.memorySlots,
    maxMemoryGb: product.motherboard.maxMemoryGb,
    maxMemorySpeedMhz: product.motherboard.maxMemorySpeedMhz,
    m2Slots: product.motherboard.m2Slots,
    sataPorts: product.motherboard.sataPorts,
  };
}

function toRam(product: ProductRow, quantity: number): RamParts {
  if (!product.ram) {
    throw new ValidationError(`Product "${product.name}" is missing RAM specs.`);
  }
  return {
    productId: product.id,
    name: product.name,
    memoryType: product.ram.memoryType,
    speedMhz: product.ram.speedMhz,
    capacityGb: product.ram.capacityGb,
    modules: product.ram.modules,
    quantity,
  };
}

function toGpu(product: ProductRow): GpuParts {
  if (!product.gpu) {
    throw new ValidationError(`Product "${product.name}" is missing GPU specs.`);
  }
  return {
    productId: product.id,
    name: product.name,
    lengthMm: product.gpu.lengthMm,
    tdpWatts: product.gpu.tdpWatts,
    recommendedPsuWatts: product.gpu.recommendedPsuWatts,
    powerConnectors: product.gpu.powerConnectors,
  };
}

function toCase(product: ProductRow): CaseParts {
  if (!product.pcCase) {
    throw new ValidationError(`Product "${product.name}" is missing case specs.`);
  }
  return {
    productId: product.id,
    name: product.name,
    supportedFormFactors: product.pcCase.supportedFormFactors,
    maxGpuLengthMm: product.pcCase.maxGpuLengthMm,
    maxCoolerHeightMm: product.pcCase.maxCoolerHeightMm,
    psuFormFactor: product.pcCase.psuFormFactor,
    maxRadiatorMm: product.pcCase.maxRadiatorMm,
  };
}

function toPsu(product: ProductRow): PsuParts {
  if (!product.psu) {
    throw new ValidationError(`Product "${product.name}" is missing PSU specs.`);
  }
  return {
    productId: product.id,
    name: product.name,
    wattage: product.psu.wattage,
    formFactor: product.psu.formFactor,
  };
}

function toCooler(product: ProductRow): CoolerParts {
  if (!product.cooler) {
    throw new ValidationError(
      `Product "${product.name}" is missing cooler specs.`,
    );
  }
  return {
    productId: product.id,
    name: product.name,
    coolerType: product.cooler.coolerType,
    supportedSockets: product.cooler.supportedSockets,
    heightMm: product.cooler.heightMm,
    radiatorMm: product.cooler.radiatorMm,
    tdpRatingWatts: product.cooler.tdpRatingWatts,
  };
}

function toStorage(product: ProductRow, quantity: number): StorageParts {
  if (!product.storage) {
    throw new ValidationError(
      `Product "${product.name}" is missing storage specs.`,
    );
  }
  return {
    productId: product.id,
    name: product.name,
    interface: product.storage.interface,
    quantity,
  };
}

export function mapProductsToBuild(
  components: CheckCompatibilityInput['components'],
  byId: Map<string, ProductRow>,
): ResolvedBuild {
  const build: ResolvedBuild = {
    ram: [],
    storage: [],
  };

  for (const item of components) {
    const product = byId.get(item.productId);
    if (!product) {
      throw new NotFoundError('Product not found.', {
        productId: 'Unknown product.',
      });
    }

    assertSlotMatchesType(item.slot, product);

    switch (item.slot) {
      case 'CPU':
        build.cpu = toCpu(product);
        break;
      case 'MOTHERBOARD':
        build.motherboard = toMotherboard(product);
        break;
      case 'RAM':
        build.ram.push(toRam(product, item.quantity));
        break;
      case 'GPU':
        build.gpu = toGpu(product);
        break;
      case 'CASE':
        build.pcCase = toCase(product);
        break;
      case 'PSU':
        build.psu = toPsu(product);
        break;
      case 'COOLER':
        build.cooler = toCooler(product);
        break;
      case 'STORAGE':
        build.storage.push(toStorage(product, item.quantity));
        break;
      default: {
        const _exhaustive: never = item.slot;
        throw new ValidationError(`Unsupported slot: ${_exhaustive}`);
      }
    }
  }

  return build;
}

/**
 * Load catalog products by ID and evaluate compatibility on the server.
 * Prices / stock are not part of this check — Phase 10+ handles commerce.
 */
export async function checkCompatibility(
  prisma: PrismaClient,
  input: CheckCompatibilityInput,
): Promise<CompatibilityResult> {
  const ids = [...new Set(input.components.map((c) => c.productId))];

  const rows = await prisma.product.findMany({
    where: {
      id: { in: ids },
      status: 'ACTIVE',
    },
    include: productInclude,
  });

  if (rows.length !== ids.length) {
    const found = new Set(rows.map((r) => r.id));
    const missing = ids.find((id) => !found.has(id));
    throw new NotFoundError('Product not found.', {
      productId: missing ?? 'Unknown product.',
    });
  }

  const byId = new Map(rows.map((row) => [row.id, row]));
  const build = mapProductsToBuild(input.components, byId);
  return evaluateCompatibility(build);
}
