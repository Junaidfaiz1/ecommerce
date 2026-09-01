import { z } from 'zod';
import { cuidSchema } from './catalog';

export const GRAPHICS_QUALITIES = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'] as const;
export type GraphicsQuality = (typeof GRAPHICS_QUALITIES)[number];

export const graphicsQualitySchema = z.enum(GRAPHICS_QUALITIES);

export const estimatePerformanceInputSchema = z
  .object({
    cpuProductId: cuidSchema,
    gpuProductId: cuidSchema,
    gameId: cuidSchema.optional(),
    gameSlug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    resolution: z.string().trim().min(2).max(32).optional(),
    quality: graphicsQualitySchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.gameId && !value.gameSlug) {
      // OK — return all games for this CPU/GPU pair
      return;
    }
    if (value.gameId && value.gameSlug) {
      ctx.addIssue({
        code: 'custom',
        path: ['gameId'],
        message: 'Provide at most one of gameId or gameSlug.',
      });
    }
  });

export type EstimatePerformanceInput = z.infer<
  typeof estimatePerformanceInputSchema
>;
