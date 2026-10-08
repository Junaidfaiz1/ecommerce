'use client';

import Link from 'next/link';
import {
  CATALOG_PLACEHOLDER_IMAGE,
  IMAGE_SIZES,
  type ProductType,
} from '@vorqen/types';
import { Price } from '@/components/shared/Price';
import { StockBadge } from '@/components/shared/StockBadge';
import { CompareToggle } from '@/components/shared/CompareToggle';
import { AddToCartButton } from '@/components/shared/AddToCartButton';
import { WishlistToggle } from '@/components/shared/WishlistToggle';
import { CatalogImage } from '@/components/shared/CatalogImage';
import {
  keySpecLabel,
  productHref,
} from '@/features/products/product-path';
import { cn } from '@/lib/utils';

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  brand: { name: string };
  images: Array<{ url: string; alt: string | null; isPrimary: boolean }>;
  defaultVariant: {
    id: string;
    price: string;
    compareAtPrice?: string | null;
    currency: string;
    inStock: boolean;
    availableQuantity: number;
  } | null;
  cpu?: { cores: number; threads: number; socket: string } | null;
  gpu?: { vramGb: number; chipset: string } | null;
  motherboard?: { socket: string; chipset: string } | null;
  ram?: { capacityGb: number; speedMhz: number; memoryType: string } | null;
  storage?: { capacityGb: number; interface: string } | null;
  psu?: { wattage: number; efficiency: string } | null;
  pcCase?: { maxGpuLengthMm: number; supportedFormFactors: string[] } | null;
  cooler?: { coolerType: string; tdpRatingWatts: number | null } | null;
};

/**
 * Hairline tile grid — cards sit edge to edge, separated by 1px rules.
 * Pair with `ProductCard` children.
 */
export const productGridClass =
  'grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-px border border-border bg-border';

type ProductCardProps = {
  product: ProductCardData;
  className?: string;
  showCompare?: boolean;
  priority?: boolean;
  imageSizes?: string;
};

export function ProductCard({
  product,
  className,
  showCompare = true,
  priority = false,
  imageSizes = IMAGE_SIZES.productCard,
}: ProductCardProps) {
  const image =
    product.images.find((img) => img.isPrimary) ?? product.images[0];
  const href = productHref(product);
  const spec = keySpecLabel(product);
  const variant = product.defaultVariant;

  return (
    <article
      className={cn(
        'group relative flex flex-col gap-4 bg-background p-5 transition-colors hover:bg-surface',
        className,
      )}
    >
      <Link
        href={href}
        className="media-bed relative block aspect-[4/3] overflow-hidden"
        tabIndex={-1}
        aria-hidden
      >
        <CatalogImage
          src={image?.url ?? CATALOG_PLACEHOLDER_IMAGE}
          alt=""
          sizes={imageSizes}
          priority={priority}
          className="transition duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex items-center justify-between gap-3">
        <p className="label-mono truncate">
          {product.brand.name} · {product.type}
        </p>
        {variant ? (
          <StockBadge
            inStock={variant.inStock}
            quantity={variant.availableQuantity}
          />
        ) : null}
      </div>

      <Link
        href={href}
        className="min-h-[2.6em] text-[17px] leading-snug font-semibold text-foreground"
      >
        {product.name}
      </Link>

      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-border pt-3">
        <span className="truncate font-mono text-xs text-muted">
          {spec ?? '—'}
        </span>
        {variant ? (
          <Price
            amount={variant.price}
            currency={variant.currency}
            compareAt={variant.compareAtPrice}
            className="font-display text-xl font-bold [font-stretch:112%]"
          />
        ) : (
          <span className="text-sm text-muted">Unavailable</span>
        )}
      </div>

      {variant ? (
        <div className="flex flex-wrap items-start gap-2">
          <AddToCartButton
            variantId={variant.id}
            size="sm"
            disabled={!variant.inStock}
          />
          <WishlistToggle variantId={variant.id} size="sm" />
          {showCompare ? <CompareToggle productId={product.id} /> : null}
        </div>
      ) : null}
    </article>
  );
}
