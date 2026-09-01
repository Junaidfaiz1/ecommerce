import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import {
  addBuildToCart,
  addCartItem,
  applyCoupon,
  clearCart,
  getCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
  type CartIdentity,
} from '../../cart';
import {
  addBuildToCartArgsSchema,
  addCartItemArgsSchema,
  applyCouponArgsSchema,
  removeCartItemArgsSchema,
  updateCartItemArgsSchema,
} from '../schemas/cart.schema';

function identity(ctx: GraphQLContext): CartIdentity {
  return {
    userId: ctx.userId,
    sessionId: ctx.cartSessionId,
  };
}

export const cartResolvers = {
  Query: {
    cart: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      return getCart(ctx.prisma, identity(ctx));
    },
  },

  Mutation: {
    addToCart: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { input } = parseOrThrow(addCartItemArgsSchema, args);
      return addCartItem(ctx.prisma, identity(ctx), input);
    },

    updateCartItem: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { input } = parseOrThrow(updateCartItemArgsSchema, args);
      return updateCartItem(ctx.prisma, identity(ctx), input);
    },

    removeCartItem: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { input } = parseOrThrow(removeCartItemArgsSchema, args);
      return removeCartItem(ctx.prisma, identity(ctx), input);
    },

    clearCart: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ) => {
      return clearCart(ctx.prisma, identity(ctx));
    },

    applyCoupon: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { input } = parseOrThrow(applyCouponArgsSchema, args);
      return applyCoupon(ctx.prisma, identity(ctx), input);
    },

    removeCoupon: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ) => {
      return removeCoupon(ctx.prisma, identity(ctx));
    },

    addBuildToCart: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { input } = parseOrThrow(addBuildToCartArgsSchema, args);
      return addBuildToCart(ctx.prisma, identity(ctx), input);
    },
  },
};
