import type { MessageKey } from '@/shared/i18n/messages';
import { RetailInvalidError } from '@/modules/retail-sales/domain/errors/retailInvalid.error';

const codes: Record<string, MessageKey> = {
  RETAIL_DAY_CLOSED: 'retailClosed',
  PRODUCT_WITHOUT_RETAIL_PRICE: 'retailNoPrice',
  PRODUCT_NOT_FOUND_FOR_RETAIL: 'retailNotFound',
  RETAIL_ITEM_NOT_FOUND: 'retailNotFound'
};

export function retailErrorKey(error: unknown): MessageKey {
  if (error instanceof RetailInvalidError && error.code in codes) {
    return codes[error.code];
  }
  return 'retailSaveFailed';
}
