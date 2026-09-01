'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import type { ComponentSlot } from '@vorqen/types';
import { useThreeDBudgetValue } from '@/components/3d/useThreeDBudget';
import { THEME } from '@/theme/palette';
import {
  SLOT_EXPLODE,
  SLOT_REST,
  lerpVec3,
  type FilledSlots,
} from '../lib';
import {
  Fan,
  HW,
  InteriorLight,
  StudioBox,
  StudioCyl,
  withSlotTone,
  type StudioTone,
} from './StudioPrimitives';

type PartProps = {
  slot: ComponentSlot;
  explode: number;
  highlight?: ComponentSlot | null;
  filled?: FilledSlots;
  children: ReactNode;
};

function SlotGroup({ slot, explode, children }: PartProps) {
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const rest = SLOT_REST[slot];
    const off = SLOT_EXPLODE[slot];
    const target = lerpVec3(
      rest,
      [rest[0] + off[0], rest[1] + off[1], rest[2] + off[2]],
      explode,
    );
    const k = Math.min(1, delta * 6);
    g.position.x += (target[0] - g.position.x) * k;
    g.position.y += (target[1] - g.position.y) * k;
    g.position.z += (target[2] - g.position.z) * k;
  });

  return (
    <group ref={ref} position={SLOT_REST[slot]}>
      {children}
    </group>
  );
}

function slotOverlay(
  slot: ComponentSlot,
  highlight: ComponentSlot | null | undefined,
  filled: FilledSlots | undefined,
): Pick<StudioTone, 'opacity' | 'emissive' | 'emissiveIntensity'> {
  const isHighlight = highlight === slot;
  const isFilled = !filled || filled[slot] === true || slot === 'CASE';
  return {
    opacity: isFilled ? 1 : 0.18,
    emissive: isHighlight ? THEME.sage : '#000000',
    emissiveIntensity: isHighlight ? 0.22 : 0,
  };
}

function CaseShell({ tone }: { tone: StudioTone }) {
  const { environment } = useThreeDBudgetValue();
  const metal: StudioTone = {
    ...tone,
    color: HW.chassis,
    metalness: 0.84,
    roughness: 0.28,
  };
  const edge: StudioTone = {
    ...tone,
    color: HW.chassisEdge,
    metalness: 0.78,
    roughness: 0.34,
  };
  const glass: StudioTone = {
    ...tone,
    color: HW.glass,
    metalness: 0.05,
    roughness: 0.06,
    transmission: environment ? 0.72 : 0,
    opacity: environment ? 1 : 0.16,
  };

  return (
    <group>
      {/* Left tray (motherboard side) */}
      <StudioBox args={[0.03, 1.42, 0.5]} position={[-0.42, 0.02, 0]} tone={metal} />
      {/* Right smoked glass (must stay a thin pane, not a solid wall) */}
      <StudioBox args={[0.01, 1.26, 0.44]} position={[0.435, 0.06, 0]} tone={glass} />
      <StudioBox args={[0.018, 1.34, 0.028]} position={[0.44, 0.04, 0.236]} tone={edge} />
      <StudioBox args={[0.018, 1.34, 0.028]} position={[0.44, 0.04, -0.236]} tone={edge} />
      <StudioBox args={[0.018, 0.028, 0.5]} position={[0.44, 0.71, 0]} tone={edge} />
      <StudioBox args={[0.018, 0.028, 0.5]} position={[0.44, -0.63, 0]} tone={edge} />
      {/* Top */}
      <StudioBox args={[0.88, 0.03, 0.52]} position={[0, 0.74, 0]} tone={metal} radius={0.01} />
      {/* Bottom */}
      <StudioBox args={[0.88, 0.04, 0.52]} position={[0, -0.72, 0]} tone={metal} radius={0.01} />
      {/* Front fascia */}
      <StudioBox args={[0.86, 1.44, 0.04]} position={[0, 0.02, 0.26]} tone={edge} radius={0.012} />
      {/* Rear */}
      <StudioBox args={[0.86, 1.4, 0.03]} position={[0, 0.02, -0.255]} tone={metal} />
      {/* PSU shroud */}
      <StudioBox args={[0.78, 0.16, 0.46]} position={[0.02, -0.52, 0.02]} tone={edge} radius={0.01} />
      {/* Feet */}
      <StudioBox args={[0.12, 0.04, 0.12]} position={[-0.32, -0.78, 0.18]} tone={edge} radius={0.02} />
      <StudioBox args={[0.12, 0.04, 0.12]} position={[0.32, -0.78, 0.18]} tone={edge} radius={0.02} />
      <StudioBox args={[0.12, 0.04, 0.12]} position={[-0.32, -0.78, -0.18]} tone={edge} radius={0.02} />
      <StudioBox args={[0.12, 0.04, 0.12]} position={[0.32, -0.78, -0.18]} tone={edge} radius={0.02} />
      {/* Rear I/O + exhaust */}
      <StudioBox args={[0.22, 0.12, 0.02]} position={[-0.28, 0.42, -0.272]} tone={{ ...tone, color: HW.aluminum, metalness: 0.7, roughness: 0.4 }} />
      <Fan position={[0.12, 0.28, -0.28]} radius={0.09} />
      {/* Front intake */}
      <Fan position={[-0.12, 0.08, 0.285]} radius={0.1} />
      <Fan position={[0.14, 0.08, 0.285]} radius={0.1} />
      <Fan position={[0.01, -0.18, 0.285]} radius={0.09} />
    </group>
  );
}

/**
 * Mid-tower studio chassis — hollow aluminum + smoked glass, hardware PBR.
 * Used until a product-specific GLB is uploaded to R2.
 */
export function ProceduralPc({
  explode = 0,
  highlight = null,
  filled,
}: {
  explode?: number;
  highlight?: ComponentSlot | null;
  filled?: FilledSlots;
}) {
  const { cylinderSegments } = useThreeDBudgetValue();
  const overlay = (slot: ComponentSlot) => slotOverlay(slot, highlight, filled);

  return (
    <group>
      <InteriorLight />
      <SlotGroup slot="CASE" explode={explode} highlight={highlight} filled={filled}>
        <CaseShell tone={withSlotTone({ color: HW.chassis }, overlay('CASE'))} />
      </SlotGroup>

      <SlotGroup slot="MOTHERBOARD" explode={explode} highlight={highlight} filled={filled}>
        <StudioBox
          args={[0.02, 0.72, 0.58]}
          tone={withSlotTone(
            { color: HW.pcb, metalness: 0.12, roughness: 0.55 },
            overlay('MOTHERBOARD'),
          )}
        />
        <StudioBox
          args={[0.03, 0.16, 0.2]}
          position={[0.03, -0.22, 0.12]}
          tone={withSlotTone(
            { color: HW.socket, metalness: 0.4, roughness: 0.45 },
            overlay('MOTHERBOARD'),
          )}
        />
        <StudioBox
          args={[0.04, 0.08, 0.16]}
          position={[0.04, 0.28, -0.18]}
          tone={withSlotTone(
            { color: HW.gold, metalness: 0.85, roughness: 0.25 },
            overlay('MOTHERBOARD'),
          )}
        />
      </SlotGroup>

      <SlotGroup slot="CPU" explode={explode} highlight={highlight} filled={filled}>
        <StudioBox
          args={[0.05, 0.035, 0.16]}
          tone={withSlotTone(
            { color: HW.socket, metalness: 0.5, roughness: 0.4 },
            overlay('CPU'),
          )}
        />
        <StudioBox
          args={[0.12, 0.018, 0.12]}
          position={[0.04, 0.028, 0]}
          tone={withSlotTone(
            { color: HW.ihs, metalness: 0.88, roughness: 0.22 },
            overlay('CPU'),
          )}
        />
      </SlotGroup>

      <SlotGroup slot="COOLER" explode={explode} highlight={highlight} filled={filled}>
        <StudioCyl
          args={[0.055, 0.055, 0.05, cylinderSegments]}
          position={[0, -0.06, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          tone={withSlotTone(
            { color: HW.chassisEdge, metalness: 0.7, roughness: 0.3 },
            overlay('COOLER'),
          )}
        />
        <StudioBox
          args={[0.36, 0.07, 0.42]}
          position={[0.08, 0.28, 0]}
          tone={withSlotTone(
            { color: HW.shroud, metalness: 0.65, roughness: 0.38 },
            overlay('COOLER'),
          )}
          radius={0.012}
        />
        <Fan position={[-0.04, 0.28, 0.12]} rotation={[Math.PI / 2, 0, 0]} radius={0.08} />
        <Fan position={[0.16, 0.28, 0.12]} rotation={[Math.PI / 2, 0, 0]} radius={0.08} />
      </SlotGroup>

      <SlotGroup slot="GPU" explode={explode} highlight={highlight} filled={filled}>
        <StudioBox
          args={[0.42, 0.1, 0.7]}
          tone={withSlotTone(
            { color: HW.shroud, metalness: 0.62, roughness: 0.36 },
            overlay('GPU'),
          )}
          radius={0.016}
        />
        <StudioBox
          args={[0.02, 0.12, 0.7]}
          position={[-0.22, -0.01, 0]}
          tone={withSlotTone(
            { color: HW.aluminum, metalness: 0.8, roughness: 0.3 },
            overlay('GPU'),
          )}
        />
        <Fan position={[0.22, 0, 0.18]} rotation={[0, Math.PI / 2, 0]} radius={0.085} />
        <Fan position={[0.22, 0, 0]} rotation={[0, Math.PI / 2, 0]} radius={0.085} />
        <Fan position={[0.22, 0, -0.18]} rotation={[0, Math.PI / 2, 0]} radius={0.085} />
      </SlotGroup>

      <SlotGroup slot="RAM" explode={explode} highlight={highlight} filled={filled}>
        <StudioBox
          args={[0.04, 0.2, 0.14]}
          position={[0, 0, 0.04]}
          tone={withSlotTone(
            { color: HW.ram, metalness: 0.75, roughness: 0.28 },
            overlay('RAM'),
          )}
          radius={0.006}
        />
        <StudioBox
          args={[0.04, 0.2, 0.14]}
          position={[0, 0, -0.05]}
          tone={withSlotTone(
            { color: HW.ram, metalness: 0.75, roughness: 0.28 },
            overlay('RAM'),
          )}
          radius={0.006}
        />
      </SlotGroup>

      <SlotGroup slot="STORAGE" explode={explode} highlight={highlight} filled={filled}>
        <StudioBox
          args={[0.22, 0.02, 0.32]}
          tone={withSlotTone(
            { color: HW.mesh, metalness: 0.55, roughness: 0.4 },
            overlay('STORAGE'),
          )}
        />
        <StudioBox
          args={[0.08, 0.015, 0.1]}
          position={[0.05, 0.015, 0.08]}
          tone={withSlotTone(
            { color: HW.aluminum, metalness: 0.7, roughness: 0.35 },
            overlay('STORAGE'),
          )}
        />
      </SlotGroup>

      <SlotGroup slot="PSU" explode={explode} highlight={highlight} filled={filled}>
        <StudioBox
          args={[0.5, 0.16, 0.36]}
          tone={withSlotTone(
            { color: HW.psu, metalness: 0.7, roughness: 0.38 },
            overlay('PSU'),
          )}
          radius={0.012}
        />
        <Fan position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.07} />
      </SlotGroup>
    </group>
  );
}
