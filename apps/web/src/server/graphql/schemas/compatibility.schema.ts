import { checkCompatibilityInputSchema } from '@vorqen/types';
import { z } from 'zod';

export const checkCompatibilityArgsSchema = z
  .object({
    input: checkCompatibilityInputSchema,
  })
  .strict();
