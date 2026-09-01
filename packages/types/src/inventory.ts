export const INVENTORY_TXN_TYPES = [
  'STOCK_IN',
  'STOCK_OUT',
  'RESERVE',
  'RELEASE',
  'ADJUSTMENT',
  'SALE',
  'RETURN',
] as const;
export type InventoryTxnType = (typeof INVENTORY_TXN_TYPES)[number];

export type InventorySnapshot = {
  onHand: number;
  reserved: number;
};

export type InventoryApplyOk = InventorySnapshot & { ok: true };
export type InventoryApplyFail = {
  ok: false;
  reason: 'invalid_qty' | 'insufficient' | 'over_release';
};
export type InventoryApplyResult = InventoryApplyOk | InventoryApplyFail;

export function availableQuantity(onHand: number, reserved: number): number {
  return Math.max(0, onHand - reserved);
}

function invalidQty(qty: number): boolean {
  return !Number.isInteger(qty) || qty < 1;
}

/** Hold stock for a pending payment. */
export function applyReserve(
  stock: InventorySnapshot,
  qty: number,
): InventoryApplyResult {
  if (invalidQty(qty)) return { ok: false, reason: 'invalid_qty' };
  if (availableQuantity(stock.onHand, stock.reserved) < qty) {
    return { ok: false, reason: 'insufficient' };
  }
  return { ok: true, onHand: stock.onHand, reserved: stock.reserved + qty };
}

/**
 * Convert a reservation into a sale. If nothing is reserved (legacy unpaid
 * orders), sell from available on-hand instead.
 */
export function applyCommit(
  stock: InventorySnapshot,
  qty: number,
): InventoryApplyResult {
  if (invalidQty(qty)) return { ok: false, reason: 'invalid_qty' };
  if (stock.reserved >= qty && stock.onHand >= qty) {
    return {
      ok: true,
      onHand: stock.onHand - qty,
      reserved: stock.reserved - qty,
    };
  }
  if (availableQuantity(stock.onHand, stock.reserved) >= qty) {
    return {
      ok: true,
      onHand: stock.onHand - qty,
      reserved: stock.reserved,
    };
  }
  return { ok: false, reason: 'insufficient' };
}

/** Admin stock adjustment. Delta may be negative; on-hand cannot fall below reserved. */
export function applyAdjustment(
  stock: InventorySnapshot,
  delta: number,
): InventoryApplyResult {
  if (!Number.isInteger(delta) || delta === 0) {
    return { ok: false, reason: 'invalid_qty' };
  }
  const onHand = stock.onHand + delta;
  if (onHand < 0 || onHand < stock.reserved) {
    return { ok: false, reason: 'insufficient' };
  }
  return { ok: true, onHand, reserved: stock.reserved };
}

/** Return reserved units after a cancelled / failed payment. */
export function applyRelease(
  stock: InventorySnapshot,
  qty: number,
): InventoryApplyResult {
  if (invalidQty(qty)) return { ok: false, reason: 'invalid_qty' };
  if (stock.reserved < qty) {
    return { ok: false, reason: 'over_release' };
  }
  return { ok: true, onHand: stock.onHand, reserved: stock.reserved - qty };
}
