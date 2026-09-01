'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@vorqen/ui';
import { cn } from '@/lib/utils';
import { loginHref } from '@/lib/auth-redirect';
import { CartNavLink } from '@/components/navigation/CartNavLink';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/build', label: 'Build' },
  { href: '/compare', label: 'Compare' },
] as const;

type StoreNavbarProps = {
  className?: string;
};

export function StoreNavbar({ className }: StoreNavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const signInHref = loginHref(pathname);

  return (
    <header className={cn('sticky top-0 z-30 px-3 pt-3 md:px-6', className)}>
      <div className="glass-nav mx-auto flex max-w-6xl flex-col rounded-[1.75rem]">
        <div className="flex h-14 items-center justify-between gap-4 px-4 md:h-16 md:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link
              href="/"
              className="shrink-0 text-foreground"
              onClick={() => setOpen(false)}
            >
              <BrandMark />
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <nav className="flex items-center gap-2 text-sm sm:gap-4">
            <Link
              href="/wishlist"
              className="hidden text-muted transition-colors hover:text-foreground sm:inline"
            >
              Wishlist
            </Link>
            <CartNavLink />
            <Link
              href="/account"
              className="hidden text-muted transition-colors hover:text-foreground sm:inline"
            >
              Account
            </Link>
            <Link
              href={signInHref}
              className="glass-btn rounded-full px-4 py-1.5 text-xs font-medium sm:text-sm"
            >
              Sign in
            </Link>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full glass-panel md:hidden"
              aria-expanded={open}
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-1">
                <span className="block h-0.5 w-4 bg-foreground" />
                <span className="block h-0.5 w-4 bg-foreground" />
                <span className="block h-0.5 w-4 bg-foreground" />
              </span>
            </button>
          </nav>
        </div>
        {open ? (
          <div className="border-t border-white/10 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/wishlist" onClick={() => setOpen(false)}>
                Wishlist
              </Link>
              <Link href="/account" onClick={() => setOpen(false)}>
                Account
              </Link>
              <Link href={signInHref} onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
