import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function AdminTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border border-white/10 bg-elevated/40',
        className,
      )}
    >
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function AdminPager({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center gap-3">
      <Button type="button" variant="outline" size="sm" disabled={!hasPrev} onClick={onPrev}>
        Previous
      </Button>
      <span className="font-mono text-[11px] text-muted uppercase">
        Page {page} of {totalPages}
      </span>
      <Button type="button" variant="outline" size="sm" disabled={!hasNext} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

export const fieldClass =
  'rounded-lg border border-white/12 bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted/70 focus:border-sage/60';

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-elevated/30 px-6 py-12 text-center">
      <h3 className="font-display text-lg tracking-tight">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'ACTIVE' || status === 'PAID' || status === 'DELIVERED'
      ? 'bg-sage/15 text-sage'
      : status === 'DRAFT' || status === 'PENDING' || status === 'PENDING_PAYMENT'
        ? 'bg-accent/15 text-accent'
        : 'bg-white/8 text-muted';
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase',
        tone,
      )}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}
