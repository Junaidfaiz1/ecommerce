import { z } from 'zod';
import { cuidSchema } from './catalog';
import { COMPONENT_SLOTS } from './compatibility';

/** Slots that participate in exploded / highlight views. */
export const EXPLODE_SLOTS = COMPONENT_SLOTS;
export type ExplodeSlot = (typeof EXPLODE_SLOTS)[number];

export const product3DAssetSchema = z
  .object({
    id: cuidSchema,
    productId: cuidSchema,
    glbUrl: z.string().trim().min(1).max(2048),
    dracoUrl: z.string().trim().min(1).max(2048).nullable().optional(),
    posterUrl: z.string().trim().min(1).max(2048).nullable().optional(),
    label: z.string().trim().min(1).max(120).nullable().optional(),
  })
  .strict();

export type Product3DAssetDto = z.infer<typeof product3DAssetSchema>;

export const product3DAssetsArgsSchema = z
  .object({
    productId: cuidSchema.optional(),
    productSlug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasId = Boolean(value.productId);
    const hasSlug = Boolean(value.productSlug);
    if (hasId === hasSlug) {
      ctx.addIssue({
        code: 'custom',
        path: ['_root'],
        message: 'Provide exactly one of productId or productSlug.',
      });
    }
  });

export type Product3DAssetsArgs = z.infer<typeof product3DAssetsArgsSchema>;

/** Sentinel URL — client renders procedural geometry instead of fetching a GLB. */
export const PROCEDURAL_ASSET_PREFIX = 'procedural://';

export const PROCEDURAL_KINDS = [
  'pc',
  'cpu',
  'gpu',
  'motherboard',
  'ram',
  'storage',
  'psu',
  'case',
  'cooler',
  'accessory',
  'other',
] as const;
export type ProceduralKind = (typeof PROCEDURAL_KINDS)[number];

export const proceduralKindSchema = z.enum(PROCEDURAL_KINDS);

export function isProceduralAssetUrl(url: string): boolean {
  return url.startsWith(PROCEDURAL_ASSET_PREFIX);
}

export function proceduralAssetUrl(kind: ProceduralKind): string {
  return `${PROCEDURAL_ASSET_PREFIX}${kind}`;
}

export function parseProceduralKind(url: string): ProceduralKind | null {
  if (!isProceduralAssetUrl(url)) return null;
  const kind = url.slice(PROCEDURAL_ASSET_PREFIX.length).toLowerCase();
  const parsed = proceduralKindSchema.safeParse(kind);
  return parsed.success ? parsed.data : null;
}
