'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@vorqen/ui';
import { isStaffRole, type UserRole } from '@vorqen/types';
import { cn } from '@/lib/utils';
import { loginHref } from '@/lib/auth-redirect';
import { CartNavLink } from '@/components/navigation/CartNavLink';
import { SignOutButton } from '@/components/navigation/SignOutButton';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/build', label: 'Build' },
  { href: '/compare', label: 'Compare' },
  { href: '/wishlist', label: 'Wishlist' },
] as const;

export type StoreNavbarSession = {
  role: UserRole;
} | null;

type StoreNavbarProps = {
  className?: string;
  session?: StoreNavbarSession;
};

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StoreNavbar({ className, session = null }: StoreNavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const signInHref = loginHref(pathname);
  const signedIn = session != null;
  const staff = isStaffRole(session?.role);

  return (
    <header className={cn('glass-nav sticky top-0 z-30', className)}>
      <div className="mx-auto flex h-16 max-w-[1360px] items-center gap-8 px-4 md:h-[72px] md:px-10">
        <Link
          href="/"
          className="shrink-0 text-lg text-foreground md:text-xl"
          onClick={() => setOpen(false)}
        >
          <BrandMark />
        </Link>
        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center gap-7 text-[15px] md:flex"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'border-b pb-0.5 transition-colors',
                  active
                    ? 'border-accent text-foreground'
                    : 'border-transparent text-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-[15px] md:ml-0">
          {signedIn ? (
            <>
              <Link
                href="/account"
                className="hidden h-11 items-center px-3 text-muted transition-colors hover:text-foreground lg:inline-flex"
              >
                Account
              </Link>
              {staff ? (
                <Link
                  href="/admin"
                  className="hidden h-11 items-center px-3 text-muted transition-colors hover:text-foreground lg:inline-flex"
                >
                  Admin
                </Link>
              ) : null}
              <SignOutButton className="hidden h-11 items-center px-3 text-muted transition-colors hover:text-foreground sm:inline-flex" />
            </>
          ) : (
            <Link
              href={signInHref}
              className="hidden h-11 items-center px-3 text-muted transition-colors hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <CartNavLink />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-strong md:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="flex flex-col gap-1">
              <span className="block h-px w-4 bg-foreground" />
              <span className="block h-px w-4 bg-foreground" />
              <span className="block h-px w-4 bg-foreground" />
            </span>
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border px-4 py-2 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col text-base">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-12 items-center border-b border-border text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {signedIn ? (
              <>
                <Link
                  href="/account"
                  className="flex h-12 items-center border-b border-border"
                  onClick={() => setOpen(false)}
                >
                  Account
                </Link>
                {staff ? (
                  <Link
                    href="/admin"
                    className="flex h-12 items-center border-b border-border"
                    onClick={() => setOpen(false)}
                  >
                    Admin
                  </Link>
                ) : null}
                <SignOutButton className="flex h-12 items-center text-left text-foreground" />
              </>
            ) : (
              <Link
                href={signInHref}
                className="flex h-12 items-center"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
