import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BUILDER_STEPS,
  previewBuildInputSchema,
  saveBuildInputSchema,
} from '@vorqen/types';
import { sumLineTotals } from './pricing';

describe('builder pricing helpers', () => {
  it('sums line totals as money strings', () => {
    assert.equal(
      sumLineTotals([
        { lineTotal: '100.00' },
        { lineTotal: '49.50' },
        { lineTotal: '10.25' },
      ]),
      '159.75',
    );
  });
});

describe('builder schemas', () => {
  it('accepts a valid preview payload', () => {
    const parsed = previewBuildInputSchema.parse({
      components: [
        { slot: 'CPU', productId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', quantity: 1 },
        { slot: 'GPU', productId: 'clyyyyyyyyyyyyyyyyyyyyyyyyy', quantity: 1 },
      ],
    });
    assert.equal(parsed.components.length, 2);
  });

  it('rejects duplicate single-slot components', () => {
    const result = previewBuildInputSchema.safeParse({
      components: [
        { slot: 'CPU', productId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', quantity: 1 },
        { slot: 'CPU', productId: 'clyyyyyyyyyyyyyyyyyyyyyyyyy', quantity: 1 },
      ],
    });
    assert.equal(result.success, false);
  });

  it('requires slug for public builds', () => {
    const result = saveBuildInputSchema.safeParse({
      name: 'Public rig',
      visibility: 'PUBLIC',
      components: [
        { slot: 'CPU', productId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', quantity: 1 },
      ],
    });
    assert.equal(result.success, false);
  });

  it('allows private save without slug', () => {
    const parsed = saveBuildInputSchema.parse({
      name: 'Desk build',
      visibility: 'PRIVATE',
      components: [
        { slot: 'CPU', productId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', quantity: 1 },
      ],
    });
    assert.equal(parsed.visibility, 'PRIVATE');
  });

  it('exposes nine builder steps ending in REVIEW', () => {
    assert.equal(BUILDER_STEPS.length, 9);
    assert.equal(BUILDER_STEPS.at(-1), 'REVIEW');
  });
});
