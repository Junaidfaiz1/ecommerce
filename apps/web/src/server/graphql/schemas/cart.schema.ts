import { z } from 'zod';
import {
  addBuildToCartInputSchema,
  addCartItemInputSchema,
  applyCouponInputSchema,
  removeCartItemInputSchema,
  updateCartItemInputSchema,
  addWishlistItemInputSchema,
  removeWishlistItemInputSchema,
  moveWishlistItemToCartInputSchema,
  cuidSchema,
} from '@vorqen/types';

export const addCartItemArgsSchema = z
  .object({ input: addCartItemInputSchema })
  .strict();

export const updateCartItemArgsSchema = z
  .object({ input: updateCartItemInputSchema })
  .strict();

export const removeCartItemArgsSchema = z
  .object({ input: removeCartItemInputSchema })
  .strict();

export const applyCouponArgsSchema = z
  .object({ input: applyCouponInputSchema })
  .strict();

export const addBuildToCartArgsSchema = z
  .object({ input: addBuildToCartInputSchema })
  .strict();

export const addWishlistItemArgsSchema = z
  .object({ input: addWishlistItemInputSchema })
  .strict();

export const removeWishlistItemArgsSchema = z
  .object({ input: removeWishlistItemInputSchema })
  .strict();

export const moveWishlistItemToCartArgsSchema = z
  .object({ input: moveWishlistItemToCartInputSchema })
  .strict();

export const wishlistContainsArgsSchema = z
  .object({ variantId: cuidSchema })
  .strict();
