import { z } from 'zod';
import { cuidSchema } from './catalog';

/** Max products in a comparison tray. */
export const COMPARE_MAX_ITEMS = 4;

export const compareProductIdsSchema = z
  .array(cuidSchema)
  .min(1)
  .max(COMPARE_MAX_ITEMS)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Duplicate product ids are not allowed.',
  });

export const compareProductsInputSchema = z
  .object({
    ids: compareProductIdsSchema,
  })
  .strict();

export type CompareProductsInput = z.infer<typeof compareProductsInputSchema>;
