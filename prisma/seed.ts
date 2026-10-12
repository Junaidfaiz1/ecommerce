/**
 * VORQEN Phase 2 seed — catalog + compatible / incompatible builds for tests.
 *
 *   pnpm db:seed
 *
 * Users: admin@vorqen.local / builder@vorqen.local
 * Password: Password123!
 */
import 'dotenv/config';
import { hashSync } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  type Prisma,
  type ProductType,
} from '../apps/web/src/generated/prisma/client';

const DEMO_PASSWORD = 'Password123!';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  const passwordHash = hashSync(DEMO_PASSWORD, 10);

  console.log('Seeding VORQEN…');

  await prisma.abandonedCartEmail.deleteMany();
  await prisma.abandonedCart.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.reviewImage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bundleItem.deleteMany();
  await prisma.bundle.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.benchmark.deleteMany();
  await prisma.game.deleteMany();
  await prisma.pCBuildItem.deleteMany();
  await prisma.pCBuild.deleteMany();
  await prisma.compatibilityRule.deleteMany();
  await prisma.cpu.deleteMany();
  await prisma.gpu.deleteMany();
  await prisma.motherboard.deleteMany();
  await prisma.ram.deleteMany();
  await prisma.storageDrive.deleteMany();
  await prisma.psu.deleteMany();
  await prisma.pcCase.deleteMany();
  await prisma.cooler.deleteMany();
  await prisma.product3DAsset.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.authChallenge.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@vorqen.local',
      passwordHash,
      firstName: 'Vorqen',
      lastName: 'Admin',
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'builder@vorqen.local',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Builder',
      role: 'CUSTOMER',
      emailVerifiedAt: new Date(),
      addresses: {
        create: {
          label: 'Home',
          line1: '100 Hardware Ave',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
          type: 'BOTH',
          isDefault: true,
        },
      },
    },
  });

  const brands = await Promise.all(
    [
      { name: 'AMD', slug: 'amd' },
      { name: 'Intel', slug: 'intel' },
      { name: 'NVIDIA Partner', slug: 'nvidia-partner' },
      { name: 'ASUS', slug: 'asus' },
      { name: 'MSI', slug: 'msi' },
      { name: 'Corsair', slug: 'corsair' },
      { name: 'Samsung', slug: 'samsung' },
      { name: 'Seasonic', slug: 'seasonic' },
      { name: 'Fractal', slug: 'fractal' },
      { name: 'Noctua', slug: 'noctua' },
    ].map((b) => prisma.brand.create({ data: b })),
  );
  const brand = Object.fromEntries(brands.map((b) => [b.slug, b.id]));

  const [catCpu, catGpu, catMb, catRam, catStorage, catPsu, catCase, catCooler] =
    await Promise.all([
      prisma.category.create({ data: { name: 'Processors', slug: 'cpu', sortOrder: 1 } }),
      prisma.category.create({
        data: { name: 'Graphics Cards', slug: 'gpu', sortOrder: 2 },
      }),
      prisma.category.create({
        data: { name: 'Motherboards', slug: 'motherboard', sortOrder: 3 },
      }),
      prisma.category.create({ data: { name: 'Memory', slug: 'ram', sortOrder: 4 } }),
      prisma.category.create({ data: { name: 'Storage', slug: 'storage', sortOrder: 5 } }),
      prisma.category.create({
        data: { name: 'Power Supplies', slug: 'psu', sortOrder: 6 },
      }),
      prisma.category.create({ data: { name: 'Cases', slug: 'case', sortOrder: 7 } }),
      prisma.category.create({ data: { name: 'Cooling', slug: 'cooler', sortOrder: 8 } }),
    ]);

  type CreatedProduct = Awaited<ReturnType<typeof createHardwareProduct>>;

  async function createHardwareProduct(input: {
    type: ProductType;
    brandSlug: string;
    categoryId: string;
    name: string;
    slug: string;
    sku: string;
    price: string;
    stock: number;
    cpu?: Omit<Prisma.CpuCreateWithoutProductInput, never>;
    gpu?: Omit<Prisma.GpuCreateWithoutProductInput, never>;
    motherboard?: Omit<Prisma.MotherboardCreateWithoutProductInput, never>;
    ram?: Omit<Prisma.RamCreateWithoutProductInput, never>;
    storage?: Omit<Prisma.StorageDriveCreateWithoutProductInput, never>;
    psu?: Omit<Prisma.PsuCreateWithoutProductInput, never>;
    pcCase?: Omit<Prisma.PcCaseCreateWithoutProductInput, never>;
    cooler?: Omit<Prisma.CoolerCreateWithoutProductInput, never>;
  }) {
    const product = await prisma.product.create({
      data: {
        brandId: brand[input.brandSlug]!,
        categoryId: input.categoryId,
        type: input.type,
        name: input.name,
        slug: input.slug,
        description: `${input.name} — VORQEN catalog seed`,
        status: 'ACTIVE',
        isFeatured: true,
        images: {
          create: {
            url: `/assets/catalog/${input.slug}.jpg`,
            alt: input.name,
            isPrimary: true,
          },
        },
        assets3d: {
          create: {
            glbUrl: `procedural://${input.type.toLowerCase()}`,
            label: `${input.name} 3D`,
          },
        },
        variants: {
          create: {
            sku: input.sku,
            name: 'Default',
            price: input.price,
            isDefault: true,
            inventory: {
              create: {
                quantityOnHand: input.stock,
                quantityReserved: 0,
                lowStockThreshold: 3,
              },
            },
          },
        },
        ...(input.cpu ? { cpu: { create: input.cpu } } : {}),
        ...(input.gpu ? { gpu: { create: input.gpu } } : {}),
        ...(input.motherboard ? { motherboard: { create: input.motherboard } } : {}),
        ...(input.ram ? { ram: { create: input.ram } } : {}),
        ...(input.storage ? { storage: { create: input.storage } } : {}),
        ...(input.psu ? { psu: { create: input.psu } } : {}),
        ...(input.pcCase ? { pcCase: { create: input.pcCase } } : {}),
        ...(input.cooler ? { cooler: { create: input.cooler } } : {}),
      },
      include: { variants: true },
    });

    return product;
  }

  const cpuAm5 = await createHardwareProduct({
    type: 'CPU',
    brandSlug: 'amd',
    categoryId: catCpu.id,
    name: 'AMD Ryzen 7 7800X3D',
    slug: 'amd-ryzen-7-7800x3d',
    sku: 'CPU-R7-7800X3D',
    price: '449.00',
    stock: 25,
    cpu: {
      socket: 'AM5',
      cores: 8,
      threads: 16,
      baseClockGhz: 4.2,
      boostClockGhz: 5.0,
      tdpWatts: 120,
      memoryType: 'DDR5',
      maxMemoryGhz: 5200,
      hasIntegratedGpu: true,
    },
  });

  const mbAm5 = await createHardwareProduct({
    type: 'MOTHERBOARD',
    brandSlug: 'asus',
    categoryId: catMb.id,
    name: 'ASUS ROG Strix B650-A',
    slug: 'asus-rog-strix-b650-a',
    sku: 'MB-B650-A',
    price: '229.00',
    stock: 18,
    motherboard: {
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

  const ramDdr5 = await createHardwareProduct({
    type: 'RAM',
    brandSlug: 'corsair',
    categoryId: catRam.id,
    name: 'Corsair Vengeance DDR5-6000 32GB',
    slug: 'corsair-vengeance-ddr5-6000-32gb',
    sku: 'RAM-DDR5-32-6000',
    price: '119.00',
    stock: 40,
    ram: {
      memoryType: 'DDR5',
      speedMhz: 6000,
      capacityGb: 32,
      modules: 2,
      voltage: 1.35,
    },
  });

  const gpu4080 = await createHardwareProduct({
    type: 'GPU',
    brandSlug: 'nvidia-partner',
    categoryId: catGpu.id,
    name: 'GeForce RTX 4080 SUPER 16GB',
    slug: 'rtx-4080-super-16gb',
    sku: 'GPU-4080S-16',
    price: '999.00',
    stock: 12,
    gpu: {
      chipset: 'RTX 4080 SUPER',
      lengthMm: 304,
      slotWidth: 3.0,
      tdpWatts: 320,
      recommendedPsuWatts: 750,
      vramGb: 16,
      powerConnectors: '1x12VHPWR',
      interfaceBus: 'PCIe 4.0 x16',
    },
  });

  const storage1tb = await createHardwareProduct({
    type: 'STORAGE',
    brandSlug: 'samsung',
    categoryId: catStorage.id,
    name: 'Samsung 990 PRO 1TB',
    slug: 'samsung-990-pro-1tb',
    sku: 'SSD-990PRO-1TB',
    price: '129.00',
    stock: 50,
    storage: {
      interface: 'NVME_M2',
      capacityGb: 1000,
      formFactor: 'M.2 2280',
      readMbps: 7450,
      writeMbps: 6900,
    },
  });

  const psu850 = await createHardwareProduct({
    type: 'PSU',
    brandSlug: 'seasonic',
    categoryId: catPsu.id,
    name: 'Seasonic Focus GX-850',
    slug: 'seasonic-focus-gx-850',
    sku: 'PSU-GX-850',
    price: '149.00',
    stock: 22,
    psu: {
      wattage: 850,
      formFactor: 'ATX',
      efficiency: '80+ Gold',
      modular: 'Full',
      lengthMm: 140,
    },
  });

  const caseMesh = await createHardwareProduct({
    type: 'CASE',
    brandSlug: 'fractal',
    categoryId: catCase.id,
    name: 'Fractal Meshify 2',
    slug: 'fractal-meshify-2',
    sku: 'CASE-MESHIFY-2',
    price: '139.00',
    stock: 15,
    pcCase: {
      supportedFormFactors: ['ATX', 'mATX', 'ITX'],
      maxGpuLengthMm: 360,
      maxCoolerHeightMm: 185,
      psuFormFactor: 'ATX',
      maxRadiatorMm: 360,
      includedFans: 3,
    },
  });

  const coolerNh = await createHardwareProduct({
    type: 'COOLER',
    brandSlug: 'noctua',
    categoryId: catCooler.id,
    name: 'Noctua NH-D15',
    slug: 'noctua-nh-d15',
    sku: 'CLR-NH-D15',
    price: '109.00',
    stock: 20,
    cooler: {
      coolerType: 'AIR',
      supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200'],
      heightMm: 165,
      tdpRatingWatts: 220,
    },
  });

  const cpuLga = await createHardwareProduct({
    type: 'CPU',
    brandSlug: 'intel',
    categoryId: catCpu.id,
    name: 'Intel Core i7-14700K',
    slug: 'intel-core-i7-14700k',
    sku: 'CPU-I7-14700K',
    price: '409.00',
    stock: 20,
    cpu: {
      socket: 'LGA1700',
      cores: 20,
      threads: 28,
      baseClockGhz: 3.4,
      boostClockGhz: 5.6,
      tdpWatts: 125,
      memoryType: 'DDR5',
      maxMemoryGhz: 5600,
      hasIntegratedGpu: true,
    },
  });

  const ramDdr4 = await createHardwareProduct({
    type: 'RAM',
    brandSlug: 'corsair',
    categoryId: catRam.id,
    name: 'Corsair Vengeance DDR4-3600 32GB',
    slug: 'corsair-vengeance-ddr4-3600-32gb',
    sku: 'RAM-DDR4-32-3600',
    price: '89.00',
    stock: 30,
    ram: {
      memoryType: 'DDR4',
      speedMhz: 3600,
      capacityGb: 32,
      modules: 2,
      voltage: 1.35,
    },
  });

  const gpuLong = await createHardwareProduct({
    type: 'GPU',
    brandSlug: 'msi',
    categoryId: catGpu.id,
    name: 'MSI Gaming X Trio RTX 4090',
    slug: 'msi-rtx-4090-gaming-x-trio',
    sku: 'GPU-4090-TRIO',
    price: '1899.00',
    stock: 4,
    gpu: {
      chipset: 'RTX 4090',
      lengthMm: 337,
      slotWidth: 3.5,
      tdpWatts: 450,
      recommendedPsuWatts: 850,
      vramGb: 24,
      powerConnectors: '1x12VHPWR',
      interfaceBus: 'PCIe 4.0 x16',
    },
  });

  const caseItx = await createHardwareProduct({
    type: 'CASE',
    brandSlug: 'fractal',
    categoryId: catCase.id,
    name: 'Fractal Node 304',
    slug: 'fractal-node-304',
    sku: 'CASE-NODE-304',
    price: '99.00',
    stock: 10,
    pcCase: {
      supportedFormFactors: ['ITX'],
      maxGpuLengthMm: 310,
      maxCoolerHeightMm: 70,
      psuFormFactor: 'SFX',
      includedFans: 0,
    },
  });

  const psu450 = await createHardwareProduct({
    type: 'PSU',
    brandSlug: 'seasonic',
    categoryId: catPsu.id,
    name: 'Seasonic Core 450',
    slug: 'seasonic-core-450',
    sku: 'PSU-CORE-450',
    price: '59.00',
    stock: 14,
    psu: {
      wattage: 450,
      formFactor: 'ATX',
      efficiency: '80+ Bronze',
      modular: 'No',
      lengthMm: 140,
    },
  });

  await prisma.compatibilityRule.createMany({
    data: [
      {
        code: 'CPU_MB_SOCKET',
        name: 'CPU ↔ Motherboard socket',
        description: 'CPU socket must match motherboard socket',
        severity: 'ERROR',
      },
      {
        code: 'RAM_MB_TYPE',
        name: 'RAM ↔ Motherboard memory type',
        description: 'RAM memory type must match motherboard',
        severity: 'ERROR',
      },
      {
        code: 'GPU_CASE_LENGTH',
        name: 'GPU ↔ Case clearance',
        description: 'GPU length must be ≤ case max GPU length',
        severity: 'ERROR',
      },
      {
        code: 'PSU_WATTAGE',
        name: 'PSU wattage margin',
        description: 'PSU must cover estimated system draw + safety margin',
        severity: 'ERROR',
      },
      {
        code: 'COOLER_SOCKET',
        name: 'Cooler ↔ CPU socket',
        description: 'Cooler must list the CPU socket',
        severity: 'ERROR',
      },
      {
        code: 'MB_CASE_FORM',
        name: 'Motherboard ↔ Case form factor',
        description: 'Case must support motherboard form factor',
        severity: 'ERROR',
      },
    ],
  });

  const game = await prisma.game.create({
    data: {
      name: 'Cyberpunk 2077',
      slug: 'cyberpunk-2077',
      coverUrl: '/assets/catalog/product.jpg',
    },
  });

  await prisma.benchmark.createMany({
    data: [
      {
        gameId: game.id,
        cpuProductId: cpuAm5.id,
        gpuProductId: gpu4080.id,
        resolution: '1080p',
        quality: 'ULTRA',
        avgFps: 142,
        source: 'seed-estimate',
      },
      {
        gameId: game.id,
        cpuProductId: cpuAm5.id,
        gpuProductId: gpu4080.id,
        resolution: '1440p',
        quality: 'ULTRA',
        avgFps: 98.5,
        source: 'seed-estimate',
      },
      {
        gameId: game.id,
        cpuProductId: cpuAm5.id,
        gpuProductId: gpu4080.id,
        resolution: '4K',
        quality: 'ULTRA',
        avgFps: 61,
        source: 'seed-estimate',
      },
    ],
  });

  const item = (slot: Prisma.PCBuildItemCreateWithoutBuildInput['slot'], p: CreatedProduct) => ({
    slot,
    productId: p.id,
    variantId: p.variants[0]!.id,
  });

  await prisma.pCBuild.create({
    data: {
      userId: customer.id,
      name: 'AM5 1440p Compatible',
      slug: 'am5-1440p-compatible',
      visibility: 'PUBLIC',
      totalPriceSnapshot: '2322.00',
      items: {
        create: [
          item('CPU', cpuAm5),
          item('MOTHERBOARD', mbAm5),
          item('RAM', ramDdr5),
          item('GPU', gpu4080),
          item('STORAGE', storage1tb),
          item('PSU', psu850),
          item('CASE', caseMesh),
          item('COOLER', coolerNh),
        ],
      },
    },
  });

  await prisma.pCBuild.create({
    data: {
      userId: customer.id,
      name: 'Incompatible Stress Build',
      slug: 'incompatible-stress-build',
      visibility: 'PRIVATE',
      notes:
        'DDR4 on DDR5 board, GPU too long for Node 304, ATX MB in ITX case, PSU undersized',
      items: {
        create: [
          item('CPU', cpuAm5),
          item('MOTHERBOARD', mbAm5),
          item('RAM', ramDdr4),
          item('GPU', gpuLong),
          item('STORAGE', storage1tb),
          item('PSU', psu450),
          item('CASE', caseItx),
          item('COOLER', coolerNh),
        ],
      },
    },
  });

  await prisma.pCBuild.create({
    data: {
      userId: customer.id,
      name: 'Socket Mismatch Sample',
      slug: 'socket-mismatch-sample',
      visibility: 'PRIVATE',
      items: {
        create: [item('CPU', cpuLga), item('MOTHERBOARD', mbAm5)],
      },
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'BUILD10',
      type: 'PERCENTAGE',
      value: 10,
      minSubtotal: 100,
      maxDiscount: 150,
      maxUses: 1000,
      maxUsesPerUser: 3,
      isActive: true,
    },
  });

  console.log('Seed complete.');
  console.log(`  Admin:    admin@vorqen.local / ${DEMO_PASSWORD}`);
  console.log(`  Customer: builder@vorqen.local / ${DEMO_PASSWORD}`);
  console.log(`  Users: ${admin.id}, ${customer.id}`);
  console.log('  Builds: 1 compatible + 2 incompatible samples');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
