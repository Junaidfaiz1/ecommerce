'use client';

import { useGLTF } from '@react-three/drei';
import { Component, Suspense, type ReactNode } from 'react';
import {
  isProceduralAssetUrl,
  parseProceduralKind,
} from '@vorqen/types';
import type { ComponentSlot } from '@vorqen/types';
import type { FilledSlots } from '../lib';
import { ProceduralPart } from './ProceduralPart';
import { ProceduralPc } from './ProceduralPc';

type GlbMeshProps = {
  url: string;
};

function GlbMesh({ url }: GlbMeshProps) {
  const gltf = useGLTF(url, true);
  return (
    <primitive object={gltf.scene.clone()} dispose={null} />
  );
}

class GlbErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

export type AssetModelProps = {
  glbUrl: string;
  explode?: number;
  highlight?: ComponentSlot | null;
  filled?: FilledSlots;
  /** Prefer full PC assembly (hero / builder). */
  preferPcAssembly?: boolean;
};

function ProceduralFallback({
  glbUrl,
  explode = 0,
  highlight = null,
  filled,
  preferPcAssembly,
}: AssetModelProps) {
  const kind = parseProceduralKind(glbUrl) ?? 'other';
  if (preferPcAssembly || kind === 'pc') {
    return (
      <ProceduralPc explode={explode} highlight={highlight} filled={filled} />
    );
  }
  return <ProceduralPart kind={kind} explode={explode} />;
}

/**
 * Lazy GLB with Draco (drei); procedural fallback for demo / missing assets.
 */
export function AssetModel(props: AssetModelProps) {
  const { glbUrl } = props;
  const fallback = <ProceduralFallback {...props} />;

  if (isProceduralAssetUrl(glbUrl) || !/^https?:\/\//i.test(glbUrl)) {
    return fallback;
  }

  return (
    <GlbErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GlbMesh url={glbUrl} />
      </Suspense>
    </GlbErrorBoundary>
  );
}

export function preloadGlb(url: string) {
  if (/^https?:\/\//i.test(url)) {
    useGLTF.preload(url, true);
  }
}
