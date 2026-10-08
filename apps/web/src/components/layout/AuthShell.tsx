import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandMark } from '@vorqen/ui';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, subtitle, children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen flex-col px-3 py-3 md:px-6 md:py-5">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between rounded-full glass-nav px-5 py-3 md:px-8">
        <Link href="/" className="text-foreground">
          <BrandMark />
        </Link>
        <Link href="/shop" className="text-sm text-muted hover:text-foreground">
          Shop
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-1 py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
        <div className="hidden lg:block">
          <p className="font-mono text-[11px] tracking-[0.22em] text-sage uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight xl:text-6xl">
            Build beyond
            <br />
            the ordinary.
          </h1>
          <p className="mt-5 max-w-md text-muted">
            Save builds, checkout securely, and keep catalog prices on the
            server — never in the browser.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <div className="glass-panel rounded-2xl px-4 py-3">
              <p className="font-display text-2xl">3D</p>
              <p className="text-xs text-muted">Live builder chassis</p>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3">
              <p className="font-display text-2xl">JWT</p>
              <p className="text-xs text-muted">Secure session cookies</p>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3">
              <p className="font-display text-2xl">Stripe</p>
              <p className="text-xs text-muted">Webhook is paid truth</p>
            </div>
          </div>
        </div>

        <div className="glass-panel mx-auto w-full max-w-md rounded-md p-6 sm:p-8">
          <p className="font-mono text-[11px] tracking-[0.2em] text-sage uppercase lg:hidden">
            {eyebrow}
          </p>
          <h2 className="font-display text-3xl tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
