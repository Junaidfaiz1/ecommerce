import { z } from 'zod';
import { cuidSchema } from './catalog';

export const COMPONENT_SLOTS = [
  'CPU',
  'GPU',
  'MOTHERBOARD',
  'RAM',
  'STORAGE',
  'PSU',
  'CASE',
  'COOLER',
] as const;
export type ComponentSlot = (typeof COMPONENT_SLOTS)[number];

/** Slots that may appear more than once in a selection. */
export const MULTI_SLOTS = ['STORAGE', 'RAM'] as const satisfies readonly ComponentSlot[];

export const componentSlotSchema = z.enum(COMPONENT_SLOTS);

export const compatibilityComponentSchema = z
  .object({
    slot: componentSlotSchema,
    productId: cuidSchema,
    quantity: z.number().int().min(1).max(16).default(1),
  })
  .strict();

export const checkCompatibilityInputSchema = z
  .object({
    components: z.array(compatibilityComponentSchema).min(1).max(32),
  })
  .strict()
  .superRefine((value, ctx) => {
    const counts = new Map<ComponentSlot, number>();
    for (const item of value.components) {
      counts.set(item.slot, (counts.get(item.slot) ?? 0) + 1);
    }
    for (const [slot, count] of counts) {
      const allowMulti = (MULTI_SLOTS as readonly string[]).includes(slot);
      if (!allowMulti && count > 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['components'],
          message: `Only one product allowed for slot ${slot}.`,
        });
      }
    }
  });

export type CompatibilityComponentInput = z.infer<
  typeof compatibilityComponentSchema
>;
export type CheckCompatibilityInput = z.infer<
  typeof checkCompatibilityInputSchema
>;

export type CompatibilityResult = {
  compatible: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  /** Estimated system draw before PSU safety margin (watts). */
  estimatedWattage: number | null;
  /** Minimum PSU wattage recommended after safety margin. */
  recommendedPsuWatts: number | null;
};
