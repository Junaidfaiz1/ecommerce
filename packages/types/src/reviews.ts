import { z } from 'zod';
import { cuidSchema, slugSchema } from './catalog';

export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const createReviewInputSchema = z
  .object({
    productId: cuidSchema,
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().min(1).max(120).optional().nullable(),
    body: z.string().trim().min(1).max(4000).optional().nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.title && !value.body) {
      ctx.addIssue({
        code: 'custom',
        path: ['body'],
        message: 'Add a title or review body.',
      });
    }
  });

export const productReviewsInputSchema = z
  .object({
    productId: cuidSchema.optional(),
    productSlug: slugSchema.optional(),
    page: z.number().int().min(1).max(10_000).default(1),
    pageSize: z.number().int().min(1).max(48).default(10),
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

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type ProductReviewsInput = z.infer<typeof productReviewsInputSchema>;
