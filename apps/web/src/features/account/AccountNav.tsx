import Link from 'next/link';
import { cn } from '@/lib/utils';

const LINKS: Array<{ href: string; label: string; exact?: boolean }> = [
  { href: '/account', label: 'Profile', exact: true },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/builds', label: 'Saved builds' },
  { href: '/wishlist', label: 'Wishlist' },
];

export function AccountNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-8">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-md px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-elevated text-foreground'
                : 'text-muted hover:bg-surface hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
