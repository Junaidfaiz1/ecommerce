import { z } from 'zod';
import { cuidSchema } from './catalog';

/** Soft cap per line — checkout still re-checks stock in Phase 12. */
export const CART_MAX_LINE_QUANTITY = 99;
export const CART_MAX_LINES = 50;

export const cartQuantitySchema = z
  .number()
  .int()
  .min(1)
  .max(CART_MAX_LINE_QUANTITY);

export const couponCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid coupon code.')
  .transform((code) => code.toUpperCase());

export const addCartItemInputSchema = z
  .object({
    variantId: cuidSchema,
    quantity: cartQuantitySchema.default(1),
  })
  .strict();

export const updateCartItemInputSchema = z
  .object({
    variantId: cuidSchema,
    quantity: cartQuantitySchema,
  })
  .strict();

export const removeCartItemInputSchema = z
  .object({
    variantId: cuidSchema,
  })
  .strict();

export const applyCouponInputSchema = z
  .object({
    code: couponCodeSchema,
  })
  .strict();

export const addBuildToCartInputSchema = z
  .object({
    buildId: cuidSchema,
  })
  .strict();

export const addWishlistItemInputSchema = z
  .object({
    variantId: cuidSchema,
  })
  .strict();

export const removeWishlistItemInputSchema = z
  .object({
    variantId: cuidSchema,
  })
  .strict();

export const moveWishlistItemToCartInputSchema = z
  .object({
    variantId: cuidSchema,
    quantity: cartQuantitySchema.default(1),
  })
  .strict();

export type AddCartItemInput = z.infer<typeof addCartItemInputSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemInputSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponInputSchema>;
export type AddBuildToCartInput = z.infer<typeof addBuildToCartInputSchema>;
export type AddWishlistItemInput = z.infer<typeof addWishlistItemInputSchema>;
export type RemoveWishlistItemInput = z.infer<
  typeof removeWishlistItemInputSchema
>;
export type MoveWishlistItemToCartInput = z.infer<
  typeof moveWishlistItemToCartInputSchema
>;
