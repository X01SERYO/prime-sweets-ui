import assert from 'node:assert/strict';
import test from 'node:test';
import { CatalogInvalidError } from '../modules/catalog/domain/errors/catalogInvalid.error.ts';
import { LoginResponseInvalidError } from '../modules/identity/domain/errors/loginResponseInvalid.error.ts';
import { DeliveryDateOutOfRangeError } from '../modules/sales/domain/errors/deliveryDateOutOfRange.error.ts';
import { formatCurrency } from '../shared/domain/money.ts';

test('formatCurrency formats Colombian pesos without decimals', () => {
  assert.match(formatCurrency(148500), /148\.500/);
});

test('domain errors keep a stable code', () => {
  assert.equal(new CatalogInvalidError().code, 'CATALOG_INVALID');
  assert.equal(new LoginResponseInvalidError().code, 'LOGIN_RESPONSE_INVALID');
  assert.equal(new DeliveryDateOutOfRangeError().code, 'DELIVERY_DATE_OUT_OF_RANGE');
});
