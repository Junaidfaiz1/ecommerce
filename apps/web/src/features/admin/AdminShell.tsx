'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandMark } from '@vorqen/ui';
import { cn } from '@/lib/utils';
import { graphqlRequest, GraphQLClientError } from '@/lib/graphql-client';
import { ADMIN_ME } from './graphql';

const LINKS: Array<{ href: string; label: string; adminOnly?: boolean }> = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/catalog', label: 'Catalog' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/inventory', label: 'Inventory' },
  { href: '/admin/coupons', label: 'Coupons', adminOnly: true },
  { href: '/admin/bundles', label: 'Bundles', adminOnly: true },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/audit', label: 'Audit' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await graphqlRequest<{ me: { email: string; role: string } | null }>(
          ADMIN_ME,
        );
        if (cancelled) return;
        setRole(data.me?.role ?? null);
        setEmail(data.me?.email ?? null);
      } catch (err) {
        if (err instanceof GraphQLClientError && err.code === 'UNAUTHENTICATED') {
          router.replace('/login?next=/admin');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen bg-[#0b0b0c] text-foreground">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-[#101012] md:flex md:flex-col">
        <div className="border-b border-border px-4 py-4">
          <Link href="/admin" className="text-foreground">
            <BrandMark />
          </Link>
          <p className="mt-2 font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
            Operations
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {LINKS.filter((link) => !link.adminOnly || role === 'ADMIN').map(
            (link) => {
              const active =
                link.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded px-3 py-2 text-[13px]',
                    active
                      ? 'bg-elevated text-foreground'
                      : 'text-muted hover:bg-surface hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              );
            },
          )}
        </nav>
        <div className="border-t border-border p-3 text-[11px] text-muted">
          <p className="truncate">{email}</p>
          <p className="font-mono uppercase">{role}</p>
          <Link href="/" className="mt-2 inline-block text-accent">
            Storefront
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <span className="font-mono text-[11px] uppercase">VORQEN Ops</span>
          <Link href="/" className="text-xs text-accent">
            Store
          </Link>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
          {LINKS.filter((link) => !link.adminOnly || role === 'ADMIN').map(
            (link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 rounded px-2 py-1 text-xs text-muted"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
