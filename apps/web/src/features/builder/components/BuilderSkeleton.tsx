import { MediaListSkeleton, Skeleton, SkeletonRegion } from '@/components/shared/Skeleton';

/** Matches `BuilderShell`: slot rail | photo stage + options | summary. */
export function BuilderSkeleton() {
  return (
    <SkeletonRegion label="Loading builder" className="flex flex-col">
      <div aria-hidden className="flex items-center justify-between border-b border-border px-4 py-4 md:px-8">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div aria-hidden className="flex flex-wrap items-stretch">
        <div className="hidden w-[280px] shrink-0 flex-col border-r border-border py-6 lg:flex">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-3.5">
              <Skeleton className="h-3 w-5" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-[240px] w-full sm:h-[300px] lg:h-[360px]" />
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-[8/7] w-full" />
            ))}
          </div>
        </div>
        <div className="flex w-full flex-col gap-5 border-t border-border bg-surface px-4 py-7 md:px-8 lg:w-[360px] lg:shrink-0 lg:border-t-0 lg:border-l lg:px-7 lg:py-8">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-1.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Option rows while a slot's catalog loads. */
export function PartOptionsSkeleton() {
  return <MediaListSkeleton rows={4} thumb="h-14 w-[72px]" label="Loading parts" />;
}
