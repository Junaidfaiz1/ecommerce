/**
 * Hairline tile grid — product cards sit edge to edge, separated by 1px rules.
 * Rules are drawn per cell (not a `bg-border` gap) so a short last row leaves
 * empty space instead of a grey block.
 * Kept out of `ProductCard.tsx` ('use client') so server components can use it.
 */
export const productGridClass =
  'grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] border-t border-l border-border [&>*]:border-r [&>*]:border-b [&>*]:border-border';
