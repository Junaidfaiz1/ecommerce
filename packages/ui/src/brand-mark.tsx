import type { JSX } from 'react';

/** VORQEN wordmark — expanded display face, tracked caps. */
export function BrandMark(): JSX.Element {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display, system-ui)',
        fontWeight: 800,
        fontStretch: '125%',
        letterSpacing: '0.08em',
      }}
    >
      VORQEN
    </span>
  );
}
