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
        'group relative flex flex-col rounded-3xl glass-panel p-4 transition-transform hover:-translate-y-0.5',
        className,
      )}
    >
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-white/5">
        <CatalogImage
          src={image?.url ?? CATALOG_PLACEHOLDER_IMAGE}
          alt={image?.alt ?? product.name}
          sizes={imageSizes}
          priority={priority}
          className="opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
        />
      </Link>

      <div className="mt-4 flex flex-1 flex-col gap-2">
        <p className="font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
          {product.brand.name} · {product.type}
        </p>
        <Link
          href={href}
          className="font-display text-lg leading-snug tracking-tight text-foreground transition-colors hover:text-accent"
        >
          {product.name}
        </Link>
        {spec ? (
          <p className="font-mono text-xs text-muted">{spec}</p>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 pt-3">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              {variant ? (
                <>
                  <Price
                    amount={variant.price}
                    currency={variant.currency}
                    compareAt={variant.compareAtPrice}
                  />
                  <StockBadge
                    inStock={variant.inStock}
                    quantity={variant.availableQuantity}
                  />
                </>
              ) : (
                <span className="text-sm text-muted">Unavailable</span>
              )}
            </div>
            {showCompare ? <CompareToggle productId={product.id} /> : null}
          </div>
          {variant ? (
            <div className="flex flex-wrap gap-2">
              <AddToCartButton
                variantId={variant.id}
                size="sm"
                disabled={!variant.inStock}
              />
              <WishlistToggle variantId={variant.id} size="sm" />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
