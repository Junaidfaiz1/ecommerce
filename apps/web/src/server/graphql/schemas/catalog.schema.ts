import {
  cuidSchema,
  productListInputSchema,
  slugSchema,
} from '@vorqen/types';
import { z } from 'zod';

export const productsArgsSchema = productListInputSchema;

export const productArgsSchema = z
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
        path: ['_root'],
        message: 'Provide exactly one of id or slug.',
      });
    }
  });

export const brandArgsSchema = z
  .object({
    slug: slugSchema,
  })
  .strict();

export const categoryArgsSchema = z
  .object({
    slug: slugSchema,
  })
  .strict();

export const variantArgsSchema = z
  .object({
    sku: z.string().trim().min(1).max(64),
  })
  .strict();
