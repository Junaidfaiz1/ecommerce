import { SectionHeaderSkeleton, TableSkeleton } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-[1360px] px-4 pt-10 md:px-10 md:pt-14">
      <SectionHeaderSkeleton description />
      <TableSkeleton rows={8} cols={4} label="Loading comparison" />
    </main>
  );
}
