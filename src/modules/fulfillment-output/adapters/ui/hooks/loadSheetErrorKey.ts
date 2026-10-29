import { LoadSheetInvalidError } from '@/modules/fulfillment-output/domain/errors/loadSheetInvalid.error';
import { LoadSheetNotClosedError } from '@/modules/fulfillment-output/domain/errors/loadSheetNotClosed.error';
import type { MessageKey } from '@/shared/i18n/messages';

export function loadSheetErrorKey(caught: unknown, fallback: MessageKey): MessageKey {
  if (caught instanceof LoadSheetNotClosedError) {
    return 'loadSheetNotClosed';
  }
  if (caught instanceof LoadSheetInvalidError) {
    return 'loadSheetInvalid';
  }
  return fallback;
}
