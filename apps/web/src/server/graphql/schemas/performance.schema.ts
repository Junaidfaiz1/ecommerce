import { estimatePerformanceInputSchema } from '@vorqen/types';
import { z } from 'zod';

export const estimatePerformanceArgsSchema = z
  .object({
    input: estimatePerformanceInputSchema,
  })
  .strict();
