import type { UserRole } from '@vorqen/types';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  emailVerifiedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
};

export type PublicUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  emailVerifiedAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export type AuthSession = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export function toPublicUser(user: AuthUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}
