import type { GraphQLContext } from '../context';
import { getHealth } from '../../health/health.service';
import { parseOrThrow } from '../../common/validation';
import { pingArgsSchema } from '../schemas/ping.schema';

export const healthResolvers = {
  Query: {
    health: async () => getHealth(),

    ping: (_parent: unknown, args: unknown) => {
      const { echo } = parseOrThrow(pingArgsSchema, args);
      return echo ?? 'pong';
    },

    /** Foundation probe — confirms Prisma is wired into GraphQL context. */
    serverInfo: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      let database: 'up' | 'down' = 'up';
      try {
        await ctx.prisma.$queryRaw`SELECT 1`;
      } catch {
        database = 'down';
      }

      return {
        name: 'VORQEN',
        version: '0.0.1',
        environment: process.env.NODE_ENV ?? 'development',
        database,
      };
    },
  },
};
