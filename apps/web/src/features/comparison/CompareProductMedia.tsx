import { CATALOG_PLACEHOLDER_IMAGE, IMAGE_SIZES } from '@vorqen/types';
import { CatalogImage } from '@/components/shared/CatalogImage';

type Props = {
  name: string;
  imageUrl?: string | null;
};

export function CompareProductMedia({ name, imageUrl }: Props) {
  return (
    <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-cream ring-1 ring-white/15">
      <CatalogImage
        src={imageUrl ?? CATALOG_PLACEHOLDER_IMAGE}
        alt={name}
        sizes={IMAGE_SIZES.compareCard}
        className="object-contain p-3"
      />
    </div>
  );
}
