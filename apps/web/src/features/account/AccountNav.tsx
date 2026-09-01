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
    <nav className="flex flex-wrap gap-2 rounded-3xl glass-panel p-3 md:flex-col">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-2xl px-3 py-2 text-sm transition-colors',
              active
                ? 'glass-btn text-cream'
                : 'text-muted hover:bg-white/40 hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
