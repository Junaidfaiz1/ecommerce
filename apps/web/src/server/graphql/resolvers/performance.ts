import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import { estimatePerformance, listGames } from '../../performance';
import { estimatePerformanceArgsSchema } from '../schemas/performance.schema';

export const performanceResolvers = {
  Query: {
    games: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      return listGames(ctx.prisma);
    },

    estimatePerformance: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { input } = parseOrThrow(estimatePerformanceArgsSchema, args);
      return estimatePerformance(ctx.prisma, input);
    },
  },
};
