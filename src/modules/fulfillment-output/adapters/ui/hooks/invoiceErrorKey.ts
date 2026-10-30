import { CompanyProfileNotConfiguredError } from '@/modules/fulfillment-output/domain/errors/companyProfileNotConfigured.error';
import { InvoiceInvalidError } from '@/modules/fulfillment-output/domain/errors/invoiceInvalid.error';
import { InvoiceNotPrintableError } from '@/modules/fulfillment-output/domain/errors/invoiceNotPrintable.error';
import type { MessageKey } from '@/shared/i18n/messages';

export function invoiceErrorKey(caught: unknown, fallback: MessageKey): MessageKey {
  if (caught instanceof InvoiceNotPrintableError) {
    return 'invoiceNotPrintable';
  }
  if (caught instanceof CompanyProfileNotConfiguredError) {
    return 'companyProfileMissing';
  }
  if (caught instanceof InvoiceInvalidError) {
    return 'invoiceInvalid';
  }
  return fallback;
}

export function invoiceErrorKind(caught: unknown): 'business' | 'technical' {
  if (caught instanceof InvoiceNotPrintableError || caught instanceof CompanyProfileNotConfiguredError) {
    return 'business';
  }
  return 'technical';
}
