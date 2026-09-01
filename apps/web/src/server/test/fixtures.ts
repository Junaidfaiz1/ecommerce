import type { Prisma, PrismaClient, ProductType } from '@/generated/prisma/client';
import type { AuthUser } from '../auth/types';
import { asDecimal } from './memory-prisma';

function money(value: string | number): Prisma.Decimal {
  return asDecimal(value) as unknown as Prisma.Decimal;
}

export const IDS = {
  customer: 'user_customer_1',
  other: 'user_other_2',
  admin: 'user_admin_3',
  support: 'user_support_4',
  address: 'addr_customer_ship',
  brand: 'brand_seed_1',
  category: 'cat_seed_1',
  coupon: 'coupon_build10',
  cpu: 'prod_cpu_am5',
  cpuVar: 'var_cpu_am5',
  motherboard: 'prod_mb_am5',
  motherboardVar: 'var_mb_am5',
  ram: 'prod_ram_ddr5',
  ramVar: 'var_ram_ddr5',
  gpu: 'prod_gpu_4080',
  gpuVar: 'var_gpu_4080',
  gpuInv: 'inv_gpu_4080',
  case: 'prod_case_mesh',
  caseVar: 'var_case_mesh',
  psu: 'prod_psu_850',
  psuVar: 'var_psu_850',
  cooler: 'prod_cooler_nh',
  coolerVar: 'var_cooler_nh',
  storage: 'prod_ssd_990',
  storageVar: 'var_ssd_990',
  tinyCase: 'prod_case_itx',
  tinyCaseVar: 'var_case_itx',
  compatibleBuild: 'build_ok_1',
  incompatibleBuild: 'build_bad_1',
} as const;

export const PRICES = {
  cpu: '449.00',
  motherboard: '229.00',
  ram: '129.00',
  gpu: '1299.00',
  case: '169.00',
  psu: '159.00',
  cooler: '109.00',
  storage: '119.00',
} as const;

export function authUser(
  id: string,
  role: AuthUser['role'] = 'CUSTOMER',
  extra: Partial<AuthUser> = {},
): AuthUser {
  return {
    id,
    email:
      id === IDS.admin
        ? 'ops@vorqen.local'
        : id === IDS.support
          ? 'support@vorqen.local'
          : id === IDS.other
            ? 'other@vorqen.local'
            : 'builder@vorqen.local',
    firstName: 'Test',
    lastName: 'User',
    role,
    emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...extra,
  };
}

async function seedVariant(
  prisma: PrismaClient,
  input: {
    id: string;
    productId: string;
    sku: string;
    price: string;
    onHand?: number;
    reserved?: number;
  },
) {
  await prisma.productVariant.create({
    data: {
      id: input.id,
      productId: input.productId,
      sku: input.sku,
      name: 'Default',
      price: money(input.price),
      currency: 'USD',
      isDefault: true,
      isActive: true,
    },
  });
  await prisma.inventory.create({
    data: {
      id: `inv_${input.id}`,
      variantId: input.id,
      quantityOnHand: input.onHand ?? 10,
      quantityReserved: input.reserved ?? 0,
      lowStockThreshold: 2,
    },
  });
}

async function seedProduct(
  prisma: PrismaClient,
  input: {
    id: string;
    type: ProductType;
    name: string;
    slug: string;
  },
) {
  await prisma.product.create({
    data: {
      id: input.id,
      brandId: IDS.brand,
      categoryId: IDS.category,
      type: input.type,
      name: input.name,
      slug: input.slug,
      status: 'ACTIVE',
      isFeatured: false,
    },
  });
}

export async function seedCatalog(prisma: PrismaClient): Promise<void> {
  await prisma.brand.create({
    data: {
      id: IDS.brand,
      name: 'VORQEN Labs',
      slug: 'vorqen-labs',
    },
  });
  await prisma.category.create({
    data: {
      id: IDS.category,
      name: 'Components',
      slug: 'components',
      sortOrder: 0,
    },
  });

  await seedProduct(prisma, {
    id: IDS.cpu,
    type: 'CPU',
    name: 'AMD Ryzen 7 7800X3D',
    slug: 'ryzen-7-7800x3d',
  });
  await prisma.cpu.create({
    data: {
      productId: IDS.cpu,
      socket: 'AM5',
      cores: 8,
      threads: 16,
      baseClockGhz: money(4.2),
      boostClockGhz: money(5.0),
      tdpWatts: 120,
      memoryType: 'DDR5',
      hasIntegratedGpu: false,
    },
  });
  await seedVariant(prisma, {
    id: IDS.cpuVar,
    productId: IDS.cpu,
    sku: 'CPU-7800X3D',
    price: PRICES.cpu,
  });

  await seedProduct(prisma, {
    id: IDS.motherboard,
    type: 'MOTHERBOARD',
    name: 'ASUS ROG Strix B650-A',
    slug: 'strix-b650-a',
  });
  await prisma.motherboard.create({
    data: {
      productId: IDS.motherboard,
      socket: 'AM5',
      chipset: 'B650',
      formFactor: 'ATX',
      memoryType: 'DDR5',
      memorySlots: 4,
      maxMemoryGb: 128,
      maxMemorySpeedMhz: 6400,
      m2Slots: 3,
      sataPorts: 4,
      wifi: true,
    },
  });
  await seedVariant(prisma, {
    id: IDS.motherboardVar,
    productId: IDS.motherboard,
    sku: 'MB-B650A',
    price: PRICES.motherboard,
  });

  await seedProduct(prisma, {
    id: IDS.ram,
    type: 'RAM',
    name: 'Corsair Vengeance DDR5-6000 32GB',
    slug: 'vengeance-ddr5-32',
  });
  await prisma.ram.create({
    data: {
      productId: IDS.ram,
      memoryType: 'DDR5',
      speedMhz: 6000,
      capacityGb: 32,
      modules: 2,
    },
  });
  await seedVariant(prisma, {
    id: IDS.ramVar,
    productId: IDS.ram,
    sku: 'RAM-DDR5-32',
    price: PRICES.ram,
  });

  await seedProduct(prisma, {
    id: IDS.gpu,
    type: 'GPU',
    name: 'GeForce RTX 4080 SUPER 16GB',
    slug: 'rtx-4080-super',
  });
  await prisma.gpu.create({
    data: {
      productId: IDS.gpu,
      chipset: 'AD103',
      lengthMm: 304,
      slotWidth: money(3.0),
      tdpWatts: 320,
      recommendedPsuWatts: 750,
      vramGb: 16,
      powerConnectors: '1x12VHPWR',
      interfaceBus: 'PCIe 4.0 x16',
    },
  });
  await seedVariant(prisma, {
    id: IDS.gpuVar,
    productId: IDS.gpu,
    sku: 'GPU-4080S',
    price: PRICES.gpu,
  });

  await seedProduct(prisma, {
    id: IDS.case,
    type: 'CASE',
    name: 'Fractal Meshify 2',
    slug: 'meshify-2',
  });
  await prisma.pcCase.create({
    data: {
      productId: IDS.case,
      supportedFormFactors: ['ATX', 'mATX', 'ITX'],
      maxGpuLengthMm: 360,
      maxCoolerHeightMm: 185,
      psuFormFactor: 'ATX',
      maxRadiatorMm: 360,
      includedFans: 3,
    },
  });
  await seedVariant(prisma, {
    id: IDS.caseVar,
    productId: IDS.case,
    sku: 'CASE-MESH2',
    price: PRICES.case,
  });

  await seedProduct(prisma, {
    id: IDS.tinyCase,
    type: 'CASE',
    name: 'Fractal Node 304',
    slug: 'node-304',
  });
  await prisma.pcCase.create({
    data: {
      productId: IDS.tinyCase,
      supportedFormFactors: ['ITX'],
      maxGpuLengthMm: 200,
      maxCoolerHeightMm: 70,
      psuFormFactor: 'SFX',
      maxRadiatorMm: 240,
      includedFans: 1,
    },
  });
  await seedVariant(prisma, {
    id: IDS.tinyCaseVar,
    productId: IDS.tinyCase,
    sku: 'CASE-NODE304',
    price: '89.00',
  });

  await seedProduct(prisma, {
    id: IDS.psu,
    type: 'PSU',
    name: 'Seasonic Focus GX-850',
    slug: 'focus-gx-850',
  });
  await prisma.psu.create({
    data: {
      productId: IDS.psu,
      wattage: 850,
      formFactor: 'ATX',
      efficiency: 'Gold',
      modular: 'Full',
    },
  });
  await seedVariant(prisma, {
    id: IDS.psuVar,
    productId: IDS.psu,
    sku: 'PSU-GX850',
    price: PRICES.psu,
  });

  await seedProduct(prisma, {
    id: IDS.cooler,
    type: 'COOLER',
    name: 'Noctua NH-D15',
    slug: 'nh-d15',
  });
  await prisma.cooler.create({
    data: {
      productId: IDS.cooler,
      coolerType: 'AIR',
      supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200'],
      heightMm: 165,
      radiatorMm: null,
      tdpRatingWatts: 220,
    },
  });
  await seedVariant(prisma, {
    id: IDS.coolerVar,
    productId: IDS.cooler,
    sku: 'COOL-NHD15',
    price: PRICES.cooler,
  });

  await seedProduct(prisma, {
    id: IDS.storage,
    type: 'STORAGE',
    name: 'Samsung 990 PRO 1TB',
    slug: '990-pro-1tb',
  });
  await prisma.storageDrive.create({
    data: {
      productId: IDS.storage,
      interface: 'NVME_M2',
      capacityGb: 1000,
      formFactor: 'M.2 2280',
    },
  });
  await seedVariant(prisma, {
    id: IDS.storageVar,
    productId: IDS.storage,
    sku: 'SSD-990PRO-1TB',
    price: PRICES.storage,
  });

  await prisma.coupon.create({
    data: {
      id: IDS.coupon,
      code: 'BUILD10',
      type: 'PERCENTAGE',
      value: money(10),
      minSubtotal: money(100),
      maxDiscount: money(150),
      maxUses: 1000,
      maxUsesPerUser: 3,
      startsAt: null,
      endsAt: null,
      isActive: true,
    },
  });
}

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  for (const user of [
    authUser(IDS.customer),
    authUser(IDS.other),
    authUser(IDS.admin, 'ADMIN'),
    authUser(IDS.support, 'SUPPORT'),
  ]) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash: 'hashed',
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  }

  await prisma.address.create({
    data: {
      id: IDS.address,
      userId: IDS.customer,
      line1: '100 Hardware Way',
      city: 'Austin',
      postalCode: '78701',
      country: 'US',
      type: 'SHIPPING',
      isDefault: true,
    },
  });
}

const COMPATIBLE_ITEMS = [
  { slot: 'CPU', productId: IDS.cpu, variantId: IDS.cpuVar },
  { slot: 'MOTHERBOARD', productId: IDS.motherboard, variantId: IDS.motherboardVar },
  { slot: 'RAM', productId: IDS.ram, variantId: IDS.ramVar },
  { slot: 'GPU', productId: IDS.gpu, variantId: IDS.gpuVar },
  { slot: 'CASE', productId: IDS.case, variantId: IDS.caseVar },
  { slot: 'PSU', productId: IDS.psu, variantId: IDS.psuVar },
  { slot: 'COOLER', productId: IDS.cooler, variantId: IDS.coolerVar },
  { slot: 'STORAGE', productId: IDS.storage, variantId: IDS.storageVar },
] as const;

export async function seedCompatibleBuild(prisma: PrismaClient): Promise<void> {
  await prisma.pCBuild.create({
    data: {
      id: IDS.compatibleBuild,
      userId: IDS.customer,
      name: 'AM5 workstation',
      visibility: 'PRIVATE',
      totalPriceSnapshot: money('1.00'),
      currency: 'USD',
      items: {
        create: COMPATIBLE_ITEMS.map((item) => ({
          slot: item.slot,
          productId: item.productId,
          variantId: item.variantId,
          quantity: 1,
        })),
      },
    },
  });
}

export async function seedIncompatibleBuild(prisma: PrismaClient): Promise<void> {
  await prisma.pCBuild.create({
    data: {
      id: IDS.incompatibleBuild,
      userId: IDS.customer,
      name: 'ITX squeeze',
      visibility: 'PRIVATE',
      currency: 'USD',
      items: {
        create: [
          { slot: 'GPU', productId: IDS.gpu, variantId: IDS.gpuVar, quantity: 1 },
          {
            slot: 'CASE',
            productId: IDS.tinyCase,
            variantId: IDS.tinyCaseVar,
            quantity: 1,
          },
        ],
      },
    },
  });
}

export async function seedShop(prisma: PrismaClient): Promise<void> {
  await seedUsers(prisma);
  await seedCatalog(prisma);
  await seedCompatibleBuild(prisma);
  await seedIncompatibleBuild(prisma);
}
