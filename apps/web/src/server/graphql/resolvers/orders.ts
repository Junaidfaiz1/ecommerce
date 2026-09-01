import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import { requireUser } from '../../auth/rbac';
import {
  cancelPendingOrder,
  getMyOrder,
  listMyOrders,
} from '../../orders';
import {
  cancelPendingOrderArgsSchema,
  myOrdersArgsSchema,
  orderArgsSchema,
} from '../schemas/orders.schema';

export const orderResolvers = {
  Query: {
    myOrders: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(myOrdersArgsSchema, args);
      return listMyOrders(
        ctx.prisma,
        user.id,
        input ?? { page: 1, pageSize: 10 },
      );
    },
    order: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const user = requireUser(ctx.user);
      const { id } = parseOrThrow(orderArgsSchema, args);
      return getMyOrder(ctx.prisma, user.id, id);
    },
  },
  Mutation: {
    cancelPendingOrder: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { id } = parseOrThrow(cancelPendingOrderArgsSchema, args);
      return cancelPendingOrder(ctx.prisma, user.id, id);
    },
  },
};
