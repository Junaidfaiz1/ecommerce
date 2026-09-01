import { z } from 'zod';

/** Password: ≥8 chars, at least one letter and one number. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.')
  .regex(/[A-Za-z]/, 'Password must include a letter.')
  .regex(/[0-9]/, 'Password must include a number.');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address.')
  .max(255);

export const registerInputSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const loginInputSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required.').max(128),
  })
  .strict();

export const requestPasswordResetInputSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const resetPasswordInputSchema = z
  .object({
    token: z.string().min(20).max(256),
    password: passwordSchema,
  })
  .strict();

export const verifyEmailInputSchema = z
  .object({
    token: z.string().min(20).max(256),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;

export const USER_ROLES = ['CUSTOMER', 'ADMIN', 'SUPPORT'] as const;
export type UserRole = (typeof USER_ROLES)[number];
