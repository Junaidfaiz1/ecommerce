import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import { requireUser } from '../../auth/rbac';
import {
  addWishlistItem,
  getWishlist,
  moveWishlistItemToCart,
  removeWishlistItem,
  wishlistContains,
} from '../../wishlist';
import {
  addWishlistItemArgsSchema,
  moveWishlistItemToCartArgsSchema,
  removeWishlistItemArgsSchema,
  wishlistContainsArgsSchema,
} from '../schemas/cart.schema';

export const wishlistResolvers = {
  Query: {
    wishlist: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      return getWishlist(ctx.prisma, user.id);
    },

    wishlistContains: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { variantId } = parseOrThrow(wishlistContainsArgsSchema, args);
      return wishlistContains(ctx.prisma, user.id, variantId);
    },
  },

  Mutation: {
    addToWishlist: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(addWishlistItemArgsSchema, args);
      return addWishlistItem(ctx.prisma, user.id, input);
    },

    removeFromWishlist: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(removeWishlistItemArgsSchema, args);
      return removeWishlistItem(ctx.prisma, user.id, input);
    },

    moveWishlistItemToCart: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(moveWishlistItemToCartArgsSchema, args);
      const result = await moveWishlistItemToCart(
        ctx.prisma,
        user.id,
        { userId: user.id, sessionId: ctx.cartSessionId },
        input,
      );
      return result;
    },
  },
};
