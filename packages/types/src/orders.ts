import { z } from 'zod';
import { paginationInputSchema, cuidSchema } from './catalog';
import { ORDER_STATUSES } from './checkout';

export const orderListInputSchema = paginationInputSchema
  .extend({
    status: z.enum(ORDER_STATUSES).optional(),
    pageSize: z.number().int().min(1).max(48).default(10),
  })
  .strict();

export const orderIdInputSchema = z
  .object({
    id: cuidSchema,
  })
  .strict();

export type OrderListInput = z.infer<typeof orderListInputSchema>;
export type OrderIdInput = z.infer<typeof orderIdInputSchema>;
