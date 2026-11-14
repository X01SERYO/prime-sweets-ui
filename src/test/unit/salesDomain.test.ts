import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
  addBusinessDays,
  businessToday,
  deliveryDaysThroughSunday,
  nextWeek,
  previousWeek,
  weekDeliveryDays
} from '../../modules/sales/domain/deliveryDays.ts';
import { isSellableQuantity } from '../../modules/sales/domain/quantity.ts';
import { addedSaleLineName, previewLineTotal } from '../../modules/sales/domain/saleLineName.ts';
import { canConfirmSale, canEditSaleLines, canRenameSaleLine, canVoidSale } from '../../modules/sales/domain/saleStatus.ts';

test('business dates stay inside the current week and reject a bad day', () => {
  assert.match(businessToday(new Date('2026-11-14T15:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(addBusinessDays('2026-11-14', 1), '2026-11-15');
  assert.equal(addBusinessDays('2026-02-31', 1), null);
  assert.equal(previousWeek('2026-11-14'), '2026-11-07');
  assert.equal(nextWeek('2026-11-14', '2026-11-14'), null);
  assert.equal(nextWeek('2026-11-07', '2026-11-14'), '2026-11-14');
  assert.equal(weekDeliveryDays('not-a-date').length, 0);
  assert.equal(weekDeliveryDays('2026-11-14').length, 7);
  assert.equal(deliveryDaysThroughSunday('2026-11-14').at(-1)?.date, '2026-11-15');
  assert.equal(deliveryDaysThroughSunday('bad').length, 0);
});

test('a sale line keeps a suffix and a quantity of up to 3 decimals', () => {
  assert.equal(addedSaleLineName('SODA', 'SODA roja'), ' roja');
  assert.equal(addedSaleLineName('SODA', 'SODA'), null);
  assert.equal(previewLineTotal(1000, 1.5), 1500);
  assert.equal(isSellableQuantity(1.25), true);
  assert.equal(isSellableQuantity(0), false);
  assert.equal(canEditSaleLines('CONFIRMED'), true);
  assert.equal(canRenameSaleLine('CONFIRMED'), false);
  assert.equal(canConfirmSale('DRAFT'), true);
  assert.equal(canVoidSale('DRAFT'), false);
});
