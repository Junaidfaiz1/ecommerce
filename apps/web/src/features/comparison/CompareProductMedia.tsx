'use client';

import {
  CATALOG_PLACEHOLDER_IMAGE,
  IMAGE_SIZES,
  proceduralAssetUrl,
  type ProductType,
} from '@vorqen/types';
import { CatalogImage } from '@/components/shared/CatalogImage';
import { Product3DViewer, productTypeToKind } from '@/features/three-d';

type Props = {
  type: ProductType;
  name: string;
  imageUrl?: string | null;
};

export function CompareProductMedia({ type, name, imageUrl }: Props) {
  return (
    <div className="mb-3 space-y-2">
      <div className="h-28 overflow-hidden rounded-2xl glass-panel sm:h-32">
        <Product3DViewer
          className="h-full w-full"
          glbUrl={proceduralAssetUrl(productTypeToKind(type))}
          label={name}
        />
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl glass-panel">
        <CatalogImage
          src={imageUrl ?? CATALOG_PLACEHOLDER_IMAGE}
          alt={name}
          sizes={IMAGE_SIZES.productThumb}
        />
      </div>
    </div>
  );
}
