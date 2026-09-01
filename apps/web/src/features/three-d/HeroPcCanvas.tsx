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
  const explodeAmount = useExplodeAmount(explode);

  const demo =
    isProceduralAssetUrl(glbUrl) || !/^https?:\/\//i.test(glbUrl)
      ? 'Studio preview'
      : null;

  return (
    <ViewerChrome
      className={className}
      demoLabel={demo}
      explode={explode}
      onExplodeChange={setExplode}
    >
      <div className="h-full min-h-[280px] w-full">
        <SceneCanvas autoRotate cameraPosition={[2.55, 1.15, 2.7]}>
          <group position={[0, 0.08, 0]} rotation={[0, 0.42, 0]} scale={0.9}>
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
