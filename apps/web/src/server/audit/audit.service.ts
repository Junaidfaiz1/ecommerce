import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import {
  isAuditAction,
  sanitizeAuditMetadata,
  type AdminAuditLogListInput,
} from '@vorqen/types';
import { logger } from '../common/logger';
import { paginationMeta } from '../catalog/catalog.filters';

type Db = PrismaClient | Prisma.TransactionClient;

export async function writeAuditLog(
  db: Db,
  input: {
    actorUserId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
    ip?: string | null;
  },
): Promise<void> {
  if (!isAuditAction(input.action)) {
    logger.warn('Unknown audit action', { action: input.action });
  }

  const metadata = input.metadata
    ? (sanitizeAuditMetadata(input.metadata) as Prisma.InputJsonValue)
    : undefined;

  await db.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action.slice(0, 80),
      entityType: input.entityType.slice(0, 80),
      entityId: input.entityId ?? null,
      metadata,
      ip: input.ip?.slice(0, 64) ?? null,
    },
  });
}

export function clientIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim().slice(0, 64) || null;
  }
  return request.headers.get('x-real-ip')?.slice(0, 64) ?? null;
}

export type AdminAuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Prisma.JsonValue;
  ip: string | null;
  createdAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
};

export async function listAdminAuditLogs(
  prisma: PrismaClient,
  input: AdminAuditLogListInput,
): Promise<{
  items: AdminAuditLogRow[];
  pageInfo: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> {
  const where = {
    ...(input.action ? { action: input.action } : {}),
    ...(input.entityType ? { entityType: input.entityType } : {}),
    ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
  };

  const totalCount = await prisma.auditLog.count({ where });
  const meta = paginationMeta(totalCount, input.page, input.pageSize);

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: meta.skip,
    take: meta.pageSize,
    include: {
      actor: { select: { email: true } },
    },
  });

  return {
    items: rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: row.metadata,
      ip: row.ip,
      createdAt: row.createdAt.toISOString(),
      actorUserId: row.actorUserId,
      actorEmail: row.actor?.email ?? null,
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
