import { CustomerInvalidError } from '@/modules/customers/domain/errors/customerInvalid.error';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function toCustomer(raw: unknown): CustomerModel {
  if (!raw || typeof raw !== 'object') {
    throw new CustomerInvalidError();
  }
  const data = raw as Record<string, unknown>;
  if (
    typeof data.id !== 'string' ||
    typeof data.documentType !== 'string' ||
    typeof data.documentNumber !== 'string' ||
    typeof data.name !== 'string'
  ) {
    throw new CustomerInvalidError();
  }
  return {
    id: data.id,
    documentType: data.documentType,
    documentNumber: data.documentNumber,
    name: data.name,
    phone: textOrNull(data.phone),
    email: textOrNull(data.email),
    address: textOrNull(data.address)
  };
}

export function toCustomerList(raw: unknown): CustomerModel[] {
  if (!Array.isArray(raw)) {
    throw new CustomerInvalidError();
  }
  return raw.map(item => toCustomer(item));
}
