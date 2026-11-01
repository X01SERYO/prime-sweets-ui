import test from 'node:test';
import assert from 'node:assert/strict';
import { realMarginPercent, suggestedSalePrice } from '../modules/catalog/domain/productPricing.ts';

test('suggested price is the wholesale cost plus 15 percent', () => {
  assert.equal(suggestedSalePrice(1000, 15), 1150);
  assert.equal(suggestedSalePrice(null, 15), null);
});

test('real margin uses the cost and avoids dividing by zero', () => {
  assert.equal(realMarginPercent(1500, 1000), 50);
  assert.equal(realMarginPercent(1000, 1000), 0);
  assert.equal(realMarginPercent(800, 1000), -20);
  assert.equal(realMarginPercent(1000, 0), null);
  assert.equal(realMarginPercent(null, 1000), null);
});
