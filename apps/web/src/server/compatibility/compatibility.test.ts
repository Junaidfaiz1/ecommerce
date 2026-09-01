import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  checkCompatibilityInputSchema,
  type CompatibilityResult,
} from '@vorqen/types';
import {
  evaluateCompatibility,
  estimateSystemWattage,
  recommendedPsuFromEstimate,
  PLATFORM_OVERHEAD_WATTS,
  PSU_SAFETY_MARGIN_RATIO,
} from './index';
import type { ResolvedBuild } from './parts';

const compatibleBuild = (): ResolvedBuild => ({
  cpu: {
    productId: 'cpu-am5',
    name: 'AMD Ryzen 7 7800X3D',
    socket: 'AM5',
    tdpWatts: 120,
    memoryType: 'DDR5',
  },
  motherboard: {
    productId: 'mb-am5',
    name: 'ASUS ROG Strix B650-A',
    socket: 'AM5',
    formFactor: 'ATX',
    memoryType: 'DDR5',
    memorySlots: 4,
    maxMemoryGb: 128,
    maxMemorySpeedMhz: 6400,
    m2Slots: 3,
    sataPorts: 4,
  },
  ram: [
    {
      productId: 'ram-ddr5',
      name: 'Corsair Vengeance DDR5-6000 32GB',
      memoryType: 'DDR5',
      speedMhz: 6000,
      capacityGb: 32,
      modules: 2,
      quantity: 1,
    },
  ],
  gpu: {
    productId: 'gpu-4080',
    name: 'GeForce RTX 4080 SUPER 16GB',
    lengthMm: 304,
    tdpWatts: 320,
    recommendedPsuWatts: 750,
    powerConnectors: '1x12VHPWR',
  },
  pcCase: {
    productId: 'case-mesh',
    name: 'Fractal Meshify 2',
    supportedFormFactors: ['ATX', 'mATX', 'ITX'],
    maxGpuLengthMm: 360,
    maxCoolerHeightMm: 185,
    psuFormFactor: 'ATX',
    maxRadiatorMm: 360,
  },
  psu: {
    productId: 'psu-850',
    name: 'Seasonic Focus GX-850',
    wattage: 850,
    formFactor: 'ATX',
  },
  cooler: {
    productId: 'cooler-nh',
    name: 'Noctua NH-D15',
    coolerType: 'AIR',
    supportedSockets: ['AM5', 'AM4', 'LGA1700', 'LGA1200'],
    heightMm: 165,
    radiatorMm: null,
    tdpRatingWatts: 220,
  },
  storage: [
    {
      productId: 'ssd-990',
      name: 'Samsung 990 PRO 1TB',
      interface: 'NVME_M2',
      quantity: 1,
    },
  ],
});

function assertCompatible(result: CompatibilityResult) {
  assert.equal(result.compatible, true);
  assert.deepEqual(result.errors, []);
}

describe('checkCompatibilityInputSchema', () => {
  it('accepts a valid multi-slot selection', () => {
    const parsed = checkCompatibilityInputSchema.parse({
      components: [
        { slot: 'CPU', productId: 'clxxxxxxxxxxxxxxxxxxxxxxxx' },
        { slot: 'STORAGE', productId: 'clyyyyyyyyyyyyyyyyyyyyyyyy', quantity: 2 },
        { slot: 'STORAGE', productId: 'clzzzzzzzzzzzzzzzzzzzzzzzz' },
      ],
    });
    assert.equal(parsed.components.length, 3);
  });

  it('rejects duplicate single-slot components', () => {
    const result = checkCompatibilityInputSchema.safeParse({
      components: [
        { slot: 'CPU', productId: 'clxxxxxxxxxxxxxxxxxxxxxxxx' },
        { slot: 'CPU', productId: 'clyyyyyyyyyyyyyyyyyyyyyyyy' },
      ],
    });
    assert.equal(result.success, false);
  });

  it('rejects empty components', () => {
    const result = checkCompatibilityInputSchema.safeParse({ components: [] });
    assert.equal(result.success, false);
  });
});

describe('power estimation', () => {
  it('adds platform overhead and applies safety margin', () => {
    const build = compatibleBuild();
    const estimated = estimateSystemWattage(build);
    assert.equal(estimated, 120 + 320 + PLATFORM_OVERHEAD_WATTS);
    assert.equal(
      recommendedPsuFromEstimate(estimated),
      Math.ceil(estimated * (1 + PSU_SAFETY_MARGIN_RATIO)),
    );
  });
});

describe('evaluateCompatibility', () => {
  it('passes a happy-path full build', () => {
    const result = evaluateCompatibility(compatibleBuild());
    assertCompatible(result);
    assert.ok(result.estimatedWattage != null);
    assert.ok(result.recommendedPsuWatts != null);
    assert.ok(result.recommendedPsuWatts! <= 850);
  });

  it('rejects mismatched CPU and motherboard sockets', () => {
    const build = compatibleBuild();
    build.cpu = {
      ...build.cpu!,
      socket: 'LGA1700',
      name: 'Intel Core i7-14700K',
    };
    const result = evaluateCompatibility(build);
    assert.equal(result.compatible, false);
    assert.ok(result.errors.some((e) => e.includes('socket')));
  });

  it('rejects mismatched RAM type', () => {
    const build = compatibleBuild();
    build.ram = [
      {
        productId: 'ram-ddr4',
        name: 'Corsair Vengeance DDR4-3600 32GB',
        memoryType: 'DDR4',
        speedMhz: 3600,
        capacityGb: 32,
        modules: 2,
        quantity: 1,
      },
    ];
    const result = evaluateCompatibility(build);
    assert.equal(result.compatible, false);
    assert.ok(result.errors.some((e) => e.includes('DDR4')));
  });

  it('rejects GPU longer than case clearance', () => {
    const build = compatibleBuild();
    build.gpu = {
      ...build.gpu!,
      lengthMm: 337,
      name: 'MSI Gaming X Trio RTX 4090',
    };
    build.pcCase = {
      ...build.pcCase!,
      maxGpuLengthMm: 310,
      name: 'Fractal Node 304',
      supportedFormFactors: ['ITX'],
      psuFormFactor: 'SFX',
      maxCoolerHeightMm: 70,
    };
    const result = evaluateCompatibility(build);
    assert.equal(result.compatible, false);
    assert.ok(result.errors.some((e) => e.includes('mm')));
  });

  it('rejects undersized PSU against safety margin', () => {
    const build = compatibleBuild();
    build.psu = {
      productId: 'psu-450',
      name: 'Seasonic Core 450',
      wattage: 450,
      formFactor: 'ATX',
    };
    const result = evaluateCompatibility(build);
    assert.equal(result.compatible, false);
    assert.ok(result.errors.some((e) => e.includes('safety margin')));
  });

  it('rejects cooler that does not list the CPU socket', () => {
    const build = compatibleBuild();
    build.cooler = {
      ...build.cooler!,
      supportedSockets: ['LGA1700'],
    };
    const result = evaluateCompatibility(build);
    assert.equal(result.compatible, false);
    assert.ok(result.errors.some((e) => e.includes('does not support')));
  });

  it('rejects motherboard form factor not supported by case', () => {
    const build = compatibleBuild();
    build.pcCase = {
      ...build.pcCase!,
      supportedFormFactors: ['ITX'],
      name: 'Fractal Node 304',
    };
    const result = evaluateCompatibility(build);
    assert.equal(result.compatible, false);
    assert.ok(result.errors.some((e) => e.includes('form factor')));
  });

  it('rejects PSU form factor mismatch with case', () => {
    const build = compatibleBuild();
    build.pcCase = {
      ...build.pcCase!,
      psuFormFactor: 'SFX',
    };
    const result = evaluateCompatibility(build);
    assert.equal(result.compatible, false);
    assert.ok(result.errors.some((e) => e.includes('PSU form factor')));
  });

  it('rejects more M.2 drives than motherboard slots', () => {
    const build = compatibleBuild();
    build.motherboard = { ...build.motherboard!, m2Slots: 1 };
    build.storage = [
      {
        productId: 'ssd-1',
        name: 'Drive A',
        interface: 'NVME_M2',
        quantity: 1,
      },
      {
        productId: 'ssd-2',
        name: 'Drive B',
        interface: 'NVME_M2',
        quantity: 1,
      },
    ];
    const result = evaluateCompatibility(build);
    assert.equal(result.compatible, false);
    assert.ok(result.errors.some((e) => e.includes('M.2')));
  });

  it('warns when RAM speed exceeds motherboard rating', () => {
    const build = compatibleBuild();
    build.motherboard = { ...build.motherboard!, maxMemorySpeedMhz: 5200 };
    const result = evaluateCompatibility(build);
    assertCompatible(result);
    assert.ok(result.warnings.some((e) => e.includes('downclock')));
  });

  it('recommends missing components without hard-failing', () => {
    const result = evaluateCompatibility({
      ram: [],
      storage: [],
      cpu: compatibleBuild().cpu,
    });
    assertCompatible(result);
    assert.ok(result.recommendations.some((r) => r.includes('motherboard')));
  });
});
