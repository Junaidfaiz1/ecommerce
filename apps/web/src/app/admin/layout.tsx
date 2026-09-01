import type { Metadata } from 'next';
import { AdminShell } from '@/features/admin/AdminShell';

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s · Ops · VORQEN',
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
