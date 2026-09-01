import {
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from '@vorqen/types';
import type { PrismaClient, User } from '@/generated/prisma/client';
import {
  ConflictError,
  UnauthenticatedError,
  ValidationError,
} from '../common/errors';
import { logger } from '../common/logger';
import { getAppUrl, sendAuthEmail } from '../email';
import {
  clearAuthCookies,
  setAccessCookie,
  setRefreshCookie,
} from './cookies';
import {
  challengeExpiresAt,
  generateOpaqueToken,
  hashToken,
  refreshExpiresAt,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './jwt';
import { hashPassword, verifyPassword } from './password';
import {
  type AuthSession,
  type AuthUser,
  type PublicUser,
  toPublicUser,
} from './types';

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function clientMeta(request?: Request): { userAgent?: string; ip?: string } {
  if (!request) return {};
  return {
    userAgent: request.headers.get('user-agent')?.slice(0, 512) ?? undefined,
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()?.slice(0, 64) ??
      undefined,
  };
}

async function issueSession(
  prisma: PrismaClient,
  user: User,
  request?: Request,
): Promise<AuthSession> {
  const jti = generateOpaqueToken();
  const refreshJwt = await signRefreshToken(user.id, jti);
  const accessJwt = await signAccessToken(user.id, user.role);
  const meta = clientMeta(request);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(jti),
      expiresAt: refreshExpiresAt(),
      userAgent: meta.userAgent,
      ip: meta.ip,
    },
  });

  await setAccessCookie(accessJwt);
  await setRefreshCookie(refreshJwt);

  return {
    user: toPublicUser(mapUser(user)),
    accessToken: accessJwt,
    refreshToken: refreshJwt,
  };
}

async function createEmailVerifyChallenge(
  prisma: PrismaClient,
  userId: string,
): Promise<string> {
  const raw = generateOpaqueToken();
  await prisma.authChallenge.create({
    data: {
      userId,
      purpose: 'EMAIL_VERIFY',
      tokenHash: hashToken(raw),
      expiresAt: challengeExpiresAt(),
    },
  });
  return raw;
}

function verificationUrl(token: string): string {
  return `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

function resetUrl(token: string): string {
  return `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function register(
  prisma: PrismaClient,
  input: RegisterInput,
  request?: Request,
): Promise<AuthSession> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('An account with this email already exists.', {
      email: 'Email is already registered.',
    });
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: 'CUSTOMER',
    },
  });

  const verifyToken = await createEmailVerifyChallenge(prisma, user.id);
  await sendAuthEmail('verify', user.email, verificationUrl(verifyToken));

  logger.info('user_registered', { userId: user.id });
  return issueSession(prisma, user, request);
}

export async function login(
  prisma: PrismaClient,
  input: LoginInput,
  request?: Request,
): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    logger.warn('login_failed', { email: input.email, reason: 'invalid_credentials' });
    throw new UnauthenticatedError('Invalid email or password.');
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    logger.warn('login_failed', { email: input.email, reason: 'invalid_credentials' });
    throw new UnauthenticatedError('Invalid email or password.');
  }

  logger.info('login_success', { userId: user.id });
  return issueSession(prisma, user, request);
}

export async function logout(
  prisma: PrismaClient,
  refreshTokenJwt: string | undefined,
): Promise<{ ok: true }> {
  if (refreshTokenJwt) {
    const claims = await verifyRefreshToken(refreshTokenJwt);
    if (claims) {
      await prisma.refreshToken.updateMany({
        where: {
          userId: claims.sub,
          tokenHash: hashToken(claims.jti),
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }
  }
  await clearAuthCookies();
  return { ok: true };
}

export async function refreshSession(
  prisma: PrismaClient,
  refreshTokenJwt: string | undefined,
  request?: Request,
): Promise<AuthSession> {
  if (!refreshTokenJwt) {
    throw new UnauthenticatedError('Refresh token required.');
  }

  const claims = await verifyRefreshToken(refreshTokenJwt);
  if (!claims) {
    await clearAuthCookies();
    throw new UnauthenticatedError('Invalid or expired refresh token.');
  }

  const stored = await prisma.refreshToken.findFirst({
    where: {
      userId: claims.sub,
      tokenHash: hashToken(claims.jti),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!stored) {
    await clearAuthCookies();
    throw new UnauthenticatedError('Refresh token revoked or expired.');
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  if (!user || !user.isActive) {
    await clearAuthCookies();
    throw new UnauthenticatedError('Account unavailable.');
  }

  return issueSession(prisma, user, request);
}

export async function getMe(prisma: PrismaClient, userId: string | null): Promise<PublicUser | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return null;
  return toPublicUser(mapUser(user));
}

export async function loadAuthUser(
  prisma: PrismaClient,
  userId: string,
): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return null;
  return mapUser(user);
}

export async function requestPasswordReset(
  prisma: PrismaClient,
  email: string,
): Promise<{ ok: true }> {
  // Always succeed to avoid email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.isActive) {
    await prisma.authChallenge.updateMany({
      where: {
        userId: user.id,
        purpose: 'PASSWORD_RESET',
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const raw = generateOpaqueToken();
    await prisma.authChallenge.create({
      data: {
        userId: user.id,
        purpose: 'PASSWORD_RESET',
        tokenHash: hashToken(raw),
        expiresAt: challengeExpiresAt(),
      },
    });
    await sendAuthEmail('reset', user.email, resetUrl(raw));
  }
  return { ok: true };
}

export async function resetPassword(
  prisma: PrismaClient,
  input: ResetPasswordInput,
): Promise<{ ok: true }> {
  const challenge = await prisma.authChallenge.findFirst({
    where: {
      tokenHash: hashToken(input.token),
      purpose: 'PASSWORD_RESET',
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!challenge) {
    throw new ValidationError('Invalid or expired reset token.', {
      token: 'Invalid or expired reset token.',
    });
  }

  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: challenge.userId },
      data: { passwordHash },
    }),
    prisma.authChallenge.update({
      where: { id: challenge.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: challenge.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await clearAuthCookies();
  logger.info('password_reset', { userId: challenge.userId });
  return { ok: true };
}

export async function verifyEmail(
  prisma: PrismaClient,
  input: VerifyEmailInput,
): Promise<PublicUser> {
  const challenge = await prisma.authChallenge.findFirst({
    where: {
      tokenHash: hashToken(input.token),
      purpose: 'EMAIL_VERIFY',
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!challenge) {
    throw new ValidationError('Invalid or expired verification token.', {
      token: 'Invalid or expired verification token.',
    });
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: challenge.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.authChallenge.update({
      where: { id: challenge.id },
      data: { usedAt: new Date() },
    }),
  ]);

  logger.info('email_verified', { userId: user.id });
  return toPublicUser(mapUser(user));
}

export async function resendVerification(
  prisma: PrismaClient,
  user: AuthUser,
): Promise<{ ok: true }> {
  if (user.emailVerifiedAt) {
    return { ok: true };
  }

  await prisma.authChallenge.updateMany({
    where: {
      userId: user.id,
      purpose: 'EMAIL_VERIFY',
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  const token = await createEmailVerifyChallenge(prisma, user.id);
  await sendAuthEmail('verify', user.email, verificationUrl(token));
  return { ok: true };
}
