/**
 * Power estimation constants for CompatibilityEngine.
 * Named explicitly — no undocumented magic numbers.
 */

/** Baseline draw for motherboard, fans, drives, and misc (watts). */
export const PLATFORM_OVERHEAD_WATTS = 50;

/** Extra PSU headroom as a fraction of estimated system draw (20%). */
export const PSU_SAFETY_MARGIN_RATIO = 0.2;

/** Soft warning when cooler TDP rating is below this fraction of CPU TDP. */
export const COOLER_TDP_WARNING_RATIO = 0.9;
