import {
  applyAdjustment,
  applyCommit,
  applyRelease,
  applyReserve,
  type InventorySnapshot,
  type InventoryTxnType,
} from '@vorqen/types';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { InsufficientStockError, NotFoundError } from '../common/errors';
import { logger } from '../common/logger';

type Db = PrismaClient | Prisma.TransactionClient;

export type OrderStockLine = {
  variantId: string;
  quantity: number;
};

async function loadStock(
  db: Db,
  variantId: string,
): Promise<{ id: string } & InventorySnapshot> {
  const row = await db.inventory.findUnique({
    where: { variantId },
  });
  if (!row) {
    throw new NotFoundError('Inventory not found for this variant.', {
      variantId,
    });
  }
  return {
    id: row.id,
    onHand: row.quantityOnHand,
    reserved: row.quantityReserved,
  };
}

async function hasTxn(
  db: Db,
  orderId: string,
  inventoryId: string,
  type: InventoryTxnType,
): Promise<boolean> {
  const existing = await db.inventoryTransaction.findFirst({
    where: { orderId, inventoryId, type },
    select: { id: true },
  });
  return Boolean(existing);
}

async function writeSnapshot(
  db: Db,
  inventoryId: string,
  next: InventorySnapshot,
  txn: {
    type: InventoryTxnType;
    quantityDelta: number;
    orderId?: string | null;
    actorUserId?: string | null;
    reason: string;
  },
): Promise<void> {
  await db.inventory.update({
    where: { id: inventoryId },
    data: {
      quantityOnHand: next.onHand,
      quantityReserved: next.reserved,
    },
  });
  await db.inventoryTransaction.create({
    data: {
      inventoryId,
      type: txn.type,
      quantityDelta: txn.quantityDelta,
      orderId: txn.orderId ?? null,
      actorUserId: txn.actorUserId ?? null,
      reason: txn.reason,
    },
  });
}

export async function reserveOrderStock(
  db: Db,
  orderId: string,
  lines: OrderStockLine[],
): Promise<void> {
  for (const line of lines) {
    const stock = await loadStock(db, line.variantId);
    if (await hasTxn(db, orderId, stock.id, 'RESERVE')) {
      continue;
    }
    const next = applyReserve(stock, line.quantity);
    if (!next.ok) {
      throw new InsufficientStockError(
        next.reason === 'insufficient'
          ? 'Not enough stock to reserve this order.'
          : 'Invalid quantity for reservation.',
        { variantId: line.variantId },
      );
    }
    await writeSnapshot(db, stock.id, next, {
      type: 'RESERVE',
      quantityDelta: line.quantity,
      orderId,
      reason: 'checkout_reserve',
    });
  }
}

export async function commitOrderStock(
  db: Db,
  orderId: string,
  lines: OrderStockLine[],
): Promise<void> {
  for (const line of lines) {
    const stock = await loadStock(db, line.variantId);
    if (await hasTxn(db, orderId, stock.id, 'SALE')) {
      continue;
    }
    const next = applyCommit(stock, line.quantity);
    if (!next.ok) {
      logger.error('Inventory commit failed after payment', {
        orderId,
        variantId: line.variantId,
        reason: next.reason,
      });
      throw new InsufficientStockError(
        'Paid order could not be fulfilled from inventory.',
        { variantId: line.variantId },
      );
    }
    await writeSnapshot(db, stock.id, next, {
      type: 'SALE',
      quantityDelta: -line.quantity,
      orderId,
      reason: 'payment_sale',
    });
  }
}

export async function releaseOrderStock(
  db: Db,
  orderId: string,
  lines: OrderStockLine[],
): Promise<void> {
  for (const line of lines) {
    const stock = await loadStock(db, line.variantId);
    if (await hasTxn(db, orderId, stock.id, 'SALE')) {
      continue;
    }
    if (await hasTxn(db, orderId, stock.id, 'RELEASE')) {
      continue;
    }
    if (!(await hasTxn(db, orderId, stock.id, 'RESERVE'))) {
      continue;
    }
    const next = applyRelease(stock, line.quantity);
    if (!next.ok) {
      logger.warn('Inventory release skipped', {
        orderId,
        variantId: line.variantId,
        reason: next.reason,
      });
      continue;
    }
    await writeSnapshot(db, stock.id, next, {
      type: 'RELEASE',
      quantityDelta: -line.quantity,
      orderId,
      reason: 'payment_release',
    });
  }
}

export async function loadOrderStockLines(
  db: Db,
  orderId: string,
): Promise<OrderStockLine[]> {
  const items = await db.orderItem.findMany({
    where: { orderId },
    select: { variantId: true, quantity: true },
  });
  return items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
  }));
}

export async function adjustInventory(
  db: Db,
  input: {
    variantId: string;
    quantityDelta: number;
    reason: string;
    lowStockThreshold?: number;
    actorUserId: string;
  },
): Promise<{ id: string } & InventorySnapshot & { lowStockThreshold: number }> {
  const stock = await loadStock(db, input.variantId);
  let next: InventorySnapshot = stock;
  if (input.quantityDelta !== 0) {
    const applied = applyAdjustment(stock, input.quantityDelta);
    if (!applied.ok) {
      throw new InsufficientStockError(
        'This adjustment would leave less on-hand than reserved.',
        { variantId: input.variantId },
      );
    }
    next = applied;
    await writeSnapshot(db, stock.id, next, {
      type: 'ADJUSTMENT',
      quantityDelta: input.quantityDelta,
      actorUserId: input.actorUserId,
      reason: input.reason,
    });
  }

  if (input.lowStockThreshold !== undefined) {
    await db.inventory.update({
      where: { id: stock.id },
      data: { lowStockThreshold: input.lowStockThreshold },
    });
  }

  const row = await db.inventory.findUniqueOrThrow({
    where: { id: stock.id },
  });
  return {
    id: row.id,
    onHand: row.quantityOnHand,
    reserved: row.quantityReserved,
    lowStockThreshold: row.lowStockThreshold,
  };
}

export async function restockSoldLines(
  db: Db,
  orderId: string,
  lines: OrderStockLine[],
  actorUserId: string,
): Promise<void> {
  for (const line of lines) {
    const stock = await loadStock(db, line.variantId);
    if (await hasTxn(db, orderId, stock.id, 'RETURN')) {
      continue;
    }
    const applied = applyAdjustment(stock, line.quantity);
    if (!applied.ok) {
      logger.warn('Refund restock skipped', {
        orderId,
        variantId: line.variantId,
        reason: applied.reason,
      });
      continue;
    }
    await writeSnapshot(db, stock.id, applied, {
      type: 'RETURN',
      quantityDelta: line.quantity,
      orderId,
      actorUserId,
      reason: 'admin_refund_restock',
    });
  }
}
