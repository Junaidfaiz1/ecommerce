import type { Metadata } from 'next';
import { AccountShell } from '@/features/account/AccountShell';
import { StoreNavbar } from '@/components/navigation/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { getNavSession } from '@/server/auth/session';

export const metadata: Metadata = {
  title: {
    default: 'Account',
    template: '%s · Account · VORQEN',
  },
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getNavSession();

  return (
    <div className="flex min-h-screen flex-col">
      <StoreNavbar session={session} />
      <AccountShell>{children}</AccountShell>
      <StoreFooter session={session} />
    </div>
  );
}
