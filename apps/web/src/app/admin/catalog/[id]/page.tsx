import { ProductEditPage } from '@/features/admin/catalog/ProductEditPage';

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductEditPage productId={id} />;
}
