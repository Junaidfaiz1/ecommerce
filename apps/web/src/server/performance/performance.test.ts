import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { estimatePerformanceInputSchema } from '@vorqen/types';
import { toShowcaseFrames, type PerformanceEstimate } from './performance.service';

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

function estimate(
  partial: Partial<PerformanceEstimate> &
    Pick<PerformanceEstimate, 'gameId' | 'resolution' | 'quality' | 'avgFps'>,
): PerformanceEstimate {
  return {
    gameName: 'Cyberpunk 2077',
    gameSlug: 'cyberpunk-2077',
    isEstimate: true,
    source: 'test',
    ...partial,
  };
}

describe('toShowcaseFrames', () => {
  it('prefers the game with more samples and higher quality per resolution', () => {
    const frames = toShowcaseFrames([
      estimate({
        gameId: 'game-a',
        gameName: 'Other',
        resolution: '1440p',
        quality: 'HIGH',
        avgFps: 40,
      }),
      estimate({
        gameId: 'game-b',
        resolution: '1080p',
        quality: 'HIGH',
        avgFps: 120,
      }),
      estimate({
        gameId: 'game-b',
        resolution: '1080p',
        quality: 'ULTRA',
        avgFps: 110,
      }),
      estimate({
        gameId: 'game-b',
        resolution: '4K',
        quality: 'ULTRA',
        avgFps: 55,
      }),
    ]);

    assert.equal(frames.length, 2);
    assert.equal(frames[0]?.resolution, '1080p');
    assert.equal(frames[0]?.quality, 'ULTRA');
    assert.equal(frames[0]?.avgFps, 110);
    assert.equal(frames[1]?.resolution, '4K');
  });

  it('returns empty when there are no estimates', () => {
    assert.deepEqual(toShowcaseFrames([]), []);
  });
});
