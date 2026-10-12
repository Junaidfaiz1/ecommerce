import Link from 'next/link';
import { isStaffRole, type UserRole } from '@vorqen/types';
import { SignOutButton } from '@/components/navigation/SignOutButton';

type StoreFooterProps = {
  session?: { role: UserRole } | null;
};

const linkClass = 'text-muted transition-colors hover:text-foreground';

export function StoreFooter({ session = null }: StoreFooterProps) {
  const signedIn = session != null;
  const staff = isStaffRole(session?.role);

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-[1360px] px-4 pt-16 pb-10 md:px-10 md:pt-24">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <p className="max-w-sm text-[15px] text-muted">
            Build Beyond Limits. Premium gaming hardware with compatibility,
            pricing and stock checked on the server — never in the browser.
          </p>
          <div>
            <p className="label-mono">Explore</p>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              <li>
                <Link href="/shop" className={linkClass}>
                  Shop hardware
                </Link>
              </li>
              <li>
                <Link href="/build" className={linkClass}>
                  PC Builder
                </Link>
              </li>
              <li>
                <Link href="/compare" className={linkClass}>
                  Compare
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="label-mono">Account</p>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              <li>
                <Link href="/account" className={linkClass}>
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className={linkClass}>
                  Orders
                </Link>
              </li>
              {staff ? (
                <li>
                  <Link href="/admin" className={linkClass}>
                    Admin
                  </Link>
                </li>
              ) : null}
              <li>
                {signedIn ? (
                  <SignOutButton className={linkClass} />
                ) : (
                  <Link href="/login" className={linkClass}>
                    Sign in
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>

        <p
          aria-hidden
          className="mt-16 font-display text-[clamp(64px,15vw,220px)] leading-[0.8] font-black tracking-[-0.02em] text-surface select-none [font-stretch:125%]"
        >
          VORQEN
        </p>
        <div className="mt-6 flex flex-wrap justify-between gap-4 font-mono text-xs text-subtle">
          <span>© {new Date().getFullYear()} VORQEN — Build Beyond Limits.</span>
          <span>Payments secured by Stripe</span>
        </div>
      </div>
    </footer>
  );
}
