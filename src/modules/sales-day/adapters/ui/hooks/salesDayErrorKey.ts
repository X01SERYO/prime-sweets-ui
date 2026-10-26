import { SalesDayAlreadyOpenError } from '@/modules/sales-day/domain/errors/salesDayAlreadyOpen.error';
import { SalesDayInvalidError } from '@/modules/sales-day/domain/errors/salesDayInvalid.error';
import { SalesDaySellerRequiredError } from '@/modules/sales-day/domain/errors/salesDaySellerRequired.error';
import type { MessageKey } from '@/shared/i18n/messages';

export function salesDayErrorKey(caught: unknown, fallback: MessageKey): MessageKey {
  if (caught instanceof SalesDaySellerRequiredError) {
    return 'salesDaySellerRequired';
  }
  if (caught instanceof SalesDayAlreadyOpenError) {
    return 'salesDayAlreadyOpen';
  }
  if (caught instanceof SalesDayInvalidError) {
    return 'salesDayInvalid';
  }
  return fallback;
}
