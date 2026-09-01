export {
  PLATFORM_OVERHEAD_WATTS,
  PSU_SAFETY_MARGIN_RATIO,
  COOLER_TDP_WARNING_RATIO,
} from './constants';
export {
  evaluateCompatibility,
  estimateSystemWattage,
  recommendedPsuFromEstimate,
} from './engine';
export { checkCompatibility, mapProductsToBuild } from './compatibility.service';
export type {
  ResolvedBuild,
  CpuParts,
  MotherboardParts,
  RamParts,
  GpuParts,
  CaseParts,
  PsuParts,
  CoolerParts,
  StorageParts,
} from './parts';
