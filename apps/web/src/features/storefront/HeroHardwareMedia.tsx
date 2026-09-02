import { IMAGE_SIZES } from '@vorqen/types';
import { CatalogImage } from '@/components/shared/CatalogImage';

const HERO_CASE_IMAGE = '/assets/catalog/fractal-meshify-2.jpg';
const HERO_GPU_IMAGE = '/assets/catalog/msi-rtx-4090-gaming-x-trio.jpg';

/**
 * Homepage hero visual — catalog photos instead of the procedural 3D chassis.
 */
export function HeroHardwareMedia() {
  return (
    <div className="relative h-[280px] overflow-hidden rounded-[1.75rem] glass-panel sm:h-[340px] md:h-[440px]">
      <div className="absolute inset-3 overflow-hidden rounded-[1.35rem] bg-cream sm:inset-4">
        <CatalogImage
          src={HERO_CASE_IMAGE}
          alt="Fractal Meshify 2 mid-tower case"
          sizes={IMAGE_SIZES.hero}
          priority
          className="object-contain p-4 sm:p-6"
        />
      </div>
      <div className="absolute right-5 bottom-5 h-24 w-36 overflow-hidden rounded-2xl bg-cream shadow-[0_16px_40px_rgb(0_0_0_/_0.35)] ring-1 ring-white/25 sm:h-28 sm:w-44 md:right-7 md:bottom-7">
        <CatalogImage
          src={HERO_GPU_IMAGE}
          alt="MSI GeForce RTX 4090 Gaming X Trio"
          sizes="176px"
          className="object-contain p-2"
        />
      </div>
    </div>
  );
}
