import {
  loginInputSchema,
  registerInputSchema,
  requestPasswordResetInputSchema,
  resetPasswordInputSchema,
  verifyEmailInputSchema,
} from '@vorqen/types';
import { z } from 'zod';

export const registerArgsSchema = z
  .object({
    input: registerInputSchema,
  })
  .strict();

export const loginArgsSchema = z
  .object({
    input: loginInputSchema,
  })
  .strict();

export const requestPasswordResetArgsSchema = z
  .object({
    input: requestPasswordResetInputSchema,
  })
  .strict();

export const resetPasswordArgsSchema = z
  .object({
    input: resetPasswordInputSchema,
  })
  .strict();

export const verifyEmailArgsSchema = z
  .object({
    input: verifyEmailInputSchema,
  })
  .strict();
