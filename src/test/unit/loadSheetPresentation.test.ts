import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
  filterProductRows,
  groupByBrand,
  marginRatio,
  toProductRows
} from '../../modules/fulfillment-output/domain/loadSheetPresentation.ts';
import type { LoadSheetLineModel } from '../../modules/fulfillment-output/domain/models/loadSheetLine.ts';

const lines: LoadSheetLineModel[] = [
  {
    productId: 'p1',
    brand: 'ADAMS',
    name: 'TRIDENT',
    wholesaleCost: 100,
    wholesaleSalePrice: 150,
    quantity: 2,
    totalPrice: 300,
    profit: 100,
    priceGroups: []
  },
  {
    productId: 'p2',
    brand: 'ADAMS',
    name: 'HALLS',
    wholesaleCost: 50,
    wholesaleSalePrice: 80,
    quantity: 1,
    totalPrice: 80,
    profit: 30,
    priceGroups: []
  }
];

test('groups confirmed lines by brand and filters without accents', () => {
  const rows = toProductRows(lines);
  assert.equal(marginRatio(100, 300), 100 / 300);
  const adams = groupByBrand(filterProductRows(rows, 'trident'), 'name');
  assert.equal(adams.length, 1);
  assert.equal(adams[0].products.length, 1);
  assert.equal(adams[0].sold, 300);
  assert.equal(groupByBrand(rows, 'gain')[0].gain, 130);
});
