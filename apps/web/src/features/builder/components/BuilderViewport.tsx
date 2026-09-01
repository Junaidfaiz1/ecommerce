'use client';

/**
 * Center 3D viewport — highlights active step; muted slots until filled.
 */
import { COMPONENT_SLOTS, type ComponentSlot } from '@vorqen/types';
import { BuilderPcViewer } from '@/features/three-d';
import type { FilledSlots } from '@/features/three-d';
import { isComponentSlot, useBuilderStore } from '../store';

export function BuilderViewport() {
  const parts = useBuilderStore((s) => s.parts);
  const step = useBuilderStore((s) => s.step);

  const filled: FilledSlots = {};
  for (const slot of COMPONENT_SLOTS) {
    filled[slot] = parts.some((p) => p.slot === slot);
  }
  // Always show case shell structure
  filled.CASE = true;

  const highlight: ComponentSlot | null = isComponentSlot(step) ? step : null;

  return (
    <BuilderPcViewer
      className="min-h-[240px] flex-1 overflow-hidden rounded-3xl glass-panel sm:min-h-[280px] lg:min-h-[420px]"
      highlight={highlight}
      filled={filled}
    />
  );
}
