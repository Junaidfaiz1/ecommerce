import Link from 'next/link';
import { BrandMark } from '@vorqen/ui';

export function StoreFooter() {
  return (
    <footer className="mt-auto px-3 pb-3 md:px-6 md:pb-6">
      <div className="glass-panel mx-auto max-w-6xl overflow-hidden rounded-[2rem]">
        <div className="grid gap-10 px-6 py-12 md:grid-cols-3 md:px-10">
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
            <p className="font-mono text-[11px] tracking-[0.18em] text-sage uppercase">
              Explore
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/shop" className="text-cream/90 hover:text-sage">
                  Shop hardware
                </Link>
              </li>
              <li>
                <Link href="/build" className="text-cream/90 hover:text-sage">
                  PC Builder
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-cream/90 hover:text-sage">
                  Compare
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-sage uppercase">
              Account
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/account" className="text-cream/90 hover:text-sage">
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/account/addresses"
                  className="text-cream/90 hover:text-sage"
                >
                  Addresses
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-cream/90 hover:text-sage">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4 text-center font-mono text-[11px] text-muted md:px-10">
          © {new Date().getFullYear()} VORQEN
        </div>
      </div>
    </footer>
  );
}
