import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import { requireUser } from '../../auth/rbac';
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from '../../users/address.service';
import { updateProfile } from '../../users/profile.service';
import {
  createAddressArgsSchema,
  deleteAddressArgsSchema,
  updateAddressArgsSchema,
  updateProfileArgsSchema,
} from '../schemas/storefront.schema';

export const accountResolvers = {
  Query: {
    myAddresses: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      return listAddresses(ctx.prisma, user.id);
    },
  },
  Mutation: {
    createAddress: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(createAddressArgsSchema, args);
      return createAddress(ctx.prisma, user.id, input);
    },

    updateAddress: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(updateAddressArgsSchema, args);
      return updateAddress(ctx.prisma, user.id, input);
    },

    deleteAddress: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(deleteAddressArgsSchema, args);
      return deleteAddress(ctx.prisma, user.id, input);
    },

    updateProfile: async (
      _parent: unknown,
      args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      const { input } = parseOrThrow(updateProfileArgsSchema, args);
      return updateProfile(ctx.prisma, user.id, input);
    },
  },
};

