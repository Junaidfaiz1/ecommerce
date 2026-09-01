import type { UpdateProfileInput } from '@vorqen/types';
import type { PrismaClient, User } from '@/generated/prisma/client';
import { NotFoundError } from '../common/errors';
import { type AuthUser, type PublicUser, toPublicUser } from '../auth/types';

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

export async function updateProfile(
  prisma: PrismaClient,
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing || !existing.isActive) {
    throw new NotFoundError('User not found.');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
    },
  });

  return toPublicUser(mapUser(updated));
}
