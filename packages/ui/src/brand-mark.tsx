import type { JSX } from 'react';

/** Minimal shared brand mark — expand design system in later phases. */
export function BrandMark(): JSX.Element {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display, system-ui)',
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      VORQEN
    </span>
  );
}
