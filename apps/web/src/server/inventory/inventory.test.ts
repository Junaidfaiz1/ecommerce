import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyAdjustment,
  applyCommit,
  applyRelease,
  applyReserve,
  availableQuantity,
} from '@vorqen/types';

describe('availableQuantity', () => {
  it('never goes below zero', () => {
    assert.equal(availableQuantity(4, 1), 3);
    assert.equal(availableQuantity(2, 5), 0);
  });
});

describe('applyReserve', () => {
  it('holds units without reducing on-hand', () => {
    const next = applyReserve({ onHand: 10, reserved: 2 }, 3);
    assert.equal(next.ok, true);
    if (next.ok) {
      assert.equal(next.onHand, 10);
      assert.equal(next.reserved, 5);
    }
  });

  it('rejects when available is too low', () => {
    const next = applyReserve({ onHand: 5, reserved: 4 }, 2);
    assert.equal(next.ok, false);
    if (!next.ok) assert.equal(next.reason, 'insufficient');
  });

  it('rejects non-positive quantities', () => {
    const next = applyReserve({ onHand: 5, reserved: 0 }, 0);
    assert.equal(next.ok, false);
  });
});

describe('applyCommit', () => {
  it('converts reservation into a sale', () => {
    const next = applyCommit({ onHand: 10, reserved: 3 }, 3);
    assert.equal(next.ok, true);
    if (next.ok) {
      assert.equal(next.onHand, 7);
      assert.equal(next.reserved, 0);
    }
  });

  it('sells from available when reserved is less than qty', () => {
    const next = applyCommit({ onHand: 10, reserved: 1 }, 3);
    assert.equal(next.ok, true);
    if (next.ok) {
      assert.equal(next.onHand, 7);
      assert.equal(next.reserved, 1);
    }
  });

  it('sells from available when nothing is reserved', () => {
    const next = applyCommit({ onHand: 8, reserved: 0 }, 2);
    assert.equal(next.ok, true);
    if (next.ok) {
      assert.equal(next.onHand, 6);
      assert.equal(next.reserved, 0);
    }
  });

  it('rejects when neither reserved nor available covers qty', () => {
    const next = applyCommit({ onHand: 2, reserved: 2 }, 3);
    assert.equal(next.ok, false);
  });
});

describe('applyAdjustment', () => {
  it('increases on-hand without touching reserved', () => {
    const next = applyAdjustment({ onHand: 4, reserved: 1 }, 3);
    assert.equal(next.ok, true);
    if (next.ok) {
      assert.equal(next.onHand, 7);
      assert.equal(next.reserved, 1);
    }
  });

  it('rejects reducing on-hand below reserved', () => {
    const next = applyAdjustment({ onHand: 5, reserved: 4 }, -2);
    assert.equal(next.ok, false);
  });

  it('rejects a zero delta', () => {
    const next = applyAdjustment({ onHand: 5, reserved: 0 }, 0);
    assert.equal(next.ok, false);
  });
});

describe('applyRelease', () => {
  it('returns reserved units to availability', () => {
    const next = applyRelease({ onHand: 10, reserved: 4 }, 4);
    assert.equal(next.ok, true);
    if (next.ok) {
      assert.equal(next.onHand, 10);
      assert.equal(next.reserved, 0);
    }
  });

  it('rejects releasing more than reserved', () => {
    const next = applyRelease({ onHand: 10, reserved: 1 }, 2);
    assert.equal(next.ok, false);
    if (!next.ok) assert.equal(next.reason, 'over_release');
  });
});
