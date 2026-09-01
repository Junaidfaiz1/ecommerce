import Link from 'next/link';
import { BrandMark } from '@vorqen/ui';
import { cn } from '@/lib/utils';
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
  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md',
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 md:h-16 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-foreground">
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
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/shop"
            className="text-muted transition-colors hover:text-foreground md:hidden"
          >
            Shop
          </Link>
          <Link
            href="/wishlist"
            className="hidden text-muted transition-colors hover:text-foreground sm:inline"
          >
            Wishlist
          </Link>
          <CartNavLink />
          <Link
            href="/account"
            className="text-muted transition-colors hover:text-foreground"
          >
            Account
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-foreground transition-colors hover:bg-elevated"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
