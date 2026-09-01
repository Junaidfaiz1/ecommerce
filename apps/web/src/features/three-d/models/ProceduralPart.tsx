'use client';

import type { ProceduralKind } from '@vorqen/types';
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
  if (kind === 'pc') {
    return <ProceduralPc explode={explode} />;
  }

  const slot = kindToSlot(kind);
  const color = slot ? SLOT_COLORS[slot] : '#4a5060';
  const lift = explode * 0.35;

  switch (kind) {
    case 'gpu':
      return (
        <group position={[0, lift, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.22, 0.55]} />
            {tone(color)}
          </mesh>
          <mesh position={[-0.55, 0, 0]} castShadow>
            <boxGeometry args={[0.25, 0.18, 0.2]} />
            {tone('#2a3040')}
          </mesh>
        </group>
      );
    case 'cpu':
      return (
        <mesh position={[0, lift, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.12, 0.55]} />
          {tone(color)}
        </mesh>
      );
    case 'motherboard':
      return (
        <mesh position={[0, lift, 0]} castShadow receiveShadow rotation={[-Math.PI / 2.4, 0, 0]}>
          <boxGeometry args={[1.2, 1.5, 0.06]} />
          {tone(color)}
        </mesh>
      );
    case 'ram':
      return (
        <group position={[0, lift, 0]}>
          <mesh position={[-0.12, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.55, 0.28]} />
            {tone(color)}
          </mesh>
          <mesh position={[0.12, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.55, 0.28]} />
            {tone(color)}
          </mesh>
        </group>
      );
    case 'storage':
      return (
        <mesh position={[0, lift, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.08, 1]} />
          {tone(color)}
        </mesh>
      );
    case 'psu':
      return (
        <mesh position={[0, lift, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.4, 0.75]} />
          {tone(color)}
        </mesh>
      );
    case 'cooler':
      return (
        <group position={[0, lift, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.7, 24]} />
            {tone(color)}
          </mesh>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.7, 0.08, 0.7]} />
            {tone('#6a7388')}
          </mesh>
        </group>
      );
    case 'case':
      return (
        <group position={[0, lift, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.1, 1.6, 0.65]} />
            {tone(color)}
          </mesh>
        </group>
      );
    default:
      return (
        <mesh position={[0, lift, 0]} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          {tone(color)}
        </mesh>
      );
  }
}
