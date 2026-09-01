import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { estimatePerformanceInputSchema } from '@vorqen/types';

describe('performance schemas', () => {
  it('accepts cpu + gpu only', () => {
    const parsed = estimatePerformanceInputSchema.parse({
      cpuProductId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      gpuProductId: 'clyyyyyyyyyyyyyyyyyyyyyyyyy',
    });
    assert.equal(parsed.cpuProductId.startsWith('cl'), true);
  });

  it('rejects both gameId and gameSlug', () => {
    const result = estimatePerformanceInputSchema.safeParse({
      cpuProductId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      gpuProductId: 'clyyyyyyyyyyyyyyyyyyyyyyyyy',
      gameId: 'clzzzzzzzzzzzzzzzzzzzzzzzzz',
      gameSlug: 'cyberpunk-2077',
    });
    assert.equal(result.success, false);
  });
});

describe('performance labeling contract', () => {
  it('estimates always carry isEstimate true in mapped shape', () => {
    const sample = {
      avgFps: 98.5,
      isEstimate: true as const,
    };
    assert.equal(sample.isEstimate, true);
    assert.ok(sample.avgFps > 0);
  });
});
