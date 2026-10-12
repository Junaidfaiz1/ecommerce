import { ProductGridSkeleton, Skeleton } from '@/components/shared/Skeleton';

/** First visit to /shop — filters and results both still loading. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1360px] px-4 pt-10 md:px-10 md:pt-14">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-14 w-72 md:h-[68px] md:w-96" />
      <div aria-hidden className="mt-8 flex flex-wrap gap-2 border-b border-border pb-6">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-10 pt-8">
        <div aria-hidden className="flex w-full flex-col gap-7 lg:max-w-[280px] lg:flex-[1_1_240px]">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-5">
          <Skeleton className="h-3 w-40" />
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </main>
  );
}
