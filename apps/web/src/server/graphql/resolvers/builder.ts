import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import { requireUser } from '../../auth/rbac';
import {
  deleteBuild,
  duplicateBuild,
  getBuild,
  listMyBuilds,
  previewBuild,
  saveBuild,
} from '../../builder';
import {
  buildArgsSchema,
  deleteBuildArgsSchema,
  duplicateBuildArgsSchema,
  previewBuildArgsSchema,
  saveBuildArgsSchema,
} from '../schemas/builder.schema';

export const builderResolvers = {
  Query: {
    previewBuild: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const { input } = parseOrThrow(previewBuildArgsSchema, args);
      return previewBuild(ctx.prisma, input);
    },

    myBuilds: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      const user = requireUser(ctx.user);
      return listMyBuilds(ctx.prisma, user.id);
    },

    build: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const parsed = parseOrThrow(buildArgsSchema, args);
      return getBuild(ctx.prisma, parsed, ctx.userId);
    },
  },

  Mutation: {
    saveBuild: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(saveBuildArgsSchema, args);
      return saveBuild(ctx.prisma, user.id, input);
    },

    duplicateBuild: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(duplicateBuildArgsSchema, args);
      return duplicateBuild(ctx.prisma, user.id, input.id, input.name);
    },

    deleteBuild: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(deleteBuildArgsSchema, args);
      return deleteBuild(ctx.prisma, user.id, input.id);
    },
  },
};
