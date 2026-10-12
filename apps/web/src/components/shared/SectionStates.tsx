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
        'flex flex-col items-start gap-3 rounded-md border border-border px-6 py-10',
        className,
      )}
    >
      <h3 className="font-display text-xl font-bold tracking-tight text-foreground [font-stretch:112%]">
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
        'flex flex-col items-start gap-3 rounded-md border border-accent/40 px-6 py-8',
        className,
      )}
      role="alert"
    >
      <h3 className="font-display text-xl font-bold tracking-tight text-foreground [font-stretch:112%]">
        {title}
      </h3>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {action}
    </div>
  );
}

type SectionHeaderProps = {
  /** Optional index, rendered as "01 / EYEBROW". */
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="eyebrow mb-4">
            {index ? `${index} / ` : null}
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-[32px] leading-none font-bold tracking-[-0.01em] [font-stretch:118%] md:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-xl text-[15px] text-muted md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** Secondary link styled as an underlined text action. */
export const sectionLinkClass =
  'w-fit border-b border-border-strong pb-0.5 text-[15px] text-muted transition-colors hover:border-foreground hover:text-foreground';
