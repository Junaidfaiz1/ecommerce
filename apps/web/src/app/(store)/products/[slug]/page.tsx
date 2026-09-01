import { productMetadata, ProductDetailView } from '@/features/products/ProductDetail';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return productMetadata(slug);
}

export default async function ProductsSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailView slug={slug} />;
}
