import { SaleDayClosedError } from '@/modules/sales/domain/errors/saleDayClosed.error';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import { SaleMustContainItemsError } from '@/modules/sales/domain/errors/saleMustContainItems.error';
import type { MessageKey } from '@/shared/i18n/messages';

export function saleErrorKey(caught: unknown, fallback: MessageKey): MessageKey {
  if (caught instanceof SaleDayClosedError) {
    return 'saleDayClosed';
  }
  if (caught instanceof SaleMustContainItemsError) {
    return 'saleMustContainItems';
  }
  if (caught instanceof SaleInvalidError) {
    return 'saleInvalid';
  }
  return fallback;
}
