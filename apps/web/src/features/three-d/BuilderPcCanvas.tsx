'use client';

import { useState } from 'react';
import type { ComponentSlot } from '@vorqen/types';
import { proceduralAssetUrl } from '@vorqen/types';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { ViewerChrome } from '@/components/3d/ViewerChrome';
import { AssetModel } from './models/AssetModel';
import type { FilledSlots } from './lib';
import { useExplodeAmount } from './useExplodeAmount';

export type BuilderPcCanvasProps = {
  className?: string;
  highlight?: ComponentSlot | null;
  filled?: FilledSlots;
  glbUrl?: string;
};

export default function BuilderPcCanvas({
  className,
  highlight = null,
  filled,
  glbUrl = proceduralAssetUrl('pc'),
}: BuilderPcCanvasProps) {
  const [explode, setExplode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const explodeAmount = useExplodeAmount(explode);

  return (
    <ViewerChrome
      className={className}
      demoLabel="Demo chassis"
      explode={explode}
      onExplodeChange={setExplode}
      autoRotate={autoRotate}
      onAutoRotateChange={setAutoRotate}
    >
      <div className="h-full min-h-[280px] w-full lg:min-h-[420px]">
        <SceneCanvas
          autoRotate={autoRotate}
          cameraPosition={[2.1, 1.25, 2.5]}
        >
          <group position={[0, -0.1, 0]}>
            <AssetModel
              glbUrl={glbUrl}
              explode={explodeAmount}
              highlight={highlight}
              filled={filled}
              preferPcAssembly
            />
          </group>
        </SceneCanvas>
      </div>
    </ViewerChrome>
  );
}
