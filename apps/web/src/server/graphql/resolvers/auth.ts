import type { GraphQLContext } from '../context';
import { parseOrThrow } from '../../common/validation';
import {
  getMe,
  login,
  logout,
  refreshSession,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../../auth/auth.service';
import { requireUser } from '../../auth/rbac';
import { REFRESH_COOKIE, parseCookieHeader } from '../../auth/cookies';
import {
  loginArgsSchema,
  registerArgsSchema,
  requestPasswordResetArgsSchema,
  resetPasswordArgsSchema,
  verifyEmailArgsSchema,
} from '../schemas/auth.schema';

function refreshFromRequest(request: Request): string | undefined {
  return parseCookieHeader(request.headers.get('cookie'), REFRESH_COOKIE);
}

export const authResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      return getMe(ctx.prisma, ctx.userId);
    },
  },

  Mutation: {
    register: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const { input } = parseOrThrow(registerArgsSchema, args);
      return register(ctx.prisma, input, ctx.request);
    },

    login: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const { input } = parseOrThrow(loginArgsSchema, args);
      return login(ctx.prisma, input, ctx.request);
    },

    logout: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      return logout(ctx.prisma, refreshFromRequest(ctx.request));
    },

    refreshAuth: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      return refreshSession(ctx.prisma, refreshFromRequest(ctx.request), ctx.request);
    },

    requestPasswordReset: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const { input } = parseOrThrow(requestPasswordResetArgsSchema, args);
      return requestPasswordReset(ctx.prisma, input.email);
    },

    resetPassword: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const { input } = parseOrThrow(resetPasswordArgsSchema, args);
      return resetPassword(ctx.prisma, input);
    },

    verifyEmail: async (_parent: unknown, args: unknown, ctx: GraphQLContext) => {
      const { input } = parseOrThrow(verifyEmailArgsSchema, args);
      return verifyEmail(ctx.prisma, input);
    },

    resendVerificationEmail: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ) => {
      const user = requireUser(ctx.user);
      return resendVerification(ctx.prisma, user);
    },
  },
};
