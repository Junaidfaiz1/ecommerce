import {
  checkoutStatusInputSchema,
  createCheckoutInputSchema,
} from '@vorqen/types';
import { z } from 'zod';

export const createCheckoutSessionArgsSchema = z
  .object({
    input: createCheckoutInputSchema,
  })
  .strict();

export const checkoutStatusArgsSchema = checkoutStatusInputSchema;
