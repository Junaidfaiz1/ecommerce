/** Resolved typed specs used by the pure CompatibilityEngine (no Prisma). */

export type CpuParts = {
  productId: string;
  name: string;
  socket: string;
  tdpWatts: number;
  memoryType: string;
};

export type MotherboardParts = {
  productId: string;
  name: string;
  socket: string;
  formFactor: string;
  memoryType: string;
  memorySlots: number;
  maxMemoryGb: number;
  maxMemorySpeedMhz: number | null;
  m2Slots: number;
  sataPorts: number;
};

export type RamParts = {
  productId: string;
  name: string;
  memoryType: string;
  speedMhz: number;
  capacityGb: number;
  modules: number;
  quantity: number;
};

export type GpuParts = {
  productId: string;
  name: string;
  lengthMm: number;
  tdpWatts: number;
  recommendedPsuWatts: number | null;
  powerConnectors: string;
};

export type CaseParts = {
  productId: string;
  name: string;
  supportedFormFactors: string[];
  maxGpuLengthMm: number;
  maxCoolerHeightMm: number;
  psuFormFactor: string;
  maxRadiatorMm: number | null;
};

export type PsuParts = {
  productId: string;
  name: string;
  wattage: number;
  formFactor: string;
};

export type CoolerParts = {
  productId: string;
  name: string;
  coolerType: 'AIR' | 'AIO_LIQUID' | 'CUSTOM_LOOP';
  supportedSockets: string[];
  heightMm: number | null;
  radiatorMm: number | null;
  tdpRatingWatts: number | null;
};

export type StorageParts = {
  productId: string;
  name: string;
  interface: 'NVME_M2' | 'SATA_SSD' | 'SATA_HDD' | 'OTHER';
  quantity: number;
};

export type ResolvedBuild = {
  cpu?: CpuParts;
  motherboard?: MotherboardParts;
  ram: RamParts[];
  gpu?: GpuParts;
  pcCase?: CaseParts;
  psu?: PsuParts;
  cooler?: CoolerParts;
  storage: StorageParts[];
};
