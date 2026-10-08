import { Skeleton, TableSkeleton } from '@/components/shared/Skeleton';

/** Renders inside `AdminShell` while an admin route segment loads. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div aria-hidden className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3.5 w-full max-w-lg" />
      </div>
      <TableSkeleton rows={8} cols={4} label="Loading admin page" />
    </div>
  );
}
