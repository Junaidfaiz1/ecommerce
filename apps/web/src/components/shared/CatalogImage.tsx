import Image from 'next/image';
import { IMAGE_SIZES, shouldOptimizeRemoteImage } from '@vorqen/types';
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
  const optimize = shouldOptimizeRemoteImage(src);

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      unoptimized={!optimize}
      className={cn('object-cover', className)}
    />
  );
}
