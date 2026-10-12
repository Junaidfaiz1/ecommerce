'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  ScrollText,
  ShoppingBag,
  Star,
  TicketPercent,
  Users,
  Warehouse,
} from 'lucide-react';
import { BrandMark } from '@vorqen/ui';
import { cn } from '@/lib/utils';
import { Skeleton, SkeletonRegion } from '@/components/shared/Skeleton';
import { graphqlRequest, GraphQLClientError } from '@/lib/graphql-client';
import { ADMIN_ME } from './graphql';

const LINKS: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}> = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/catalog', label: 'Catalog', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/coupons', label: 'Coupons', icon: TicketPercent, adminOnly: true },
  { href: '/admin/bundles', label: 'Bundles', icon: Boxes, adminOnly: true },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/audit', label: 'Audit', icon: ScrollText },
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

  const links = LINKS.filter((link) => !link.adminOnly || role === 'ADMIN');

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/8 bg-surface md:flex">
        <div className="border-b border-white/8 px-5 py-5">
          <Link href="/admin" className="text-cream">
            <BrandMark />
          </Link>
          <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-sage uppercase">
            <ClipboardList className="size-3" />
            Operations
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {links.map((link) => {
            const active =
              link.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition',
                  active
                    ? 'bg-accent font-medium text-ink'
                    : 'text-muted hover:bg-white/6 hover:text-cream',
                )}
              >
                <Icon className="size-4 shrink-0 opacity-90" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/8 p-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg border border-sage/30 bg-sage/10 px-3 py-2 text-[13px] text-sage transition hover:border-sage/50 hover:bg-sage/15 hover:text-cream"
          >
            <ArrowLeft className="size-4 shrink-0" />
            Back to website
          </Link>
          {email ? (
            <>
              <p className="mt-3 truncate px-1 text-[11px] text-cream">{email}</p>
              <p className="px-1 font-mono text-[11px] text-muted uppercase">{role}</p>
            </>
          ) : (
            <SkeletonRegion label="Loading account" className="mt-3 flex flex-col gap-1.5 px-1">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2.5 w-12" />
            </SkeletonRegion>
          )}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/8 px-4 py-3 md:px-8">
          <span className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
            VORQEN Ops
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-xs text-cream transition hover:border-sage/40 hover:text-sage"
          >
            <ArrowLeft className="size-3.5" />
            Back to website
          </Link>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-white/8 px-3 py-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-md px-2 py-1 text-xs text-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
