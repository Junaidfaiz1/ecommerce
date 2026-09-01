import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InsufficientStockError } from '../common/errors';
import {
  commitOrderStock,
  releaseOrderStock,
  reserveOrderStock,
} from './inventory.service';
import { IDS, seedShop } from '../test/fixtures';
import { createMemoryPrisma } from '../test/memory-prisma';

const orderId = 'order_stock_1';
const lines = [{ variantId: IDS.gpuVar, quantity: 3 }];

async function loadGpu(prisma: ReturnType<typeof createMemoryPrisma>) {
  return prisma.inventory.findUnique({ where: { variantId: IDS.gpuVar } });
}

describe('inventory reserve / commit / release', () => {
  it('reserves without reducing on-hand and is idempotent per order', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);

    await reserveOrderStock(prisma, orderId, lines);
    let stock = await loadGpu(prisma);
    assert.equal(stock?.quantityOnHand, 10);
    assert.equal(stock?.quantityReserved, 3);

    await reserveOrderStock(prisma, orderId, lines);
    stock = await loadGpu(prisma);
    assert.equal(stock?.quantityReserved, 3);

    const txns = await prisma.inventoryTransaction.count({
      where: { orderId, type: 'RESERVE' },
    });
    assert.equal(txns, 1);
  });

  it('rejects a reserve when available stock is too low', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await prisma.inventory.update({
      where: { variantId: IDS.gpuVar },
      data: { quantityOnHand: 2, quantityReserved: 0 },
    });

    await assert.rejects(
      () => reserveOrderStock(prisma, orderId, lines),
      InsufficientStockError,
    );
  });

  it('commits a reservation into a sale', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);

    await reserveOrderStock(prisma, orderId, lines);
    await commitOrderStock(prisma, orderId, lines);

    const stock = await loadGpu(prisma);
    assert.equal(stock?.quantityOnHand, 7);
    assert.equal(stock?.quantityReserved, 0);

    await commitOrderStock(prisma, orderId, lines);
    const again = await loadGpu(prisma);
    assert.equal(again?.quantityOnHand, 7);
    assert.equal(
      await prisma.inventoryTransaction.count({
        where: { orderId, type: 'SALE' },
      }),
      1,
    );
  });

  it('releases a reservation back to availability', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);

    await reserveOrderStock(prisma, orderId, lines);
    await releaseOrderStock(prisma, orderId, lines);

    const stock = await loadGpu(prisma);
    assert.equal(stock?.quantityOnHand, 10);
    assert.equal(stock?.quantityReserved, 0);

    await releaseOrderStock(prisma, orderId, lines);
    assert.equal(
      await prisma.inventoryTransaction.count({
        where: { orderId, type: 'RELEASE' },
      }),
      1,
    );
  });

  it('does not release after a sale has already committed', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);

    await reserveOrderStock(prisma, orderId, lines);
    await commitOrderStock(prisma, orderId, lines);
    await releaseOrderStock(prisma, orderId, lines);

    const stock = await loadGpu(prisma);
    assert.equal(stock?.quantityOnHand, 7);
    assert.equal(stock?.quantityReserved, 0);
    assert.equal(
      await prisma.inventoryTransaction.count({
        where: { orderId, type: 'RELEASE' },
      }),
      0,
    );
  });
});
