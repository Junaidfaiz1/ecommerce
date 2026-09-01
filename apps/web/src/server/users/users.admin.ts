import type {
  AdminCustomerListInput,
  SetCustomerActiveInput,
} from '@vorqen/types';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { paginationMeta } from '../catalog/catalog.filters';
import { ForbiddenError, NotFoundError } from '../common/errors';
import { writeAuditLog } from '../audit';
import { toPublicUser, type AuthUser } from '../auth/types';

export async function listAdminCustomers(
  prisma: PrismaClient,
  input: AdminCustomerListInput,
) {
  const where: Prisma.UserWhereInput = {
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    ...(input.query
      ? {
          OR: [
            { email: { contains: input.query, mode: 'insensitive' } },
            { firstName: { contains: input.query, mode: 'insensitive' } },
            { lastName: { contains: input.query, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const totalCount = await prisma.user.count({ where });
  const meta = paginationMeta(totalCount, input.page, input.pageSize);
  const rows = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: meta.skip,
    take: meta.pageSize,
    include: { _count: { select: { orders: true } } },
  });
  return {
    items: rows.map((row) => ({
      ...toPublicUser({
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        role: row.role,
        emailVerifiedAt: row.emailVerifiedAt,
        isActive: row.isActive,
        createdAt: row.createdAt,
      }),
      orderCount: row._count.orders,
    })),
    pageInfo: {
      page: meta.page,
      pageSize: meta.pageSize,
      totalCount: meta.totalCount,
      totalPages: meta.totalPages,
      hasNextPage: meta.hasNextPage,
      hasPreviousPage: meta.hasPreviousPage,
    },
  };
}

export async function setCustomerActive(
  prisma: PrismaClient,
  actor: AuthUser,
  input: SetCustomerActiveInput,
  ip: string | null,
) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new NotFoundError('Customer not found.');
  if (user.id === actor.id) {
    throw new ForbiddenError('You cannot change your own active flag.');
  }
  if (user.role === 'ADMIN' && actor.role !== 'ADMIN') {
    throw new ForbiddenError();
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isActive: input.isActive },
  });
  await writeAuditLog(prisma, {
    actorUserId: actor.id,
    action: input.isActive ? 'user.activate' : 'user.deactivate',
    entityType: 'User',
    entityId: user.id,
    ip,
  });
  return toPublicUser({
    id: updated.id,
    email: updated.email,
    firstName: updated.firstName,
    lastName: updated.lastName,
    role: updated.role,
    emailVerifiedAt: updated.emailVerifiedAt,
    isActive: updated.isActive,
    createdAt: updated.createdAt,
  });
}
