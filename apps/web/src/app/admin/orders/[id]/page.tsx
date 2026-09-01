import { AdminOrderDetailPage } from '@/features/admin/orders/AdminOrderDetailPage';

export default async function AdminOrderRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminOrderDetailPage orderId={id} />;
}
