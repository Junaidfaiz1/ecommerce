import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import { requireUser } from '../../auth/rbac';
import {
  createCheckoutSession,
  getCheckoutStatus,
} from '../../checkout';
import {
  checkoutStatusArgsSchema,
  createCheckoutSessionArgsSchema,
} from '../schemas/checkout.schema';

export const checkoutResolvers = {
  Query: {
    checkoutStatus: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const input = parseOrThrow(checkoutStatusArgsSchema, args);
      return getCheckoutStatus(ctx.prisma, user.id, input);
    },
  },
  Mutation: {
    createCheckoutSession: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(createCheckoutSessionArgsSchema, args);
      return createCheckoutSession(
        ctx.prisma,
        user,
        { userId: user.id, sessionId: ctx.cartSessionId },
        input,
      );
    },
  },
};
