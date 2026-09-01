import { orderIdInputSchema, orderListInputSchema } from '@vorqen/types';
import { z } from 'zod';

export const myOrdersArgsSchema = z
  .object({
    input: orderListInputSchema.nullish(),
  })
  .strict();

export const orderArgsSchema = z
  .object({
    id: orderIdInputSchema.shape.id,
  })
  .strict();

export const cancelPendingOrderArgsSchema = orderArgsSchema;
