import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { passwordSchema } from '@vorqen/types';
import { ForbiddenError, UnauthenticatedError } from '../common/errors';
import { hashPassword, verifyPassword } from './password';
import { generateOpaqueToken, hashToken } from './jwt';
import { hasRole, requireAdmin, requireUser } from './rbac';
import type { AuthUser } from './types';

const baseUser: AuthUser = {
  id: 'u1',
  email: 'a@vorqen.local',
  firstName: 'A',
  lastName: null,
  role: 'CUSTOMER',
  emailVerifiedAt: null,
  isActive: true,
  createdAt: new Date(),
};

describe('password hashing', () => {
  it('hashes and verifies', async () => {
    const hash = await hashPassword('Password123!');
    assert.notEqual(hash, 'Password123!');
    assert.equal(await verifyPassword('Password123!', hash), true);
    assert.equal(await verifyPassword('wrong', hash), false);
  });
});

describe('password policy', () => {
  it('accepts strong passwords', () => {
    assert.equal(passwordSchema.safeParse('Password123!').success, true);
  });

  it('rejects weak passwords', () => {
    assert.equal(passwordSchema.safeParse('short').success, false);
    assert.equal(passwordSchema.safeParse('onlyletters').success, false);
    assert.equal(passwordSchema.safeParse('12345678').success, false);
  });
});

describe('token hashing', () => {
  it('is deterministic and opaque', () => {
    const raw = generateOpaqueToken();
    assert.ok(raw.length >= 32);
    assert.equal(hashToken(raw), hashToken(raw));
    assert.notEqual(hashToken(raw), raw);
  });
});

describe('rbac', () => {
  it('requireUser throws when anonymous', () => {
    assert.throws(() => requireUser(null), UnauthenticatedError);
  });

  it('requireAdmin rejects customers', () => {
    assert.throws(() => requireAdmin(baseUser), ForbiddenError);
  });

  it('requireAdmin allows admins', () => {
    const admin = { ...baseUser, role: 'ADMIN' as const };
    assert.equal(requireAdmin(admin).id, 'u1');
  });

  it('hasRole checks membership', () => {
    assert.equal(hasRole(baseUser, ['CUSTOMER']), true);
    assert.equal(hasRole(baseUser, ['ADMIN']), false);
    assert.equal(hasRole({ ...baseUser, isActive: false }, ['CUSTOMER']), false);
  });
});
