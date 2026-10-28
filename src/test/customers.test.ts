import assert from 'node:assert/strict';
import test from 'node:test';
import { CustomerAlreadyExistsError } from '../modules/customers/domain/errors/customerAlreadyExists.error.ts';
import { CustomerInvalidError } from '../modules/customers/domain/errors/customerInvalid.error.ts';
import { CustomerNotFoundError } from '../modules/customers/domain/errors/customerNotFound.error.ts';

test('customer errors keep a stable code', () => {
  assert.equal(new CustomerInvalidError().code, 'CUSTOMER_INVALID');
  assert.equal(new CustomerAlreadyExistsError().code, 'CUSTOMER_ALREADY_EXISTS');
  assert.equal(new CustomerNotFoundError().code, 'CUSTOMER_NOT_FOUND');
});
