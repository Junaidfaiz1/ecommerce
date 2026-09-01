import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-3xl glass-panel px-6 py-10',
        className,
      )}
    >
      <h3 className="font-display text-lg tracking-tight text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-sm text-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

type ErrorStateProps = {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-3xl glass-panel px-6 py-8',
        className,
      )}
      role="alert"
    >
      <h3 className="font-display text-lg tracking-tight text-foreground">
        {title}
      </h3>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {action}
    </div>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-2xl tracking-tight md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-xl text-sm text-muted md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
