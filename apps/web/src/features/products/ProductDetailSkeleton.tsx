import { Skeleton, SkeletonRegion, SkeletonText } from '@/components/shared/Skeleton';

/** Mirrors `ProductDetailView`: breadcrumb, gallery + buy column, spec rows. */
export function ProductDetailSkeleton() {
  return (
    <main className="mx-auto max-w-[1360px] px-4 pt-6 md:px-10">
      <SkeletonRegion label="Loading product">
        <Skeleton className="h-3 w-64" />
        <div aria-hidden className="flex flex-wrap items-start gap-14 pt-8">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3">
            <Skeleton className="aspect-[5/4] w-full" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full" />
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col gap-7 lg:max-w-[480px] lg:flex-[1_1_380px]">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center justify-between border-y border-border py-5">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <SkeletonText lines={3} />
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-14 w-full rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
              <div className="flex gap-2.5">
                <Skeleton className="h-11 w-28 rounded-full" />
                <Skeleton className="h-11 w-28 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden className="flex flex-col pt-24 md:pt-28">
          <Skeleton className="mb-6 h-3 w-32" />
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 border-t border-border py-4 md:grid-cols-[180px_minmax(0,1fr)]"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          ))}
        </div>
      </SkeletonRegion>
    </main>
  );
}
