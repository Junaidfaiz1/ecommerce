import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  IMAGE_SIZES,
  PRODUCT_LIST_IMAGE_TAKE,
  PRODUCT_LIST_VARIANT_TAKE,
  resolveThreeDBudget,
  shouldOptimizeRemoteImage,
  THREE_D_DPR_MAX,
  THREE_D_DPR_MAX_CONSTRAINED,
  THREE_D_SHADOW_MAP_CONSTRAINED,
} from '@vorqen/types';
import {
  productDetailInclude,
  productListInclude,
} from '../catalog/catalog.service';

describe('resolveThreeDBudget', () => {
  it('pauses the loop when the canvas is off-screen or the tab is hidden', () => {
    assert.equal(resolveThreeDBudget({ inViewport: false }).paused, true);
    assert.equal(resolveThreeDBudget({ inViewport: false }).frameloop, 'demand');
    assert.equal(
      resolveThreeDBudget({ documentHidden: true }).frameloop,
      'demand',
    );
    assert.equal(resolveThreeDBudget({ inViewport: true }).paused, false);
    assert.equal(resolveThreeDBudget({ inViewport: true }).frameloop, 'always');
  });

  it('tightens DPR, shadows, and HDRI on constrained devices', () => {
    const budget = resolveThreeDBudget({
      narrowViewport: true,
      saveData: true,
    });
    assert.deepEqual(budget.dpr, [1, THREE_D_DPR_MAX_CONSTRAINED]);
    assert.equal(budget.shadows, false);
    assert.equal(budget.environment, false);
    assert.equal(budget.shadowMapSize, THREE_D_SHADOW_MAP_CONSTRAINED);
    assert.equal(budget.antialias, false);
    assert.equal(budget.powerPreference, 'low-power');
  });

  it('keeps a higher desktop budget by default', () => {
    const budget = resolveThreeDBudget();
    assert.equal(budget.dpr[1], THREE_D_DPR_MAX);
    assert.equal(budget.shadows, true);
    assert.equal(budget.environment, true);
  });
});

describe('shouldOptimizeRemoteImage', () => {
  it('skips placeholder and relative URLs', () => {
    assert.equal(
      shouldOptimizeRemoteImage('https://placeholder.vorqen.local/gpu.jpg'),
      false,
    );
    assert.equal(shouldOptimizeRemoteImage('/local.png'), false);
  });

  it('allows R2 / Cloudflare CDN hosts', () => {
    assert.equal(
      shouldOptimizeRemoteImage('https://pub-abc.r2.dev/products/a.jpg'),
      true,
    );
    assert.equal(
      shouldOptimizeRemoteImage(
        'https://account.cloudflarestorage.com/bucket/a.jpg',
      ),
      true,
    );
  });
});

describe('catalog list include budget', () => {
  it('caps list images and variants at one row each', () => {
    assert.equal(PRODUCT_LIST_IMAGE_TAKE, 1);
    assert.equal(PRODUCT_LIST_VARIANT_TAKE, 1);
    assert.equal(productListInclude.images.take, PRODUCT_LIST_IMAGE_TAKE);
    assert.equal(productListInclude.variants.take, PRODUCT_LIST_VARIANT_TAKE);
    assert.equal('take' in productDetailInclude.images, false);
  });
});

describe('IMAGE_SIZES', () => {
  it('exposes card and gallery slots', () => {
    assert.match(IMAGE_SIZES.productCard, /33vw/);
    assert.match(IMAGE_SIZES.productGallery, /50vw/);
  });
});
