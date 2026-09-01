'use client';

import { useState } from 'react';
import { isProceduralAssetUrl } from '@vorqen/types';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { ViewerChrome } from '@/components/3d/ViewerChrome';
import { AssetModel } from './models/AssetModel';
import { useExplodeAmount } from './useExplodeAmount';

export type ProductViewerCanvasProps = {
  className?: string;
  glbUrl: string;
  label?: string | null;
};

export default function ProductViewerCanvas({
  className,
  glbUrl,
  label,
}: ProductViewerCanvasProps) {
  const [explode, setExplode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const explodeAmount = useExplodeAmount(explode);

  const demo =
    isProceduralAssetUrl(glbUrl) || label?.toLowerCase().includes('demo')
      ? label ?? 'Demo model'
      : null;

  return (
    <ViewerChrome
      className={className}
      demoLabel={demo}
      explode={explode}
      onExplodeChange={setExplode}
      autoRotate={autoRotate}
      onAutoRotateChange={setAutoRotate}
      showExplode
    >
      <div className="aspect-[4/3] h-full w-full">
        <SceneCanvas autoRotate={autoRotate} cameraPosition={[1.8, 1.1, 2.2]}>
          <group>
            <AssetModel glbUrl={glbUrl} explode={explodeAmount} />
          </group>
        </SceneCanvas>
      </div>
    </ViewerChrome>
  );
}
