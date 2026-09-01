'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  CATALOG_PLACEHOLDER_IMAGE,
  IMAGE_SIZES,
  resolveCatalogImageUrl,
  shouldOptimizeRemoteImage,
} from '@vorqen/types';
import { cn } from '@/lib/utils';

export type CatalogImageProps = {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** Fill the relatively-positioned parent. */
  fill?: boolean;
  width?: number;
  height?: number;
};

/**
 * next/image wrapper. Unknown / placeholder hosts stay unoptimized
 * so catalog URLs never break the optimizer.
 */
export function CatalogImage({
  src,
  alt,
  sizes = IMAGE_SIZES.productCard,
  className,
  priority = false,
  fill = true,
  width,
  height,
}: CatalogImageProps) {
  const resolved = resolveCatalogImageUrl(src);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const displaySrc =
    failedFor === resolved ? CATALOG_PLACEHOLDER_IMAGE : resolved;
  const optimize = shouldOptimizeRemoteImage(displaySrc);

  return (
    <Image
      src={displaySrc}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      unoptimized={!optimize}
      onError={() => {
        if (resolved !== CATALOG_PLACEHOLDER_IMAGE) setFailedFor(resolved);
      }}
      className={cn('object-cover', className)}
    />
  );
}
