import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import { checkCompatibility } from '../../compatibility/compatibility.service';
import { checkCompatibilityArgsSchema } from '../schemas/compatibility.schema';

export const compatibilityResolvers = {
  Query: {
    checkCompatibility: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { input } = parseOrThrow(checkCompatibilityArgsSchema, args);
      return checkCompatibility(ctx.prisma, input);
    },
  },
};
