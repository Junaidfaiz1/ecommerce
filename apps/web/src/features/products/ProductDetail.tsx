import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productJsonLd } from '@vorqen/types';
import type { CatalogProduct } from '@/server/catalog/catalog.mappers';
import { prisma } from '@/server/common/prisma';
import { getProductBySlug } from '@/server/catalog/catalog.service';
import { listProductReviews } from '@/server/reviews/reviews.service';
import { getProductViewerAsset } from '@/server/three-d-assets';
import { Price } from '@/components/shared/Price';
import { StockBadge } from '@/components/shared/StockBadge';
import { RatingStars } from '@/components/shared/RatingStars';
import { CompareToggle } from '@/components/shared/CompareToggle';
import { AddToCartButton } from '@/components/shared/AddToCartButton';
import { WishlistToggle } from '@/components/shared/WishlistToggle';
import { ErrorState } from '@/components/shared/SectionStates';
import { JsonLd } from '@/components/shared/JsonLd';
import {
  keySpecLabel,
  productHref,
} from '@/features/products/product-path';
import { ProductReviewsPanel } from '@/features/products/ProductReviewsPanel';
import { SpecTable } from '@/features/products/SpecTable';
import { Product3DViewer } from '@/features/three-d';
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
  const image = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;
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

  let reviews = null;
  try {
    reviews = await listProductReviews(prisma, {
      productId: product.id,
      page: 1,
      pageSize: 10,
    });
  } catch {
    reviews = null;
  }

  let viewerAsset = null;
  try {
    viewerAsset = await getProductViewerAsset(prisma, {
      productId: product.id,
    });
  } catch {
    viewerAsset = null;
  }

  const images = product.images;
  const primary = images.find((i) => i.isPrimary) ?? images[0];
  const variant = product.defaultVariant;
  const highlight = keySpecLabel(product);
  const path = productHref(product);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
      <JsonLd
        data={productJsonLd({
          name: product.name,
          url: absoluteUrl(path),
          description:
            product.description ?? `${product.brand.name} ${product.name}`,
          brandName: product.brand.name,
          imageUrl: primary?.url,
          sku: variant?.sku,
          price: variant?.price,
          currency: variant?.currency,
          inStock: variant?.inStock,
        })}
      />
      <nav className="mb-6 font-mono text-[11px] tracking-wide text-muted">
        <Link href="/shop" className="hover:text-accent">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?type=${product.type}`} className="hover:text-accent">
          {product.type}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground/80">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          {viewerAsset ? (
            <Product3DViewer
              className="w-full overflow-hidden"
              glbUrl={viewerAsset.glbUrl}
              label={viewerAsset.label}
            />
          ) : (
            <div className="aspect-[4/3] overflow-hidden border border-border bg-elevated">
              {primary?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primary.url}
                  alt={primary.alt ?? product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-xs text-muted">
                  No preview
                </div>
              )}
            </div>
          )}
          {images.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="h-16 w-20 shrink-0 overflow-hidden border border-border bg-surface"
                >
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.url}
                      alt={img.alt ?? ''}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            {product.brand.name} · {product.type}
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
            {product.name}
          </h1>
          {highlight ? (
            <p className="mt-2 font-mono text-sm text-muted">{highlight}</p>
          ) : null}

          {reviews?.averageRating != null ? (
            <div className="mt-4 flex items-center gap-2">
              <RatingStars rating={reviews.averageRating} />
              <span className="text-sm text-muted">
                {reviews.averageRating.toFixed(1)} · {reviews.pageInfo.totalCount}{' '}
                reviews
              </span>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-end gap-4 border-y border-border py-5">
            {variant ? (
              <>
                <Price
                  amount={variant.price}
                  currency={variant.currency}
                  compareAt={variant.compareAtPrice}
                  className="text-xl"
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

          {product.description ? (
            <p className="mt-5 text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {variant ? (
              <>
                <AddToCartButton variantId={variant.id} />
                <WishlistToggle variantId={variant.id} />
              </>
            ) : null}
            <CompareToggle productId={product.id} />
            <Link
              href={`/build`}
              className="inline-flex h-8 items-center rounded-md border border-border bg-surface px-3 text-xs font-medium transition-colors hover:bg-elevated"
            >
              Open Builder
            </Link>
          </div>

          {product.variants.length > 1 ? (
            <div className="mt-8">
              <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                Variants
              </h2>
              <ul className="mt-3 space-y-2">
                {product.variants.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 border-b border-border/70 py-2 text-sm"
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

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">Specifications</h2>
        <div className="mt-4">
          <SpecTable product={product} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">Reviews</h2>
        {reviews ? (
          <ProductReviewsPanel
            productId={product.id}
            initial={reviews}
            className="mt-4"
          />
        ) : (
          <ErrorState className="mt-4" message="Reviews could not be loaded." />
        )}
      </section>

      <p className="mt-10 font-mono text-[11px] text-muted">
        Canonical:{' '}
        <Link href={productHref(product)} className="hover:text-accent">
          {productHref(product)}
        </Link>
      </p>
    </main>
  );
}
