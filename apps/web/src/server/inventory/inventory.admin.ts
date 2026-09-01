import type { AdminInventoryListInput } from '@vorqen/types';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { paginationMeta } from '../catalog/catalog.filters';
import { availableQuantity } from '@vorqen/types';
import { writeAuditLog } from '../audit';
import { adjustInventory } from './inventory.service';

export type AdminInventoryRow = {
  inventoryId: string;
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  isLow: boolean;
};

export async function listAdminInventory(
  prisma: PrismaClient,
  input: AdminInventoryListInput,
) {
  const allWhere: Prisma.InventoryWhereInput = input.query
    ? {
        OR: [
          { variant: { sku: { contains: input.query, mode: 'insensitive' } } },
          {
            variant: {
              product: { name: { contains: input.query, mode: 'insensitive' } },
            },
          },
        ],
      }
    : {};

  const rows = await prisma.inventory.findMany({
    where: allWhere,
    include: {
      variant: { include: { product: { select: { id: true, name: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const mapped: AdminInventoryRow[] = rows.map((row) => {
    const available = availableQuantity(row.quantityOnHand, row.quantityReserved);
    return {
      inventoryId: row.id,
      variantId: row.variantId,
      productId: row.variant.product.id,
      productName: row.variant.product.name,
      sku: row.variant.sku,
      onHand: row.quantityOnHand,
      reserved: row.quantityReserved,
      available,
      lowStockThreshold: row.lowStockThreshold,
      isLow: row.quantityOnHand <= row.lowStockThreshold,
    };
  });

  const filtered = input.lowStockOnly
    ? mapped.filter((row) => row.isLow)
    : mapped;
  const totalCount = filtered.length;
  const meta = paginationMeta(totalCount, input.page, input.pageSize);
  const items = filtered.slice(meta.skip, meta.skip + meta.pageSize);

  return {
    items,
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

export async function adminAdjustInventory(
  prisma: PrismaClient,
  actorUserId: string,
  input: {
    variantId: string;
    quantityDelta: number;
    reason: string;
    lowStockThreshold?: number;
  },
  ip: string | null,
): Promise<AdminInventoryRow> {
  const snapshot = await prisma.$transaction(async (tx) => {
    const next = await adjustInventory(tx, {
      ...input,
      actorUserId,
    });
    await writeAuditLog(tx, {
      actorUserId,
      action: 'inventory.adjust',
      entityType: 'Inventory',
      entityId: next.id,
      metadata: {
        variantId: input.variantId,
        quantityDelta: input.quantityDelta,
      },
      ip,
    });
    return next;
  });

  const row = await prisma.inventory.findUniqueOrThrow({
    where: { id: snapshot.id },
    include: {
      variant: { include: { product: { select: { id: true, name: true } } } },
    },
  });
  const available = availableQuantity(row.quantityOnHand, row.quantityReserved);
  return {
    inventoryId: row.id,
    variantId: row.variantId,
    productId: row.variant.product.id,
    productName: row.variant.product.name,
    sku: row.variant.sku,
    onHand: row.quantityOnHand,
    reserved: row.quantityReserved,
    available,
    lowStockThreshold: row.lowStockThreshold,
    isLow: row.quantityOnHand <= row.lowStockThreshold,
  };
}
