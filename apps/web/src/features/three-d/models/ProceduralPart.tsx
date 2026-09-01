'use client';

import type { ProceduralKind } from '@vorqen/types';
import { useThreeDBudgetValue } from '@/components/3d/useThreeDBudget';
import { ProceduralPc } from './ProceduralPc';
import {
  Fan,
  HW,
  StudioBox,
  StudioCyl,
  type StudioTone,
} from './StudioPrimitives';

type Props = {
  kind: ProceduralKind;
  explode?: number;
};

const metal: StudioTone = {
  color: HW.shroud,
  metalness: 0.68,
  roughness: 0.32,
};

/**
 * Single-component studio mesh for PDP when no product GLB is uploaded.
 */
export function ProceduralPart({ kind, explode = 0 }: Props) {
  const { cylinderSegments } = useThreeDBudgetValue();
  const lift = explode * 0.35;

  if (kind === 'pc') {
    return <ProceduralPc explode={explode} />;
  }

  switch (kind) {
    case 'gpu':
      return (
        <group position={[0, lift, 0]}>
          <StudioBox args={[1.55, 0.26, 0.52]} tone={metal} radius={0.03} />
          <StudioBox
            args={[0.08, 0.28, 0.52]}
            position={[-0.78, 0, 0]}
            tone={{ color: HW.aluminum, metalness: 0.82, roughness: 0.28 }}
          />
          <StudioBox
            args={[0.22, 0.14, 0.18]}
            position={[-0.58, -0.02, 0]}
            tone={{ color: HW.chassisEdge, metalness: 0.6, roughness: 0.4 }}
          />
          <Fan position={[-0.12, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} radius={0.16} />
          <Fan position={[0.28, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} radius={0.16} />
          <Fan position={[0.66, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} radius={0.14} />
        </group>
      );
    case 'cpu':
      return (
        <group position={[0, lift, 0]}>
          <StudioBox
            args={[0.72, 0.06, 0.72]}
            tone={{ color: HW.pcb, metalness: 0.15, roughness: 0.5 }}
          />
          <StudioBox
            args={[0.42, 0.045, 0.42]}
            position={[0, 0.05, 0]}
            tone={{ color: HW.ihs, metalness: 0.9, roughness: 0.2 }}
            radius={0.02}
          />
          <StudioBox
            args={[0.08, 0.02, 0.08]}
            position={[0.28, 0.04, 0.28]}
            tone={{ color: HW.gold, metalness: 0.85, roughness: 0.28 }}
          />
        </group>
      );
    case 'motherboard':
      return (
        <group position={[0, lift, 0]} rotation={[-Math.PI / 2.5, 0, 0]}>
          <StudioBox
            args={[1.28, 1.58, 0.04]}
            tone={{ color: HW.pcb, metalness: 0.12, roughness: 0.52 }}
          />
          <StudioBox
            args={[0.32, 0.32, 0.05]}
            position={[0.12, 0.18, 0.05]}
            tone={{ color: HW.socket, metalness: 0.45, roughness: 0.4 }}
          />
          <StudioBox
            args={[0.08, 0.55, 0.14]}
            position={[-0.38, 0.32, 0.08]}
            tone={{ color: HW.ram, metalness: 0.75, roughness: 0.28 }}
          />
          <StudioBox
            args={[0.08, 0.55, 0.14]}
            position={[-0.26, 0.32, 0.08]}
            tone={{ color: HW.ram, metalness: 0.75, roughness: 0.28 }}
          />
        </group>
      );
    case 'ram':
      return (
        <group position={[0, lift, 0]}>
          <StudioBox
            args={[0.08, 0.62, 0.3]}
            position={[-0.14, 0, 0]}
            tone={{ color: HW.ram, metalness: 0.78, roughness: 0.26 }}
            radius={0.01}
          />
          <StudioBox
            args={[0.08, 0.62, 0.3]}
            position={[0.14, 0, 0]}
            tone={{ color: HW.ram, metalness: 0.78, roughness: 0.26 }}
            radius={0.01}
          />
          <StudioBox
            args={[0.09, 0.06, 0.32]}
            position={[-0.14, -0.28, 0]}
            tone={{ color: HW.gold, metalness: 0.8, roughness: 0.3 }}
          />
          <StudioBox
            args={[0.09, 0.06, 0.32]}
            position={[0.14, -0.28, 0]}
            tone={{ color: HW.gold, metalness: 0.8, roughness: 0.3 }}
          />
        </group>
      );
    case 'storage':
      return (
        <group position={[0, lift, 0]}>
          <StudioBox
            args={[0.82, 0.06, 1.08]}
            tone={{ color: HW.mesh, metalness: 0.55, roughness: 0.42 }}
            radius={0.012}
          />
          <StudioBox
            args={[0.14, 0.03, 0.2]}
            position={[0.28, 0.04, 0.38]}
            tone={{ color: HW.aluminum, metalness: 0.7, roughness: 0.35 }}
          />
        </group>
      );
    case 'psu':
      return (
        <group position={[0, lift, 0]}>
          <StudioBox
            args={[1.18, 0.4, 0.78]}
            tone={{ color: HW.psu, metalness: 0.72, roughness: 0.36 }}
            radius={0.02}
          />
          <StudioCyl
            args={[0.16, 0.16, 0.06, cylinderSegments]}
            position={[0.48, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            tone={{ color: HW.fanRing, metalness: 0.55, roughness: 0.4 }}
          />
          <Fan position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.14} />
        </group>
      );
    case 'cooler':
      return (
        <group position={[0, lift, 0]}>
          <StudioCyl
            args={[0.36, 0.36, 0.68, cylinderSegments]}
            tone={{ color: HW.aluminum, metalness: 0.8, roughness: 0.3 }}
          />
          <StudioBox
            args={[0.72, 0.07, 0.72]}
            position={[0, 0.4, 0]}
            tone={{ color: HW.shroud, metalness: 0.6, roughness: 0.38 }}
            radius={0.015}
          />
          <Fan position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]} radius={0.24} />
        </group>
      );
    case 'case':
      return (
        <group position={[0, lift, 0]} scale={0.85}>
          <ProceduralPc />
        </group>
      );
    default:
      return (
        <group position={[0, lift, 0]}>
          <StudioBox
            args={[0.72, 0.72, 0.72]}
            tone={{ color: HW.chassis, metalness: 0.7, roughness: 0.35 }}
            radius={0.04}
          />
        </group>
      );
  }
}
