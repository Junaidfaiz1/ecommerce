'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export function createLazyCanvas<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
) {
  return dynamic(loader, {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[220px] w-full items-center justify-center bg-[#0a0b0d]">
        <p className="font-mono text-[10px] tracking-widest text-muted uppercase">
          Loading 3D…
        </p>
      </div>
    ),
  });
}
