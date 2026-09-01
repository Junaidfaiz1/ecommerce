/**
 * Phase 18 — 3D render budgets, catalog query caps, and image sizing.
 * Pure helpers; inject viewport/network flags from the client.
 */

export const THREE_D_DPR_MIN = 1;
export const THREE_D_DPR_MAX = 1.5;
export const THREE_D_DPR_MAX_CONSTRAINED = 1.25;
export const THREE_D_SHADOW_MAP = 512;
export const THREE_D_SHADOW_MAP_CONSTRAINED = 256;
export const THREE_D_CYLINDER_SEGMENTS = 12;
export const THREE_D_CYLINDER_SEGMENTS_CONSTRAINED = 8;

/** List pages only need a primary image + default variant. */
export const PRODUCT_LIST_IMAGE_TAKE = 1;
export const PRODUCT_LIST_VARIANT_TAKE = 1;

export const IMAGE_SIZES = {
  productCard: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  productCardDense: '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
  productGallery: '(min-width: 1024px) 50vw, 100vw',
  productThumb: '80px',
  cartThumb: '(min-width: 640px) 144px, 100vw',
  wishlistThumb: '(min-width: 640px) 112px, 100vw',
} as const;

const OPTIMIZED_IMAGE_HOSTS = new Set([
  'images.unsplash.com',
  'cdn.vorqen.com',
]);

const OPTIMIZED_IMAGE_HOST_SUFFIXES = [
  '.r2.dev',
  '.cloudflarestorage.com',
] as const;

export type ThreeDBudgetInput = {
  reducedMotion?: boolean;
  saveData?: boolean;
  narrowViewport?: boolean;
  inViewport?: boolean;
  documentHidden?: boolean;
};

export type ThreeDBudget = {
  dpr: [number, number];
  shadowMapSize: number;
  shadows: boolean;
  environment: boolean;
  frameloop: 'always' | 'demand';
  cylinderSegments: number;
  paused: boolean;
  antialias: boolean;
  powerPreference: 'high-performance' | 'low-power';
};

export function resolveThreeDBudget(
  input: ThreeDBudgetInput = {},
): ThreeDBudget {
  const constrained =
    Boolean(input.reducedMotion) ||
    Boolean(input.saveData) ||
    Boolean(input.narrowViewport);
  const paused =
    input.documentHidden === true || input.inViewport === false;

  return {
    dpr: [
      THREE_D_DPR_MIN,
      constrained ? THREE_D_DPR_MAX_CONSTRAINED : THREE_D_DPR_MAX,
    ],
    shadowMapSize: constrained
      ? THREE_D_SHADOW_MAP_CONSTRAINED
      : THREE_D_SHADOW_MAP,
    shadows: !constrained,
    environment: !constrained,
    frameloop: paused || input.reducedMotion ? 'demand' : 'always',
    cylinderSegments: constrained
      ? THREE_D_CYLINDER_SEGMENTS_CONSTRAINED
      : THREE_D_CYLINDER_SEGMENTS,
    paused,
    antialias: !constrained,
    powerPreference: constrained ? 'low-power' : 'high-performance',
  };
}

/** Next/Image optimizer allowlist — unknown hosts stay `unoptimized`. */
export function shouldOptimizeRemoteImage(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== 'https:' && protocol !== 'http:') return false;
    if (hostname === 'placeholder.vorqen.local' || hostname === 'localhost') {
      return false;
    }
    if (OPTIMIZED_IMAGE_HOSTS.has(hostname)) return true;
    return OPTIMIZED_IMAGE_HOST_SUFFIXES.some((suffix) =>
      hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}
