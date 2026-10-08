import {
  ProductGridSkeleton,
  SectionHeaderSkeleton,
} from '@/components/shared/Skeleton';

/** Fallback for store routes without their own skeleton. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1360px] px-4 pt-10 md:px-10 md:pt-14">
      <SectionHeaderSkeleton description />
      <ProductGridSkeleton count={4} label="Loading page" />
    </main>
  );
}
