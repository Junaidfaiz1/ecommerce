import { StoreNavbar } from '@/components/navigation/StoreNavbar';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { CompareTray } from '@/components/shared/CompareToggle';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StoreNavbar />
      <div className="flex-1 pb-20">{children}</div>
      <StoreFooter />
      <CompareTray />
    </div>
  );
}
