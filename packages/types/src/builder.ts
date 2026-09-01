import { z } from 'zod';
import {
  checkCompatibilityInputSchema,
  compatibilityComponentSchema,
  componentSlotSchema,
  type CompatibilityComponentInput,
  type ComponentSlot,
} from './compatibility';
import { cuidSchema, slugSchema } from './catalog';

export const BUILD_VISIBILITIES = ['PRIVATE', 'UNLISTED', 'PUBLIC'] as const;
export type BuildVisibility = (typeof BUILD_VISIBILITIES)[number];

export const buildVisibilitySchema = z.enum(BUILD_VISIBILITIES);

export const buildComponentSchema = compatibilityComponentSchema.extend({
  variantId: cuidSchema.optional(),
});

export const buildComponentsSchema = z
  .array(buildComponentSchema)
  .min(1)
  .max(32)
  .superRefine((components, ctx) => {
    const counts = new Map<ComponentSlot, number>();
    for (const item of components) {
      counts.set(item.slot, (counts.get(item.slot) ?? 0) + 1);
    }
    for (const [slot, count] of counts) {
      if (slot !== 'RAM' && slot !== 'STORAGE' && count > 1) {
        ctx.addIssue({
          code: 'custom',
          path: [],
          message: `Only one product allowed for slot ${slot}.`,
        });
      }
    }
  });

export const previewBuildInputSchema = z
  .object({
    components: buildComponentsSchema,
  })
  .strict();

export const saveBuildInputSchema = z
  .object({
    id: cuidSchema.optional(),
    name: z.string().trim().min(1).max(120),
    notes: z.string().trim().max(2000).optional(),
    visibility: buildVisibilitySchema.default('PRIVATE'),
    slug: slugSchema.optional(),
    components: buildComponentsSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      (value.visibility === 'PUBLIC' || value.visibility === 'UNLISTED') &&
      !value.slug
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: 'A slug is required for public or unlisted builds.',
      });
    }
    if (value.visibility === 'PRIVATE' && value.slug) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: 'Private builds cannot have a public slug.',
      });
    }
  });

export const duplicateBuildInputSchema = z
  .object({
    id: cuidSchema,
    name: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const deleteBuildInputSchema = z
  .object({
    id: cuidSchema,
  })
  .strict();

export const buildIdOrSlugSchema = z
  .object({
    id: cuidSchema.optional(),
    slug: slugSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasId = Boolean(value.id);
    const hasSlug = Boolean(value.slug);
    if (hasId === hasSlug) {
      ctx.addIssue({
        code: 'custom',
        path: ['id'],
        message: 'Provide exactly one of id or slug.',
      });
    }
  });

/** Re-export for callers that only need the shared component shape. */
export type BuildComponentInput = z.infer<typeof buildComponentSchema>;
export type PreviewBuildInput = z.infer<typeof previewBuildInputSchema>;
export type SaveBuildInput = z.infer<typeof saveBuildInputSchema>;
export type DuplicateBuildInput = z.infer<typeof duplicateBuildInputSchema>;
export type DeleteBuildInput = z.infer<typeof deleteBuildInputSchema>;
export type BuildIdOrSlug = z.infer<typeof buildIdOrSlugSchema>;

/** Steps shown in the builder UI (order fixed). */
export const BUILDER_STEPS = [
  'CPU',
  'GPU',
  'MOTHERBOARD',
  'RAM',
  'STORAGE',
  'PSU',
  'CASE',
  'COOLER',
  'REVIEW',
] as const;
export type BuilderStep = (typeof BUILDER_STEPS)[number];

export function isComponentSlot(step: string): step is ComponentSlot {
  return componentSlotSchema.safeParse(step).success;
}

/** Narrow helper so UI can map CompatibilityComponentInput ↔ build components. */
export function toCompatibilityComponents(
  components: BuildComponentInput[],
): CompatibilityComponentInput[] {
  return components.map(({ slot, productId, quantity }) => ({
    slot,
    productId,
    quantity,
  }));
}

export { checkCompatibilityInputSchema };
