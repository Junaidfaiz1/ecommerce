import { notFound } from 'next/navigation';
import {
  isProductTypePath,
  PRODUCT_TYPE_PATHS,
} from '@/features/products/product-path';
import { productMetadata, ProductDetailView } from '@/features/products/ProductDetail';

type PageProps = {
  params: Promise<{ type: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug, type } = await params;
  if (!isProductTypePath(type)) return { title: 'Product' };
  return productMetadata(slug, PRODUCT_TYPE_PATHS[type]);
}

export default async function TypedProductPage({ params }: PageProps) {
  const { type, slug } = await params;
  if (!isProductTypePath(type)) notFound();
  return (
    <ProductDetailView slug={slug} expectedType={PRODUCT_TYPE_PATHS[type]} />
  );
}
