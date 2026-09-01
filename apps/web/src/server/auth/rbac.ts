import type { UserRole } from '@vorqen/types';
import { ForbiddenError, UnauthenticatedError } from '../common/errors';
import type { AuthUser } from './types';

export function requireUser(user: AuthUser | null | undefined): AuthUser {
  if (!user) {
    throw new UnauthenticatedError();
  }
  if (!user.isActive) {
    throw new ForbiddenError('Account is disabled.');
  }
  return user;
}

export function requireRoles(user: AuthUser | null | undefined, allowed: readonly UserRole[]): AuthUser {
  const authed = requireUser(user);
  if (!allowed.includes(authed.role)) {
    throw new ForbiddenError();
  }
  return authed;
}

export function requireAdmin(user: AuthUser | null | undefined): AuthUser {
  return requireRoles(user, ['ADMIN']);
}

export function requireStaff(user: AuthUser | null | undefined): AuthUser {
  return requireRoles(user, ['ADMIN', 'SUPPORT']);
}

export function hasRole(user: AuthUser | null | undefined, allowed: readonly UserRole[]): boolean {
  return !!user?.isActive && allowed.includes(user.role);
}
