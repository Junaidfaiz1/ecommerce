import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NextRequest } from 'next/server';
import {
  ForbiddenError,
  UnauthenticatedError,
} from '../common/errors';
import {
  requireAdmin,
  requireStaff,
  requireUser,
} from './rbac';
import {
  signAccessToken,
  verifyAccessToken,
} from './jwt';
import { middleware } from '../../middleware';
import { adminResolvers } from '../graphql/resolvers/admin';
import { IDS, authUser, seedShop } from '../test/fixtures';
import { createMemoryPrisma } from '../test/memory-prisma';
import { executeGraphql, testContext } from '../test/graphql';

const JWT_SECRET = 'phase17-test-jwt-secret-key-32ch';
const JWT_REFRESH = 'phase17-test-refresh-secret-32ch';

describe('auth + RBAC guards', () => {
  it('signs and verifies an access token; rejects a tampered one', async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = JWT_REFRESH;

    const token = await signAccessToken(IDS.customer, 'CUSTOMER');
    const claims = await verifyAccessToken(token);
    assert.equal(claims?.sub, IDS.customer);
    assert.equal(claims?.role, 'CUSTOMER');

    const parts = token.split('.');
    parts[2] = 'deadbeef';
    assert.equal(await verifyAccessToken(parts.join('.')), null);
  });

  it('requireStaff rejects customers and inactive accounts', () => {
    const customer = authUser(IDS.customer);
    assert.throws(() => requireStaff(null), UnauthenticatedError);
    assert.throws(() => requireStaff(customer), ForbiddenError);
    assert.throws(
      () => requireUser({ ...customer, isActive: false }),
      ForbiddenError,
    );
    assert.equal(requireAdmin(authUser(IDS.admin, 'ADMIN')).id, IDS.admin);
    assert.equal(
      requireStaff(authUser(IDS.support, 'SUPPORT')).role,
      'SUPPORT',
    );
  });

  it('customers cannot query staff analytics or overview', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    const ctx = testContext(prisma, authUser(IDS.customer));

    await assert.rejects(
      () => adminResolvers.Query.adminOverview(null, {}, ctx),
      ForbiddenError,
    );
    await assert.rejects(
      () =>
        adminResolvers.Query.adminAnalytics(
          null,
          { input: { range: '30d' } },
          ctx,
        ),
      ForbiddenError,
    );

    const result = await executeGraphql(
      `query { adminOverview { pendingPaymentOrders } }`,
      ctx,
    );
    const overviewData = result.data as { adminOverview?: unknown } | null | undefined;
    assert.equal(overviewData?.adminOverview ?? null, null);
    assert.equal(result.errors?.[0]?.extensions?.code, 'FORBIDDEN');
  });

  it('anonymous callers cannot hit me as a populated user', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    const result = await executeGraphql(`query { me { id role } }`, testContext(prisma));
    const meData = result.data as { me?: unknown } | null | undefined;
    assert.equal(meData?.me ?? null, null);
    assert.equal(result.errors, undefined);
  });

  it('middleware sends customers away from /admin and guests away from /checkout', async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    const customerToken = await signAccessToken(IDS.customer, 'CUSTOMER');
    const adminToken = await signAccessToken(IDS.admin, 'ADMIN');

    const customerAdmin = await middleware(
      new NextRequest('http://localhost:3000/admin/orders', {
        headers: { cookie: `vorqen_access=${customerToken}` },
      }),
    );
    assert.equal(customerAdmin.status, 307);
    assert.match(customerAdmin.headers.get('location') ?? '', /\/login/);

    const guestCheckout = await middleware(
      new NextRequest('http://localhost:3000/checkout'),
    );
    assert.equal(guestCheckout.status, 307);

    const adminOk = await middleware(
      new NextRequest('http://localhost:3000/admin', {
        headers: { cookie: `vorqen_access=${adminToken}` },
      }),
    );
    assert.equal(adminOk.headers.get('location'), null);
  });
});
