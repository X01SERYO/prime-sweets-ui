import { SalesDayAlreadyClosedError } from '@/modules/sales-day/domain/errors/salesDayAlreadyClosed.error';
import { SalesDayAlreadyOpenError } from '@/modules/sales-day/domain/errors/salesDayAlreadyOpen.error';
import { SalesDayCannotBeReopenedError } from '@/modules/sales-day/domain/errors/salesDayCannotBeReopened.error';
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
  if (caught instanceof SalesDayAlreadyClosedError) {
    return 'salesDayAlreadyClosed';
  }
  if (caught instanceof SalesDayCannotBeReopenedError) {
    return 'salesDayCannotReopen';
  }
  if (caught instanceof SalesDayInvalidError) {
    return 'salesDayInvalid';
  }
  return fallback;
}
