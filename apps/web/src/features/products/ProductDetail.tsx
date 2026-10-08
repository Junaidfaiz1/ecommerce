import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATALOG_PLACEHOLDER_IMAGE, IMAGE_SIZES, productJsonLd } from '@vorqen/types';
import type { CatalogProduct } from '@/server/catalog/catalog.mappers';
import { prisma } from '@/server/common/prisma';
import { getProductBySlug } from '@/server/catalog/catalog.service';
import { listProductReviews } from '@/server/reviews/reviews.service';
import { Price } from '@/components/shared/Price';
import { StockBadge } from '@/components/shared/StockBadge';
import { RatingStars } from '@/components/shared/RatingStars';
import { CompareToggle } from '@/components/shared/CompareToggle';
import { AddToCartButton } from '@/components/shared/AddToCartButton';
import { WishlistToggle } from '@/components/shared/WishlistToggle';
import { ErrorState } from '@/components/shared/SectionStates';
import { CatalogImage } from '@/components/shared/CatalogImage';
import { JsonLd } from '@/components/shared/JsonLd';
import {
  keySpecLabel,
  productHref,
} from '@/features/products/product-path';
import { ProductReviewsPanel } from '@/features/products/ProductReviewsPanel';
import { SpecTable } from '@/features/products/SpecTable';
import { absoluteUrl, publicPageMetadata } from '@/server/seo';

type Props = {
  slug: string;
  expectedType?: CatalogProduct['type'];
};

async function loadProduct(slug: string, expectedType?: CatalogProduct['type']) {
  try {
    const product = await getProductBySlug(prisma, slug);
    if (expectedType && product.type !== expectedType) return null;
    return product;
  } catch {
    return null;
  }
}

export async function productMetadata(
  slug: string,
  expectedType?: CatalogProduct['type'],
): Promise<Metadata> {
  const product = await loadProduct(slug, expectedType);
  if (!product) return { title: 'Product', robots: { index: false, follow: false } };
  const path = productHref(product);
  const description =
    product.description ?? `${product.brand.name} ${product.name}`;
  const image =
    product.images.find((i) => i.isPrimary)?.url ??
    product.images[0]?.url ??
    CATALOG_PLACEHOLDER_IMAGE;
  return publicPageMetadata({
    title: product.name,
    description,
    path,
    image,
  });
}

export async function ProductDetailView({ slug, expectedType }: Props) {
  const product = await loadProduct(slug, expectedType);
  if (!product) notFound();

  const reviews = await listProductReviews(prisma, {
    productId: product.id,
    page: 1,
    pageSize: 10,
  }).catch(() => null);

  const images = product.images;
  const primary = images.find((i) => i.isPrimary) ?? images[0];
  const variant = product.defaultVariant;
  const highlight = keySpecLabel(product);
  const path = productHref(product);

  return (
    <main className="mx-auto max-w-[1360px] px-4 pt-6 md:px-10">
      <JsonLd
        data={productJsonLd({
          name: product.name,
          url: absoluteUrl(path),
          description:
            product.description ?? `${product.brand.name} ${product.name}`,
          brandName: product.brand.name,
          imageUrl: primary?.url ?? CATALOG_PLACEHOLDER_IMAGE,
          sku: variant?.sku,
          price: variant?.price,
          currency: variant?.currency,
          inStock: variant?.inStock,
        })}
      />
      <nav
        aria-label="Breadcrumb"
        className="font-mono text-xs tracking-[0.04em] text-muted uppercase"
      >
        <Link href="/shop" className="hover:text-foreground">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?type=${product.type}`} className="hover:text-foreground">
          {product.type}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-14 pt-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3">
          <div className="crop-marks media-bed relative aspect-[5/4] overflow-hidden rounded-[4px]">
            <CatalogImage
              src={primary?.url ?? CATALOG_PLACEHOLDER_IMAGE}
              alt={primary?.alt ?? product.name}
              sizes={IMAGE_SIZES.productGallery}
              priority
            />
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(0, 8).map((img) => (
                <div
                  key={img.id}
                  className={
                    img.id === primary?.id
                      ? 'media-bed relative aspect-[4/3] overflow-hidden rounded-[4px] border border-foreground'
                      : 'media-bed relative aspect-[4/3] overflow-hidden rounded-[4px] border border-border'
                  }
                >
                  <CatalogImage
                    src={img.url}
                    alt={img.alt ?? ''}
                    sizes={IMAGE_SIZES.productThumb}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-7 lg:max-w-[480px] lg:flex-[1_1_380px]">
          <div className="flex flex-col gap-3">
            <p className="label-mono">
              {product.brand.name} · {product.type}
            </p>
            <h1 className="font-display text-[clamp(34px,3.6vw,44px)] leading-none font-extrabold tracking-[-0.01em] [font-stretch:115%]">
              {product.name}
            </h1>
            {reviews?.averageRating != null ? (
              <div className="flex items-center gap-3">
                <RatingStars rating={reviews.averageRating} />
                <a
                  href="#reviews"
                  className="border-b border-border-strong text-sm text-muted hover:text-foreground"
                >
                  {reviews.averageRating.toFixed(1)} ·{' '}
                  {reviews.pageInfo.totalCount} reviews
                </a>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-3 border-y border-border py-5">
            {variant ? (
              <>
                <Price
                  amount={variant.price}
                  currency={variant.currency}
                  compareAt={variant.compareAtPrice}
                  className="font-display text-[40px] font-bold [font-stretch:112%]"
                />
                <StockBadge
                  inStock={variant.inStock}
                  quantity={variant.availableQuantity}
                />
              </>
            ) : (
              <p className="text-muted">No active variant</p>
            )}
          </div>

          {highlight ? (
            <p className="font-mono text-sm text-foreground/85">{highlight}</p>
          ) : null}

          {product.description ? (
            <p className="text-[15px] leading-relaxed text-muted">
              {product.description}
            </p>
          ) : null}

          <div className="flex flex-col gap-2.5">
            {variant ? (
              <AddToCartButton
                variantId={variant.id}
                size="lg"
                disabled={!variant.inStock}
                className="w-full [&>button]:w-full"
              />
            ) : null}
            <Link
              href="/build"
              className="inline-flex h-14 items-center justify-center rounded-full border border-border-strong text-base transition-colors hover:border-foreground"
            >
              Configure in builder
            </Link>
            <div className="flex flex-wrap gap-2.5">
              {variant ? <WishlistToggle variantId={variant.id} /> : null}
              <CompareToggle productId={product.id} className="h-11 px-5 text-sm" />
            </div>
          </div>

          {product.variants.length > 1 ? (
            <div>
              <h2 className="label-mono">Variants</h2>
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {product.variants.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <span>
                      {v.name ?? v.sku}
                      <span className="ml-2 font-mono text-xs text-muted">
                        {v.sku}
                      </span>
                    </span>
                    <Price amount={v.price} currency={v.currency} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <section className="pt-24 md:pt-28">
        <p className="eyebrow mb-6">Specifications</p>
        <SpecTable product={product} />
      </section>

      <section id="reviews" className="scroll-mt-24 pt-24 md:pt-28">
        <div className="mb-8 border-b border-border pb-6">
          <h2 className="font-display text-[32px] leading-none font-bold [font-stretch:118%] md:text-[40px]">
            Owner reviews
          </h2>
        </div>
        {reviews ? (
          <ProductReviewsPanel productId={product.id} initial={reviews} />
        ) : (
          <ErrorState message="Reviews could not be loaded." />
        )}
      </section>
    </main>
  );
}
