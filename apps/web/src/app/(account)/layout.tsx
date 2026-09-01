import type { Metadata } from 'next';
import { AccountShell } from '@/features/account/AccountShell';
import { StoreNavbar } from '@/components/navigation/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';

export const metadata: Metadata = {
  title: {
    default: 'Account',
    template: '%s · Account · VORQEN',
  },
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StoreNavbar />
      <AccountShell>{children}</AccountShell>
      <StoreFooter />
    </div>
  );
}
