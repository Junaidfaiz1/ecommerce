import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loginHref, postAuthPath, registerHref, safeNextPath } from './auth-redirect';

describe('safeNextPath', () => {
  it('allows checkout and account return paths', () => {
    assert.equal(safeNextPath('/checkout'), '/checkout');
    assert.equal(safeNextPath('/account/orders'), '/account/orders');
  });

  it('rejects open redirects and auth loops', () => {
    assert.equal(safeNextPath('https://evil.test'), '/');
    assert.equal(safeNextPath('//evil.test'), '/');
    assert.equal(safeNextPath('/login'), '/');
    assert.equal(safeNextPath(null), '/');
  });
});

describe('loginHref / registerHref', () => {
  it('preserves checkout as next', () => {
    assert.equal(loginHref('/checkout'), '/login?next=%2Fcheckout');
    assert.equal(registerHref('/build'), '/register?next=%2Fbuild');
  });

  it('omits next for the home path', () => {
    assert.equal(loginHref('/'), '/login');
    assert.equal(registerHref(null), '/register');
  });
});

describe('postAuthPath', () => {
  it('honors a safe next path over role', () => {
    assert.equal(postAuthPath('/shop', 'ADMIN'), '/shop');
    assert.equal(postAuthPath('/account', 'CUSTOMER'), '/account');
  });

  it('sends staff to admin when next is absent or home', () => {
    assert.equal(postAuthPath(null, 'ADMIN'), '/admin');
    assert.equal(postAuthPath('/', 'SUPPORT'), '/admin');
  });

  it('sends customers home when next is absent', () => {
    assert.equal(postAuthPath(null, 'CUSTOMER'), '/');
    assert.equal(postAuthPath(null, null), '/');
  });
});
