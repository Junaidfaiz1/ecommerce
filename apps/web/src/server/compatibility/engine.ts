import type { CompatibilityResult } from '@vorqen/types';
import {
  COOLER_TDP_WARNING_RATIO,
  PLATFORM_OVERHEAD_WATTS,
  PSU_SAFETY_MARGIN_RATIO,
} from './constants';
import type { ResolvedBuild } from './parts';

function estimateSystemWattage(build: ResolvedBuild): number {
  let draw = PLATFORM_OVERHEAD_WATTS;
  if (build.cpu) draw += build.cpu.tdpWatts;
  if (build.gpu) draw += build.gpu.tdpWatts;
  // Modest storage / cooler allowance already covered by platform overhead.
  return draw;
}

function recommendedPsuFromEstimate(estimatedWattage: number): number {
  return Math.ceil(estimatedWattage * (1 + PSU_SAFETY_MARGIN_RATIO));
}

/**
 * Pure compatibility authority. Callers pass resolved typed hardware —
 * never trust client-computed results.
 */
export function evaluateCompatibility(build: ResolvedBuild): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const { cpu, motherboard, ram, gpu, pcCase, psu, cooler, storage } = build;

  // ── CPU ↔ Motherboard ────────────────────────────────────────────────────
  if (cpu && motherboard) {
    if (cpu.socket !== motherboard.socket) {
      errors.push(
        `CPU socket ${cpu.socket} does not match motherboard socket ${motherboard.socket}.`,
      );
    }
    if (cpu.memoryType !== motherboard.memoryType) {
      warnings.push(
        `CPU prefers ${cpu.memoryType} while motherboard is ${motherboard.memoryType}.`,
      );
    }
  }

  // ── RAM ↔ Motherboard ────────────────────────────────────────────────────
  if (motherboard && ram.length > 0) {
    let totalCapacity = 0;
    let totalModules = 0;

    for (const kit of ram) {
      const qty = kit.quantity;
      totalCapacity += kit.capacityGb * qty;
      totalModules += kit.modules * qty;

      if (kit.memoryType !== motherboard.memoryType) {
        errors.push(
          `RAM ${kit.name} is ${kit.memoryType}; motherboard requires ${motherboard.memoryType}.`,
        );
      }

      if (
        motherboard.maxMemorySpeedMhz != null &&
        kit.speedMhz > motherboard.maxMemorySpeedMhz
      ) {
        warnings.push(
          `RAM ${kit.name} runs at ${kit.speedMhz} MHz; motherboard max rated is ${motherboard.maxMemorySpeedMhz} MHz (may downclock).`,
        );
      }
    }

    if (totalModules > motherboard.memorySlots) {
      errors.push(
        `Selected RAM uses ${totalModules} modules but motherboard has ${motherboard.memorySlots} slots.`,
      );
    }

    if (totalCapacity > motherboard.maxMemoryGb) {
      errors.push(
        `Selected RAM totals ${totalCapacity} GB; motherboard max is ${motherboard.maxMemoryGb} GB.`,
      );
    }
  }

  // ── Cooler ↔ CPU ─────────────────────────────────────────────────────────
  if (cpu && cooler) {
    if (!cooler.supportedSockets.includes(cpu.socket)) {
      errors.push(
        `Cooler ${cooler.name} does not support CPU socket ${cpu.socket}.`,
      );
    }

    if (
      cooler.tdpRatingWatts != null &&
      cooler.tdpRatingWatts < cpu.tdpWatts * COOLER_TDP_WARNING_RATIO
    ) {
      warnings.push(
        `Cooler TDP rating (${cooler.tdpRatingWatts} W) may be insufficient for CPU TDP (${cpu.tdpWatts} W).`,
      );
    }
  }

  // ── Motherboard ↔ Case ───────────────────────────────────────────────────
  if (motherboard && pcCase) {
    if (!pcCase.supportedFormFactors.includes(motherboard.formFactor)) {
      errors.push(
        `Case ${pcCase.name} does not support motherboard form factor ${motherboard.formFactor}.`,
      );
    }
  }

  // ── GPU ↔ Case ───────────────────────────────────────────────────────────
  if (gpu && pcCase) {
    if (gpu.lengthMm > pcCase.maxGpuLengthMm) {
      errors.push(
        `GPU ${gpu.name} is ${gpu.lengthMm} mm; case clearance is ${pcCase.maxGpuLengthMm} mm.`,
      );
    }
  }

  // ── Cooler ↔ Case ────────────────────────────────────────────────────────
  if (cooler && pcCase) {
    if (
      cooler.heightMm != null &&
      cooler.heightMm > pcCase.maxCoolerHeightMm
    ) {
      errors.push(
        `Cooler height ${cooler.heightMm} mm exceeds case max cooler height ${pcCase.maxCoolerHeightMm} mm.`,
      );
    }

    if (
      cooler.radiatorMm != null &&
      pcCase.maxRadiatorMm != null &&
      cooler.radiatorMm > pcCase.maxRadiatorMm
    ) {
      errors.push(
        `Cooler radiator ${cooler.radiatorMm} mm exceeds case max radiator ${pcCase.maxRadiatorMm} mm.`,
      );
    } else if (cooler.radiatorMm != null && pcCase.maxRadiatorMm == null) {
      warnings.push(
        `Case does not list radiator support; verify ${cooler.radiatorMm} mm AIO fit manually.`,
      );
    }
  }

  // ── PSU ↔ Case ───────────────────────────────────────────────────────────
  if (psu && pcCase) {
    if (psu.formFactor !== pcCase.psuFormFactor) {
      errors.push(
        `PSU form factor ${psu.formFactor} does not match case PSU form factor ${pcCase.psuFormFactor}.`,
      );
    }
  }

  // ── Storage ↔ Motherboard ────────────────────────────────────────────────
  if (motherboard && storage.length > 0) {
    let m2Count = 0;
    let sataCount = 0;

    for (const drive of storage) {
      const qty = drive.quantity;
      if (drive.interface === 'NVME_M2') {
        m2Count += qty;
      } else if (
        drive.interface === 'SATA_SSD' ||
        drive.interface === 'SATA_HDD'
      ) {
        sataCount += qty;
      }
    }

    if (m2Count > motherboard.m2Slots) {
      errors.push(
        `Build needs ${m2Count} M.2 drive(s) but motherboard has ${motherboard.m2Slots} M.2 slot(s).`,
      );
    }

    if (sataCount > motherboard.sataPorts) {
      errors.push(
        `Build needs ${sataCount} SATA drive(s) but motherboard has ${motherboard.sataPorts} SATA port(s).`,
      );
    }
  }

  // ── Power / PSU ──────────────────────────────────────────────────────────
  const hasPowerParts = Boolean(cpu || gpu);
  const estimatedWattage = hasPowerParts ? estimateSystemWattage(build) : null;
  const recommendedPsuWatts =
    estimatedWattage != null
      ? recommendedPsuFromEstimate(estimatedWattage)
      : null;

  if (psu && recommendedPsuWatts != null && estimatedWattage != null) {
    if (psu.wattage < recommendedPsuWatts) {
      errors.push(
        `PSU ${psu.name} is ${psu.wattage} W; estimated system draw is ${estimatedWattage} W requiring at least ${recommendedPsuWatts} W with ${Math.round(PSU_SAFETY_MARGIN_RATIO * 100)}% safety margin.`,
      );
    }

    if (
      gpu?.recommendedPsuWatts != null &&
      psu.wattage < gpu.recommendedPsuWatts
    ) {
      warnings.push(
        `GPU vendor recommends a ${gpu.recommendedPsuWatts} W PSU; selected PSU is ${psu.wattage} W.`,
      );
    }
  }

  if (gpu && !psu) {
    recommendations.push(
      `Select a PSU of at least ${recommendedPsuWatts ?? gpu.recommendedPsuWatts ?? 'adequate'} W for this GPU.`,
    );
  }

  // ── Completeness recommendations ─────────────────────────────────────────
  if (!cpu) recommendations.push('Add a CPU to complete the build.');
  if (!motherboard)
    recommendations.push('Add a motherboard to complete the build.');
  if (ram.length === 0) recommendations.push('Add RAM to complete the build.');
  if (!gpu)
    recommendations.push(
      'Add a discrete GPU (or confirm iGPU use) for a gaming build.',
    );
  if (!psu) recommendations.push('Add a PSU to complete the build.');
  if (!pcCase) recommendations.push('Add a case to complete the build.');
  if (!cooler) recommendations.push('Add a CPU cooler to complete the build.');
  if (storage.length === 0)
    recommendations.push('Add storage to complete the build.');

  if (gpu?.powerConnectors) {
    recommendations.push(
      `Ensure the PSU cable kit includes ${gpu.powerConnectors} for the selected GPU.`,
    );
  }

  return {
    compatible: errors.length === 0,
    errors,
    warnings,
    recommendations,
    estimatedWattage,
    recommendedPsuWatts,
  };
}

export { estimateSystemWattage, recommendedPsuFromEstimate };
