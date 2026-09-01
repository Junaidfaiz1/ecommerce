import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sniffProductImageMime } from './image-file';

describe('sniffProductImageMime', () => {
  it('detects jpeg / png / webp magic bytes', () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const png = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    const webp = new Uint8Array(12);
    webp.set(Buffer.from('RIFF'), 0);
    webp.set(Buffer.from('WEBP'), 8);
    assert.equal(sniffProductImageMime(jpeg), 'image/jpeg');
    assert.equal(sniffProductImageMime(png), 'image/png');
    assert.equal(sniffProductImageMime(webp), 'image/webp');
  });

  it('rejects unknown bytes', () => {
    assert.equal(sniffProductImageMime(Uint8Array.from([1, 2, 3, 4])), null);
  });
});
