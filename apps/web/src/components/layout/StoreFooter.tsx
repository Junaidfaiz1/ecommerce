import Link from 'next/link';
import { BrandMark } from '@vorqen/ui';

export function StoreFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <Link href="/" className="text-foreground">
            <BrandMark />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Build Beyond Limits. Premium gaming hardware with server-checked
            compatibility.
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/shop" className="text-foreground/90 hover:text-accent">
                Shop hardware
              </Link>
            </li>
            <li>
              <Link href="/build" className="text-foreground/90 hover:text-accent">
                PC Builder
              </Link>
            </li>
            <li>
              <Link href="/compare" className="text-foreground/90 hover:text-accent">
                Compare
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            Account
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/account"
                className="text-foreground/90 hover:text-accent"
              >
                Profile
              </Link>
            </li>
            <li>
              <Link
                href="/account/addresses"
                className="text-foreground/90 hover:text-accent"
              >
                Addresses
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-foreground/90 hover:text-accent">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center font-mono text-[11px] text-muted md:px-8">
        © {new Date().getFullYear()} VORQEN
      </div>
    </footer>
  );
}
