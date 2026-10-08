import { StoreNavbar } from '@/components/navigation/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { CompareTray } from '@/components/shared/CompareToggle';
import { getNavSession } from '@/server/auth/session';

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getNavSession();

  return (
    <div className="flex min-h-screen flex-col">
      <StoreNavbar session={session} />
      <div className="flex-1 pb-24">{children}</div>
      <StoreFooter session={session} />
      <CompareTray />
    </div>
  );
}
