'use client';

import type { ProceduralKind } from '@vorqen/types';
import { useThreeDBudgetValue } from '@/components/3d/useThreeDBudget';
import { SLOT_COLORS, kindToSlot } from '../lib';
import { ProceduralPc } from './ProceduralPc';

type Props = {
  kind: ProceduralKind;
  explode?: number;
};

function tone(color: string) {
  return (
    <meshStandardMaterial
      color={color}
      metalness={0.55}
      roughness={0.32}
    />
  );
}

/**
 * Single-component procedural mesh for PDP when no GLB is uploaded.
 */
export function ProceduralPart({ kind, explode = 0 }: Props) {
  const { shadows, cylinderSegments } = useThreeDBudgetValue();

  if (kind === 'pc') {
    return <ProceduralPc explode={explode} />;
  }

  const slot = kindToSlot(kind);
  const color = slot ? SLOT_COLORS[slot] : '#0D47A1';
  const lift = explode * 0.35;
  const shadow = { castShadow: shadows, receiveShadow: shadows };

  switch (kind) {
    case 'gpu':
      return (
        <group position={[0, lift, 0]}>
          <mesh {...shadow}>
            <boxGeometry args={[1.55, 0.28, 0.58]} />
            {tone(color)}
          </mesh>
          <mesh position={[-0.62, 0.02, 0]} castShadow={shadows}>
            <boxGeometry args={[0.28, 0.2, 0.22]} />
            {tone('#1565C0')}
          </mesh>
          <mesh position={[0.15, 0.22, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow={shadows}>
            <cylinderGeometry args={[0.16, 0.16, 0.06, cylinderSegments]} />
            {tone('#90CAF9')}
          </mesh>
          <mesh position={[0.15, 0.22, -0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow={shadows}>
            <cylinderGeometry args={[0.16, 0.16, 0.06, cylinderSegments]} />
            {tone('#90CAF9')}
          </mesh>
        </group>
      );
    case 'cpu':
      return (
        <group position={[0, lift, 0]}>
          <mesh {...shadow}>
            <boxGeometry args={[0.62, 0.08, 0.62]} />
            {tone('#90CAF9')}
          </mesh>
          <mesh position={[0, 0.07, 0]} castShadow={shadows}>
            <boxGeometry args={[0.42, 0.06, 0.42]} />
            {tone(color)}
          </mesh>
        </group>
      );
    case 'motherboard':
      return (
        <group position={[0, lift, 0]} rotation={[-Math.PI / 2.4, 0, 0]}>
          <mesh {...shadow}>
            <boxGeometry args={[1.25, 1.55, 0.05]} />
            {tone(color)}
          </mesh>
          <mesh position={[0.15, 0.2, 0.06]} castShadow={shadows}>
            <boxGeometry args={[0.28, 0.28, 0.04]} />
            {tone('#1565C0')}
          </mesh>
          <mesh position={[-0.35, 0.35, 0.08]} castShadow={shadows}>
            <boxGeometry args={[0.08, 0.55, 0.12]} />
            {tone('#90CAF9')}
          </mesh>
        </group>
      );
    case 'ram':
      return (
        <group position={[0, lift, 0]}>
          <mesh position={[-0.14, 0, 0]} castShadow={shadows}>
            <boxGeometry args={[0.09, 0.62, 0.3]} />
            {tone(color)}
          </mesh>
          <mesh position={[0.14, 0, 0]} castShadow={shadows}>
            <boxGeometry args={[0.09, 0.62, 0.3]} />
            {tone(color)}
          </mesh>
          <mesh position={[-0.14, 0.22, 0]} castShadow={shadows}>
            <boxGeometry args={[0.1, 0.08, 0.32]} />
            {tone('#E3F2FD')}
          </mesh>
          <mesh position={[0.14, 0.22, 0]} castShadow={shadows}>
            <boxGeometry args={[0.1, 0.08, 0.32]} />
            {tone('#E3F2FD')}
          </mesh>
        </group>
      );
    case 'storage':
      return (
        <group position={[0, lift, 0]}>
          <mesh {...shadow}>
            <boxGeometry args={[0.78, 0.07, 1.05]} />
            {tone(color)}
          </mesh>
          <mesh position={[0.28, 0.05, 0.35]} castShadow={shadows}>
            <boxGeometry args={[0.12, 0.04, 0.18]} />
            {tone('#1565C0')}
          </mesh>
        </group>
      );
    case 'psu':
      return (
        <group position={[0, lift, 0]}>
          <mesh {...shadow}>
            <boxGeometry args={[1.15, 0.42, 0.78]} />
            {tone(color)}
          </mesh>
          <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow={shadows}>
            <cylinderGeometry args={[0.16, 0.16, 0.08, cylinderSegments]} />
            {tone('#90CAF9')}
          </mesh>
        </group>
      );
    case 'cooler':
      return (
        <group position={[0, lift, 0]}>
          <mesh castShadow={shadows}>
            <cylinderGeometry args={[0.38, 0.38, 0.72, cylinderSegments]} />
            {tone(color)}
          </mesh>
          <mesh position={[0, 0.42, 0]} castShadow={shadows}>
            <boxGeometry args={[0.72, 0.08, 0.72]} />
            {tone('#90CAF9')}
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow={shadows}>
            <cylinderGeometry args={[0.28, 0.28, 0.04, cylinderSegments]} />
            {tone('#E3F2FD')}
          </mesh>
        </group>
      );
    case 'case':
      return (
        <group position={[0, lift, 0]}>
          <mesh {...shadow}>
            <boxGeometry args={[1.15, 1.7, 0.7]} />
            {tone(color)}
          </mesh>
          <mesh position={[0.58, 0.08, 0]} castShadow={shadows}>
            <boxGeometry args={[0.03, 1.35, 0.48]} />
            {tone('#90CAF9')}
          </mesh>
        </group>
      );
    default:
      return (
        <mesh position={[0, lift, 0]} castShadow={shadows}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          {tone(color)}
        </mesh>
      );
  }
}
