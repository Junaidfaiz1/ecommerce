import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import { requireUser } from '../../auth/rbac';
import { getProductsByIds } from '../../catalog/catalog.service';
import {
  createReview,
  listProductReviews,
} from '../../reviews/reviews.service';
import {
  compareProductsArgsSchema,
  createReviewArgsSchema,
  productReviewsArgsSchema,
} from '../schemas/storefront.schema';

export const storefrontResolvers = {
  Query: {
    productReviews: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { input } = parseOrThrow(productReviewsArgsSchema, args);
      return listProductReviews(ctx.prisma, input);
    },

    compareProducts: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { input } = parseOrThrow(compareProductsArgsSchema, args);
      return getProductsByIds(ctx.prisma, input.ids);
    },
  },
  Mutation: {
    createReview: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(createReviewArgsSchema, args);
      return createReview(ctx.prisma, user.id, input);
    },
  },
};
