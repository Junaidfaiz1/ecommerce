import { IMAGE_SIZES } from '@vorqen/types';
import { CatalogImage } from '@/components/shared/CatalogImage';

const HERO_GPU_IMAGE = '/assets/catalog/rtx-4080-super-16gb.jpg';

/** Reference readout under the hero photo — describes the pictured card. */
const HERO_READOUT = [
  { label: 'GPU', value: 'RTX 4080 SUPER' },
  { label: 'VRAM', value: '16 GB' },
  { label: 'TDP', value: '320 W' },
  { label: 'PSU rec.', value: '750 W' },
] as const;

/**
 * Homepage hero visual — studio catalog photo framed with crop marks and a
 * spec readout strip (no overlays on the photo itself).
 */
export function HeroHardwareMedia() {
  return (
    <figure className="m-0 flex flex-col">
      <div className="crop-marks media-bed relative aspect-[4/3] overflow-hidden rounded-[4px]">
        <CatalogImage
          src={HERO_GPU_IMAGE}
          alt="GeForce RTX 4080 SUPER graphics card, studio lit"
          sizes={IMAGE_SIZES.hero}
          priority
        />
      </div>
      <figcaption className="grid grid-cols-2 gap-px border border-t-0 border-border bg-border font-mono text-xs sm:grid-cols-4">
        {HERO_READOUT.map((item) => (
          <div key={item.label} className="bg-background px-4 py-3.5">
            <div className="text-muted uppercase">{item.label}</div>
            <div className="text-foreground">{item.value}</div>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}
