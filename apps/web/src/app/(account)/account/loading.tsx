import { ListSkeleton, Skeleton } from '@/components/shared/Skeleton';

/** Renders inside `AccountShell`'s content panel. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <ListSkeleton rows={4} label="Loading account" />
    </div>
  );
}
