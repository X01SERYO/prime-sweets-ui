import { DeliveryDateBeforeSaleError } from '@/modules/sales/domain/errors/deliveryDateBeforeSale.error';
import { DeliveryDateOutOfRangeError } from '@/modules/sales/domain/errors/deliveryDateOutOfRange.error';
import { DeliveryDateRequiredError } from '@/modules/sales/domain/errors/deliveryDateRequired.error';
import { SaleOutsideEditWindowError } from '@/modules/sales/domain/errors/saleOutsideEditWindow.error';
import { SaleAlreadyVoidedError } from '@/modules/sales/domain/errors/saleAlreadyVoided.error';
import { SaleCannotBeModifiedError } from '@/modules/sales/domain/errors/saleCannotBeModified.error';
import { SaleDayClosedError } from '@/modules/sales/domain/errors/saleDayClosed.error';
import { SaleInvalidError } from '@/modules/sales/domain/errors/saleInvalid.error';
import { SaleMustContainItemsError } from '@/modules/sales/domain/errors/saleMustContainItems.error';
import type { MessageKey } from '@/shared/i18n/messages';

export function saleErrorKey(caught: unknown, fallback: MessageKey): MessageKey {
  if (caught instanceof SaleDayClosedError) {
    return 'saleDayClosed';
  }
  if (caught instanceof SaleOutsideEditWindowError) {
    return 'saleOutsideEditWindow';
  }
  if (caught instanceof DeliveryDateRequiredError) {
    return 'deliveryDateRequired';
  }
  if (caught instanceof DeliveryDateBeforeSaleError) {
    return 'deliveryDateBeforeSale';
  }
  if (caught instanceof DeliveryDateOutOfRangeError) {
    return 'deliveryDateOutOfRange';
  }
  if (caught instanceof SaleMustContainItemsError) {
    return 'saleMustContainItems';
  }
  if (caught instanceof SaleAlreadyVoidedError) {
    return 'saleAlreadyVoided';
  }
  if (caught instanceof SaleCannotBeModifiedError) {
    return 'saleCannotBeModified';
  }
  if (caught instanceof SaleInvalidError) {
    return 'saleInvalid';
  }
  return fallback;
}
