import {
  createAddressInputSchema,
  createReviewInputSchema,
  compareProductsInputSchema,
  deleteAddressInputSchema,
  productReviewsInputSchema,
  updateAddressInputSchema,
  updateProfileInputSchema,
} from '@vorqen/types';
import { z } from 'zod';

export const myAddressesArgsSchema = z.object({}).strict();

export const createAddressArgsSchema = z
  .object({
    input: createAddressInputSchema,
  })
  .strict();

export const updateAddressArgsSchema = z
  .object({
    input: updateAddressInputSchema,
  })
  .strict();

export const deleteAddressArgsSchema = z
  .object({
    input: deleteAddressInputSchema,
  })
  .strict();

export const updateProfileArgsSchema = z
  .object({
    input: updateProfileInputSchema,
  })
  .strict();

export const productReviewsArgsSchema = z
  .object({
    input: productReviewsInputSchema,
  })
  .strict();

export const createReviewArgsSchema = z
  .object({
    input: createReviewInputSchema,
  })
  .strict();

export const compareProductsArgsSchema = z
  .object({
    input: compareProductsInputSchema,
  })
  .strict();
