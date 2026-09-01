'use client';

import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import { useThreeDBudgetValue } from '@/components/3d/useThreeDBudget';

export type StudioTone = {
  color: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transmission?: number;
};

export const HW = {
  chassis: '#1A1C20',
  chassisEdge: '#2C3038',
  aluminum: '#8E949E',
  glass: '#A8B4C4',
  interior: '#0C0D10',
  pcb: '#143024',
  socket: '#1A1E24',
  gold: '#C4A574',
  ihs: '#C8CDD4',
  shroud: '#1C1F26',
  fanRing: '#3A404A',
  ram: '#D5D9E0',
  psu: '#14161A',
  mesh: '#242830',
} as const;

type ShadowMesh = {
  castShadow?: boolean;
  receiveShadow?: boolean;
};

function useShadow(): ShadowMesh {
  const { shadows } = useThreeDBudgetValue();
  return { castShadow: shadows, receiveShadow: shadows };
}

function StudioMaterial({ tone }: { tone: StudioTone }) {
  const opacity = tone.opacity ?? 1;
  const transmission = tone.transmission ?? 0;
  return (
    <meshPhysicalMaterial
      color={tone.color}
      metalness={tone.metalness ?? 0.72}
      roughness={tone.roughness ?? 0.32}
      transparent={opacity < 1 || transmission > 0}
      opacity={opacity}
      transmission={transmission}
      thickness={transmission > 0 ? 0.035 : 0}
      ior={1.5}
      emissive={tone.emissive ?? '#000000'}
      emissiveIntensity={tone.emissiveIntensity ?? 0}
      envMapIntensity={1.05}
    />
  );
}

export function StudioBox({
  args,
  position,
  rotation,
  tone,
  radius,
}: {
  args: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  tone: StudioTone;
  radius?: number;
}) {
  const shadow = useShadow();
  const material = <StudioMaterial tone={tone} />;
  if (radius) {
    return (
      <RoundedBox
        args={args}
        radius={radius}
        smoothness={3}
        position={position}
        rotation={rotation}
        {...shadow}
      >
        {material}
      </RoundedBox>
    );
  }
  return (
    <mesh position={position} rotation={rotation} {...shadow}>
      <boxGeometry args={args} />
      {material}
    </mesh>
  );
}

export function StudioCyl({
  args,
  position,
  rotation,
  tone,
}: {
  args: [number, number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  tone: StudioTone;
}) {
  const shadow = useShadow();
  return (
    <mesh position={position} rotation={rotation} {...shadow}>
      <cylinderGeometry args={args} />
      <StudioMaterial tone={tone} />
    </mesh>
  );
}

export function Fan({
  position,
  rotation,
  radius = 0.1,
  spin = true,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  spin?: boolean;
}) {
  const blades = useRef<Group>(null);
  const { cylinderSegments, frameloop, paused } = useThreeDBudgetValue();
  const animate = spin && frameloop === 'always' && !paused;

  useFrame((_, delta) => {
    if (!animate || !blades.current) return;
    blades.current.rotation.z -= delta * 7.5;
  });

  const ring = {
    color: HW.fanRing,
    metalness: 0.55,
    roughness: 0.4,
  };
  const hub = {
    color: HW.chassisEdge,
    metalness: 0.5,
    roughness: 0.45,
  };

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <torusGeometry args={[radius, radius * 0.07, 8, cylinderSegments]} />
        <StudioMaterial tone={ring} />
      </mesh>
      <group ref={blades}>
        {([0, 1, 2, 3, 4] as const).map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]}>
            <boxGeometry args={[radius * 0.18, radius * 1.55, 0.008]} />
            <StudioMaterial
              tone={{ color: '#C5CAD2', metalness: 0.35, roughness: 0.28 }}
            />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry
            args={[radius * 0.28, radius * 0.28, 0.02, cylinderSegments]}
          />
          <StudioMaterial tone={hub} />
        </mesh>
      </group>
    </group>
  );
}

export function withSlotTone(
  base: StudioTone,
  overlay: Pick<StudioTone, 'opacity' | 'emissive' | 'emissiveIntensity'>,
): StudioTone {
  return { ...base, ...overlay };
}

export function InteriorLight({ children }: { children?: ReactNode }) {
  return (
    <group>
      <pointLight
        position={[0.12, 0.16, 0.04]}
        intensity={0.28}
        distance={1.6}
        color="#efe8dc"
      />
      {children}
    </group>
  );
}
