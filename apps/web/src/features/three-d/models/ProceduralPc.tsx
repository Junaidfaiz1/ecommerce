'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import type { ComponentSlot } from '@vorqen/types';
import {
  SLOT_COLORS,
  SLOT_EXPLODE,
  SLOT_REST,
  lerpVec3,
  type FilledSlots,
} from '../lib';

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

type MeshTone = {
  color: string;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
};

function Box({
  args,
  position,
  tone,
}: {
  args: [number, number, number];
  position?: [number, number, number];
  tone: MeshTone;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={tone.color}
        metalness={0.55}
        roughness={0.35}
        transparent={(tone.opacity ?? 1) < 1}
        opacity={tone.opacity ?? 1}
        emissive={tone.emissive ?? '#000000'}
        emissiveIntensity={tone.emissiveIntensity ?? 0}
      />
    </mesh>
  );
}

function partTone(
  slot: ComponentSlot,
  highlight: ComponentSlot | null | undefined,
  filled: FilledSlots | undefined,
): MeshTone {
  const isHighlight = highlight === slot;
  const isFilled = !filled || filled[slot] === true || slot === 'CASE';
  return {
    color: SLOT_COLORS[slot],
    opacity: isFilled ? 1 : 0.2,
    emissive: isHighlight ? '#6d7cff' : '#000000',
    emissiveIntensity: isHighlight ? 0.5 : 0,
  };
}

export type ProceduralPcProps = {
  explode?: number;
  highlight?: ComponentSlot | null;
  filled?: FilledSlots;
};

/**
 * Demo chassis — premium laboratory look until licensed GLBs ship via R2.
 */
export function ProceduralPc({
  explode = 0,
  highlight = null,
  filled,
}: ProceduralPcProps) {
  return (
    <group>
      <SlotGroup slot="CASE" explode={explode} highlight={highlight} filled={filled}>
        {/* Outer shell */}
        <Box args={[0.95, 1.35, 0.55]} tone={partTone('CASE', highlight, filled)} />
        {/* Glass side panel hint */}
        <mesh position={[0.48, 0.05, 0]} castShadow>
          <boxGeometry args={[0.02, 1.15, 0.42]} />
          <meshStandardMaterial
            color="#8a9bb8"
            metalness={0.1}
            roughness={0.15}
            transparent
            opacity={0.18}
          />
        </mesh>
      </SlotGroup>

      <SlotGroup slot="MOTHERBOARD" explode={explode} highlight={highlight} filled={filled}>
        <Box
          args={[0.55, 0.7, 0.03]}
          tone={partTone('MOTHERBOARD', highlight, filled)}
        />
      </SlotGroup>

      <SlotGroup slot="CPU" explode={explode} highlight={highlight} filled={filled}>
        <Box args={[0.14, 0.04, 0.14]} tone={partTone('CPU', highlight, filled)} />
      </SlotGroup>

      <SlotGroup slot="COOLER" explode={explode} highlight={highlight} filled={filled}>
        <Box args={[0.22, 0.28, 0.22]} tone={partTone('COOLER', highlight, filled)} />
        <Box
          args={[0.28, 0.04, 0.28]}
          position={[0, 0.16, 0]}
          tone={partTone('COOLER', highlight, filled)}
        />
      </SlotGroup>

      <SlotGroup slot="GPU" explode={explode} highlight={highlight} filled={filled}>
        <Box args={[0.55, 0.1, 0.22]} tone={partTone('GPU', highlight, filled)} />
        <Box
          args={[0.12, 0.08, 0.08]}
          position={[-0.28, 0, 0]}
          tone={partTone('GPU', highlight, filled)}
        />
      </SlotGroup>

      <SlotGroup slot="RAM" explode={explode} highlight={highlight} filled={filled}>
        <Box args={[0.04, 0.22, 0.12]} position={[-0.06, 0, 0]} tone={partTone('RAM', highlight, filled)} />
        <Box args={[0.04, 0.22, 0.12]} position={[0.02, 0, 0]} tone={partTone('RAM', highlight, filled)} />
      </SlotGroup>

      <SlotGroup slot="STORAGE" explode={explode} highlight={highlight} filled={filled}>
        <Box args={[0.18, 0.03, 0.28]} tone={partTone('STORAGE', highlight, filled)} />
      </SlotGroup>

      <SlotGroup slot="PSU" explode={explode} highlight={highlight} filled={filled}>
        <Box args={[0.5, 0.18, 0.35]} tone={partTone('PSU', highlight, filled)} />
      </SlotGroup>
    </group>
  );
}
