import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadRootEnv } from './load-root-env';

describe('loadRootEnv', () => {
  it('does not throw when called twice', () => {
    loadRootEnv();
    loadRootEnv();
    assert.equal(typeof loadRootEnv, 'function');
  });
});
