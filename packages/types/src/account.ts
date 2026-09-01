import { z } from 'zod';
import { cuidSchema } from './catalog';

export const ADDRESS_TYPES = ['SHIPPING', 'BILLING', 'BOTH'] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(2, 'Country must be a 2-letter ISO code.');

export const addressInputSchema = z
  .object({
    label: z.string().trim().min(1).max(80).optional().nullable(),
    line1: z.string().trim().min(1).max(120),
    line2: z.string().trim().min(1).max(120).optional().nullable(),
    city: z.string().trim().min(1).max(80),
    state: z.string().trim().min(1).max(80).optional().nullable(),
    postalCode: z.string().trim().min(1).max(20),
    country: countryCodeSchema,
    phone: z.string().trim().min(5).max(30).optional().nullable(),
    type: z.enum(ADDRESS_TYPES).default('SHIPPING'),
    isDefault: z.boolean().default(false),
  })
  .strict();

export const createAddressInputSchema = addressInputSchema;

export const updateAddressInputSchema = addressInputSchema
  .partial()
  .extend({
    id: cuidSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const { id: _id, ...rest } = value;
    if (Object.keys(rest).length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['_root'],
        message: 'Provide at least one field to update.',
      });
    }
  });

export const deleteAddressInputSchema = z
  .object({
    id: cuidSchema,
  })
  .strict();

export const updateProfileInputSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional().nullable(),
    lastName: z.string().trim().min(1).max(80).optional().nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.firstName === undefined && value.lastName === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['_root'],
        message: 'Provide firstName and/or lastName.',
      });
    }
  });

export type AddressInput = z.infer<typeof addressInputSchema>;
export type CreateAddressInput = z.infer<typeof createAddressInputSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressInputSchema>;
export type DeleteAddressInput = z.infer<typeof deleteAddressInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
