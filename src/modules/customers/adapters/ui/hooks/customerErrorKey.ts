import { CustomerAlreadyExistsError } from '@/modules/customers/domain/errors/customerAlreadyExists.error';
import { CustomerInvalidError } from '@/modules/customers/domain/errors/customerInvalid.error';
import { CustomerNotFoundError } from '@/modules/customers/domain/errors/customerNotFound.error';
import type { MessageKey } from '@/shared/i18n/messages';

export function customerErrorKey(caught: unknown, fallback: MessageKey): MessageKey {
  if (caught instanceof CustomerAlreadyExistsError) {
    return 'customerAlreadyExists';
  }
  if (caught instanceof CustomerNotFoundError) {
    return 'customerNotFound';
  }
  if (caught instanceof CustomerInvalidError) {
    return 'customerInvalid';
  }
  return fallback;
}
