'use client';

import { useState } from 'react';
import { proceduralAssetUrl, isProceduralAssetUrl } from '@vorqen/types';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { ViewerChrome } from '@/components/3d/ViewerChrome';
import { AssetModel } from './models/AssetModel';
import { useExplodeAmount } from './useExplodeAmount';

export type HeroPcCanvasProps = {
  className?: string;
  glbUrl?: string;
};

export default function HeroPcCanvas({
  className,
  glbUrl = proceduralAssetUrl('pc'),
}: HeroPcCanvasProps) {
  const [explode, setExplode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const explodeAmount = useExplodeAmount(explode);

  const demo =
    isProceduralAssetUrl(glbUrl) || !/^https?:\/\//i.test(glbUrl)
      ? 'Demo chassis'
      : null;

  return (
    <ViewerChrome
      className={className}
      demoLabel={demo}
      explode={explode}
      onExplodeChange={setExplode}
      autoRotate={autoRotate}
      onAutoRotateChange={setAutoRotate}
    >
      <div className="h-full min-h-[280px] w-full">
        <SceneCanvas autoRotate={autoRotate} cameraPosition={[2.4, 1.5, 2.8]}>
          <group position={[0, -0.15, 0]} scale={0.95}>
            <AssetModel
              glbUrl={glbUrl}
              explode={explodeAmount}
              preferPcAssembly
            />
          </group>
        </SceneCanvas>
      </div>
    </ViewerChrome>
  );
}
