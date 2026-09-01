import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isProceduralAssetUrl,
  parseProceduralKind,
  proceduralAssetUrl,
  product3DAssetsArgsSchema,
  PROCEDURAL_ASSET_PREFIX,
} from '@vorqen/types';
import { resolvePublicAssetUrl } from '../storage/urls';
import { product3dKey, productImageKey } from '../storage/paths';
import { TYPE_TO_KIND } from './three-d-assets.service';

describe('three-d schemas', () => {
  it('requires exactly one product locator', () => {
    assert.throws(() => product3DAssetsArgsSchema.parse({}));
    assert.throws(() =>
      product3DAssetsArgsSchema.parse({
        productId: 'clxxxxxxxxxxxxxxxxxxxxxx',
        productSlug: 'rtx-5090',
      }),
    );
    const byId = product3DAssetsArgsSchema.parse({
      productId: 'clxxxxxxxxxxxxxxxxxxxxxx',
    });
    assert.equal(byId.productId, 'clxxxxxxxxxxxxxxxxxxxxxx');
  });

  it('parses procedural asset URLs', () => {
    const url = proceduralAssetUrl('gpu');
    assert.equal(url, `${PROCEDURAL_ASSET_PREFIX}gpu`);
    assert.equal(isProceduralAssetUrl(url), true);
    assert.equal(parseProceduralKind(url), 'gpu');
    assert.equal(parseProceduralKind('https://cdn.example/x.glb'), null);
  });
});

describe('storage URL resolution', () => {
  it('passes through absolute and procedural URLs', () => {
    const empty = {
      accountId: null,
      accessKeyId: null,
      secretAccessKey: null,
      bucketName: null,
      publicUrl: null,
    };
    assert.equal(
      resolvePublicAssetUrl('https://cdn.example/a.glb', empty),
      'https://cdn.example/a.glb',
    );
    assert.equal(
      resolvePublicAssetUrl(proceduralAssetUrl('pc'), empty),
      proceduralAssetUrl('pc'),
    );
  });

  it('prefixes object keys with R2 public URL', () => {
    const url = resolvePublicAssetUrl('products/p1/3d/model.glb', {
      accountId: null,
      accessKeyId: null,
      secretAccessKey: null,
      bucketName: null,
      publicUrl: 'https://assets.vorqen.test',
    });
    assert.equal(url, 'https://assets.vorqen.test/products/p1/3d/model.glb');
  });

  it('builds canonical 3d keys', () => {
    assert.equal(
      product3dKey('prod_1', 'case.glb'),
      'products/prod_1/3d/case.glb',
    );
    assert.equal(
      productImageKey('prod_1', '../../evil.png'),
      'products/prod_1/images/evil.png',
    );
  });
});

describe('procedural kind map', () => {
  it('maps every catalog product type', () => {
    assert.equal(TYPE_TO_KIND.GPU, 'gpu');
    assert.equal(TYPE_TO_KIND.CASE, 'case');
    assert.equal(TYPE_TO_KIND.MOTHERBOARD, 'motherboard');
  });
});
