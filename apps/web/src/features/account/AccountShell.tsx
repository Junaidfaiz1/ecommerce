'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AccountNav } from './AccountNav';

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[200px_1fr] md:px-8 md:py-14">
      <AccountNav pathname={pathname} />
      <div>{children}</div>
    </div>
  );
}
